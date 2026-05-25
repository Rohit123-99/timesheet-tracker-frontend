import { useCallback, useEffect, useRef, useState } from 'react';

export interface TimerState {
  isRunning: boolean;
  isPaused: boolean;
  elapsedSeconds: number;
  hasNotified: boolean;
}

interface UseTaskTimerProps {
  taskId: string;
  estimatedHours: number;
  taskName: string;
  onTimeComplete?: (taskId: string, taskName: string) => void;
}

interface PersistedTimer {
  startTimestamp: number;     // when the *current* run started (or last resume)
  accumulatedMs: number;      // ms accrued before this run (across previous pauses)
  isPaused: boolean;
  hasNotified: boolean;
  taskName: string;
}

const STORAGE_PREFIX = 'timesheet:timer:';

function loadPersisted(taskId: string): PersistedTimer | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + taskId);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedTimer;
    if (typeof parsed.startTimestamp !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

function savePersisted(taskId: string, state: PersistedTimer | null) {
  try {
    if (state) {
      window.localStorage.setItem(STORAGE_PREFIX + taskId, JSON.stringify(state));
    } else {
      window.localStorage.removeItem(STORAGE_PREFIX + taskId);
    }
  } catch {
    /* localStorage might be unavailable; ignore */
  }
}

/**
 * Per-task stopwatch with localStorage persistence.
 *
 * State is rebuilt on mount from localStorage, so refreshing the page (or
 * closing/reopening the desktop window) never loses elapsed time. A timer
 * that was running when the page closed comes back as **paused** so the user
 * can decide whether to resume or stop & save.
 */
export function useTaskTimer({
  taskId,
  estimatedHours,
  taskName,
  onTimeComplete,
}: UseTaskTimerProps) {
  // accumulatedMsRef = elapsed time captured before the *current* run.
  // When running, total elapsed = accumulatedMsRef + (now - startTimestampRef).
  const accumulatedMsRef = useRef<number>(0);
  const startTimestampRef = useRef<number>(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [timerState, setTimerState] = useState<TimerState>({
    isRunning: false,
    isPaused: false,
    elapsedSeconds: 0,
    hasNotified: false,
  });

  // Hydrate from localStorage on first render
  useEffect(() => {
    const persisted = loadPersisted(taskId);
    if (!persisted) return;

    // Anything that was running comes back paused — we shouldn't claim time
    // for the period the window was closed.
    accumulatedMsRef.current = persisted.accumulatedMs;
    startTimestampRef.current = 0;
    setTimerState({
      isRunning: false,
      isPaused: true,
      elapsedSeconds: Math.floor(persisted.accumulatedMs / 1000),
      hasNotified: persisted.hasNotified,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  const estimatedSeconds = estimatedHours * 3600;

  const persistRunning = useCallback(() => {
    savePersisted(taskId, {
      startTimestamp: startTimestampRef.current,
      accumulatedMs: accumulatedMsRef.current,
      isPaused: false,
      hasNotified: timerState.hasNotified,
      taskName,
    });
  }, [taskId, taskName, timerState.hasNotified]);

  const persistPaused = useCallback(
    (hasNotified: boolean) => {
      savePersisted(taskId, {
        startTimestamp: 0,
        accumulatedMs: accumulatedMsRef.current,
        isPaused: true,
        hasNotified,
        taskName,
      });
    },
    [taskId, taskName],
  );

  const startTimer = useCallback(() => {
    if (timerState.isRunning) return;
    startTimestampRef.current = Date.now();
    setTimerState((prev) => ({
      ...prev,
      isRunning: true,
      isPaused: false,
    }));
    persistRunning();
  }, [timerState.isRunning, persistRunning]);

  const pauseTimer = useCallback(() => {
    if (!timerState.isRunning) return;
    const runMs = Date.now() - startTimestampRef.current;
    accumulatedMsRef.current += runMs;
    startTimestampRef.current = 0;
    setTimerState((prev) => ({
      ...prev,
      isRunning: false,
      isPaused: true,
      elapsedSeconds: Math.floor(accumulatedMsRef.current / 1000),
    }));
    persistPaused(timerState.hasNotified);
  }, [timerState.isRunning, timerState.hasNotified, persistPaused]);

  const resumeTimer = useCallback(() => {
    if (!timerState.isPaused) return;
    startTimestampRef.current = Date.now();
    setTimerState((prev) => ({
      ...prev,
      isRunning: true,
      isPaused: false,
    }));
    persistRunning();
  }, [timerState.isPaused, persistRunning]);

  const stopTimer = useCallback((): number => {
    let totalMs = accumulatedMsRef.current;
    if (timerState.isRunning && startTimestampRef.current > 0) {
      totalMs += Date.now() - startTimestampRef.current;
    }

    accumulatedMsRef.current = 0;
    startTimestampRef.current = 0;
    setTimerState({
      isRunning: false,
      isPaused: false,
      elapsedSeconds: 0,
      hasNotified: false,
    });
    savePersisted(taskId, null);

    return totalMs / 1000 / 3600; // hours
  }, [taskId, timerState.isRunning]);

  const resetTimer = useCallback(() => {
    accumulatedMsRef.current = 0;
    startTimestampRef.current = 0;
    setTimerState({
      isRunning: false,
      isPaused: false,
      elapsedSeconds: 0,
      hasNotified: false,
    });
    savePersisted(taskId, null);
  }, [taskId]);

  // 1Hz tick while running. Recompute from timestamps so we don't drift even
  // if the browser throttles the interval.
  useEffect(() => {
    if (!timerState.isRunning) {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
      return;
    }
    tickRef.current = setInterval(() => {
      const totalMs = accumulatedMsRef.current + (Date.now() - startTimestampRef.current);
      const elapsed = Math.floor(totalMs / 1000);
      setTimerState((prev) => {
        const justCrossed =
          !prev.hasNotified &&
          elapsed >= estimatedSeconds &&
          estimatedSeconds > 0;
        if (justCrossed && onTimeComplete) {
          // Defer notification to avoid setState-during-render warnings
          queueMicrotask(() => onTimeComplete(taskId, taskName));
        }
        return {
          ...prev,
          elapsedSeconds: elapsed,
          hasNotified: prev.hasNotified || justCrossed,
        };
      });
    }, 1000);

    return () => {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
    };
  }, [
    timerState.isRunning,
    estimatedSeconds,
    onTimeComplete,
    taskId,
    taskName,
  ]);

  const formatTime = useCallback((): string => {
    const total = timerState.elapsedSeconds;
    const hrs = Math.floor(total / 3600);
    const mins = Math.floor((total % 3600) / 60);
    const secs = total % 60;
    return [hrs, mins, secs].map((n) => String(n).padStart(2, '0')).join(':');
  }, [timerState.elapsedSeconds]);

  return {
    timerState,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    resetTimer,
    formatTime,
    elapsedHours: timerState.elapsedSeconds / 3600,
  };
}
