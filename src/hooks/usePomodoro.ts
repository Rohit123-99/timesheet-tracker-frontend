import { useCallback, useEffect, useRef, useState } from 'react';

export type PomodoroPhase = 'focus' | 'short_break' | 'long_break' | 'idle';

export interface PomodoroSettings {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  longBreakEvery: number; // long break after N focus cycles
}

export const DEFAULT_POMODORO_SETTINGS: PomodoroSettings = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  longBreakEvery: 4,
};

interface PersistedState {
  phase: PomodoroPhase;
  endsAt: number | null;   // ms epoch, null when paused
  remainingMs: number;     // when paused, ms left
  cyclesCompleted: number; // total focus cycles since last reset
  linkedTaskId: string | null;
}

const STORAGE_KEY = 'timesheet:pomodoro';

function loadState(): PersistedState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PersistedState) : null;
  } catch {
    return null;
  }
}

function saveState(state: PersistedState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

interface UsePomodoroProps {
  settings?: PomodoroSettings;
  /** Called once when a focus phase completes successfully. */
  onFocusComplete?: (focusMinutes: number, linkedTaskId: string | null) => void;
  /** Called when any phase completes (for OS notifications, sounds, etc.). */
  onPhaseEnd?: (endedPhase: PomodoroPhase, nextPhase: PomodoroPhase) => void;
}

export function usePomodoro({
  settings = DEFAULT_POMODORO_SETTINGS,
  onFocusComplete,
  onPhaseEnd,
}: UsePomodoroProps = {}) {
  const initial = loadState();
  const [phase, setPhase] = useState<PomodoroPhase>(initial?.phase ?? 'idle');
  const [endsAt, setEndsAt] = useState<number | null>(initial?.endsAt ?? null);
  const [remainingMs, setRemainingMs] = useState<number>(
    initial?.remainingMs ?? settings.focusMinutes * 60_000,
  );
  const [cyclesCompleted, setCyclesCompleted] = useState<number>(initial?.cyclesCompleted ?? 0);
  const [linkedTaskId, setLinkedTaskId] = useState<string | null>(initial?.linkedTaskId ?? null);

  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const handlingEndRef = useRef(false);

  const persist = useCallback(
    (patch: Partial<PersistedState>) => {
      const next: PersistedState = {
        phase,
        endsAt,
        remainingMs,
        cyclesCompleted,
        linkedTaskId,
        ...patch,
      };
      saveState(next);
    },
    [phase, endsAt, remainingMs, cyclesCompleted, linkedTaskId],
  );

  const phaseDurationMs = useCallback(
    (p: PomodoroPhase): number => {
      switch (p) {
        case 'focus': return settings.focusMinutes * 60_000;
        case 'short_break': return settings.shortBreakMinutes * 60_000;
        case 'long_break': return settings.longBreakMinutes * 60_000;
        default: return settings.focusMinutes * 60_000;
      }
    },
    [settings],
  );

  const nextPhaseAfter = useCallback(
    (current: PomodoroPhase, focusCycleCount: number): PomodoroPhase => {
      if (current === 'focus') {
        return focusCycleCount % settings.longBreakEvery === 0
          ? 'long_break'
          : 'short_break';
      }
      return 'focus';
    },
    [settings.longBreakEvery],
  );

  const startPhase = useCallback(
    (newPhase: PomodoroPhase) => {
      const duration = phaseDurationMs(newPhase);
      const ends = Date.now() + duration;
      setPhase(newPhase);
      setRemainingMs(duration);
      setEndsAt(ends);
      saveState({
        phase: newPhase,
        endsAt: ends,
        remainingMs: duration,
        cyclesCompleted,
        linkedTaskId,
      });
    },
    [phaseDurationMs, cyclesCompleted, linkedTaskId],
  );

  const startFocus = useCallback(() => startPhase('focus'), [startPhase]);

  const pause = useCallback(() => {
    if (endsAt === null) return;
    const remaining = Math.max(0, endsAt - Date.now());
    setEndsAt(null);
    setRemainingMs(remaining);
    persist({ endsAt: null, remainingMs: remaining });
  }, [endsAt, persist]);

  const resume = useCallback(() => {
    if (endsAt !== null) return;
    if (phase === 'idle') {
      startFocus();
      return;
    }
    const ends = Date.now() + remainingMs;
    setEndsAt(ends);
    persist({ endsAt: ends });
  }, [endsAt, phase, remainingMs, persist, startFocus]);

  const reset = useCallback(() => {
    setPhase('idle');
    setEndsAt(null);
    setRemainingMs(settings.focusMinutes * 60_000);
    setCyclesCompleted(0);
    saveState({
      phase: 'idle',
      endsAt: null,
      remainingMs: settings.focusMinutes * 60_000,
      cyclesCompleted: 0,
      linkedTaskId,
    });
  }, [settings.focusMinutes, linkedTaskId]);

  const skip = useCallback(() => {
    // End the current phase right now and roll over to the next.
    handlingEndRef.current = false; // ensure tick loop can run end handler
    setEndsAt(Date.now() - 1);
  }, []);

  const setLinked = useCallback(
    (taskId: string | null) => {
      setLinkedTaskId(taskId);
      persist({ linkedTaskId: taskId });
    },
    [persist],
  );

  // Tick + handle phase end
  useEffect(() => {
    if (endsAt === null) {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
      return;
    }
    tickRef.current = setInterval(() => {
      const remaining = endsAt - Date.now();
      if (remaining <= 0) {
        if (handlingEndRef.current) return;
        handlingEndRef.current = true;

        const endedPhase = phase;
        const newCycles = endedPhase === 'focus' ? cyclesCompleted + 1 : cyclesCompleted;
        const next = nextPhaseAfter(endedPhase, newCycles);

        // Fire callbacks before mutating state for predictability
        if (endedPhase === 'focus' && onFocusComplete) {
          onFocusComplete(settings.focusMinutes, linkedTaskId);
        }
        if (onPhaseEnd) onPhaseEnd(endedPhase, next);

        setCyclesCompleted(newCycles);
        // Auto-start next phase
        const duration = phaseDurationMs(next);
        const ends = Date.now() + duration;
        setPhase(next);
        setRemainingMs(duration);
        setEndsAt(ends);
        saveState({
          phase: next,
          endsAt: ends,
          remainingMs: duration,
          cyclesCompleted: newCycles,
          linkedTaskId,
        });
        handlingEndRef.current = false;
      } else {
        setRemainingMs(remaining);
      }
    }, 250);
    return () => {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
    };
  }, [
    endsAt,
    phase,
    cyclesCompleted,
    nextPhaseAfter,
    onFocusComplete,
    onPhaseEnd,
    phaseDurationMs,
    settings.focusMinutes,
    linkedTaskId,
  ]);

  const isRunning = endsAt !== null;
  const totalPhaseMs = phaseDurationMs(phase);
  const progressPct = totalPhaseMs === 0 ? 0 : 100 - (remainingMs / totalPhaseMs) * 100;

  return {
    phase,
    isRunning,
    remainingMs,
    progressPct,
    cyclesCompleted,
    linkedTaskId,
    setLinkedTaskId: setLinked,
    startFocus,
    pause,
    resume,
    reset,
    skip,
  };
}

export function formatMmSs(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
