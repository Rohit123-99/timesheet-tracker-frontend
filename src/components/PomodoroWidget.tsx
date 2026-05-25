import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  Brain,
  Coffee,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
  Timer as TimerIcon,
  Volume2,
  VolumeX,
  Bell,
  X,
} from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { toast } from 'sonner';
import {
  formatMmSs,
  usePomodoro,
  type PomodoroPhase,
} from '../hooks/usePomodoro';
import { fetchTasksForDate, updateTask, showDesktopNotification } from '../data/api';
import type { Task as ApiTask } from '../types';
import {
  showStickyPhaseNotification,
  requestNotificationPermission,
} from '../utils/notifications';
import { playPhaseAlarm, playLongAlarm } from '../utils/audio';
import { toLocalDateString } from '../utils/helpers';
import { cn } from '../utils/cn';

const PHASE_META: Record<PomodoroPhase, { label: string; gradient: string; icon: React.ComponentType<{ className?: string }> }> = {
  focus: {
    label: 'Focus',
    gradient: 'from-blue-500 to-purple-500',
    icon: Brain,
  },
  short_break: {
    label: 'Short Break',
    gradient: 'from-green-500 to-emerald-500',
    icon: Coffee,
  },
  long_break: {
    label: 'Long Break',
    gradient: 'from-teal-500 to-cyan-500',
    icon: Coffee,
  },
  idle: {
    label: 'Pomodoro',
    gradient: 'from-slate-500 to-slate-600',
    icon: TimerIcon,
  },
};

interface PomodoroWidgetProps {
  /** Whether the widget is open (expanded). Defaults to collapsed. */
  defaultOpen?: boolean;
}

/**
 * Floating Pomodoro widget. Lives at the bottom-right corner on every page.
 *
 * - Collapsed: pill showing remaining time + phase + start/pause button.
 * - Expanded: full controls, task linker, cycle count, settings hint.
 *
 * When a focus phase completes, the elapsed minutes are added to the linked
 * task's `actualHours` via PUT /api/tasks/{id}. State (phase, end time, linked
 * task) is persisted in localStorage so the widget survives a refresh.
 */
const ALARM_PREF_KEY = 'timesheet:pomodoro-alarm-on';

export function PomodoroWidget({ defaultOpen = false }: PomodoroWidgetProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [todayTasks, setTodayTasks] = useState<ApiTask[]>([]);
  const [alarmOn, setAlarmOn] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem(ALARM_PREF_KEY) !== '0';
    } catch {
      return true;
    }
  });
  const alarmOnRef = useRef(alarmOn);
  useEffect(() => {
    alarmOnRef.current = alarmOn;
    try {
      window.localStorage.setItem(ALARM_PREF_KEY, alarmOn ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, [alarmOn]);

  const todayStr = useMemo(() => toLocalDateString(new Date()), []);

  // Load today's tasks for the linker dropdown.
  useEffect(() => {
    let cancelled = false;
    fetchTasksForDate(todayStr)
      .then((rows) => {
        if (!cancelled) setTodayTasks(rows);
      })
      .catch(() => {
        /* silent — widget shows "no tasks today" placeholder */
      });
    return () => {
      cancelled = true;
    };
  }, [todayStr]);

  const handleFocusComplete = useCallback(
    async (focusMinutes: number, linkedTaskId: string | null) => {
      if (!linkedTaskId) {
        toast.success(`Focus session complete (${focusMinutes}m). Link a task to auto-log next time.`);
        return;
      }
      try {
        const tasksToday = await fetchTasksForDate(todayStr);
        const target = tasksToday.find((t) => t.id === linkedTaskId);
        if (!target) {
          toast.message('Pomodoro complete (linked task not found today)');
          return;
        }
        const addHours = +(focusMinutes / 60).toFixed(2);
        const newActual = +(target.actualHours + addHours).toFixed(2);
        await updateTask(target.id, {
          name: target.name,
          estimatedHours: target.estimatedHours,
          actualHours: newActual,
          notes: target.notes,
          date: target.date,
          category: target.category,
        });
        toast.success(`Logged ${focusMinutes}m to "${target.name}"`);
        // refresh dropdown so hours show up
        setTodayTasks(await fetchTasksForDate(todayStr));
      } catch {
        toast.error('Pomodoro done, but failed to log hours');
      }
    },
    [todayStr],
  );

  const handlePhaseEnd = useCallback(
    (endedPhase: PomodoroPhase, nextPhase: PomodoroPhase) => {
      const ended = PHASE_META[endedPhase].label;
      const next = PHASE_META[nextPhase].label;

      const title = `${ended} complete — time for ${next}`;
      const body =
        endedPhase === 'focus'
          ? 'Step away from the screen for a bit.'
          : 'Break over. Ready for another focus session?';

      // 1. Audio alarm — louder/longer version when a long break ends
      if (alarmOnRef.current) {
        if (endedPhase === 'long_break') playLongAlarm();
        else playPhaseAlarm();
      }

      // 2. Native Windows toast (pops up on top of any other app) — this is
      //    what reaches the user when the timesheet window is in the
      //    background. Plays Windows' looping alarm sound and stays until
      //    dismissed.
      void showDesktopNotification(title, body);

      // 3. Browser Notification API as backup (in case running in a normal
      //    browser / dev mode without pywebview)
      showStickyPhaseNotification(title, body);

      // 4. Auto-expand the widget so the new phase + remaining time are
      //    visible without clicking
      setOpen(true);

      // 5. In-app toast as a final fallback
      toast(
        endedPhase === 'focus' ? `Focus done — ${next} starting` : `${next} starting now`,
        { duration: 6000 },
      );
    },
    [],
  );

  const handleTestAlarm = useCallback(() => {
    playPhaseAlarm();
    void showDesktopNotification(
      'Pomodoro test alarm',
      'This is what the end-of-phase alert looks like. You should also hear ~6 seconds of beeps.',
    );
    toast.success('Test alarm fired — listen for ~6 seconds of beeps and watch for the Windows toast');
  }, []);

  const {
    phase,
    isRunning,
    remainingMs,
    progressPct,
    cyclesCompleted,
    linkedTaskId,
    setLinkedTaskId,
    startFocus,
    pause,
    resume,
    reset,
    skip,
  } = usePomodoro({
    onFocusComplete: handleFocusComplete,
    onPhaseEnd: handlePhaseEnd,
  });

  // Prompt for notification permission once when user opens the widget.
  useEffect(() => {
    if (open) void requestNotificationPermission();
  }, [open]);

  const meta = PHASE_META[phase];
  const Icon = meta.icon;
  const showCollapsed = !open;

  // Render via portal so this widget is mounted directly under <body> — no
  // ancestor `transform` / `filter` / `contain: paint` can break its
  // `position: fixed` anchoring. Important inside pywebview where stacked
  // motion-wrapped layouts can otherwise re-anchor fixed children.
  if (typeof document === 'undefined') return null;

  // pointer-events is set with inline style because this project's frozen
  // Tailwind CSS contains `pointer-events-none` but NOT `pointer-events-auto`,
  // so a parent's `pointer-events-none` would otherwise eat all clicks on the
  // pomodoro button.
  return createPortal(
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 2147483646,
        pointerEvents: 'none',
      }}
    >
      <AnimatePresence mode="wait">
        {showCollapsed ? (
          <motion.button
            key="collapsed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={() => setOpen(true)}
            style={{ pointerEvents: 'auto' }}
            className={cn(
              'flex items-center gap-3 px-4 py-2.5 rounded-full shadow-lg border border-border bg-white/95 dark:bg-card/95 backdrop-blur transition-all hover:shadow-xl hover:scale-105 cursor-pointer',
            )}
            title="Open Pomodoro widget"
          >
            <div
              className={cn(
                'w-8 h-8 rounded-full bg-gradient-to-br flex items-center justify-center text-white shadow-sm',
                meta.gradient,
              )}
            >
              <Icon className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="text-xs text-muted-foreground leading-none mb-0.5">
                {meta.label}
                {phase !== 'idle' && cyclesCompleted > 0 && ` · #${cyclesCompleted}`}
              </p>
              <p className="font-mono text-sm font-semibold leading-none">
                {formatMmSs(remainingMs)}
              </p>
            </div>
            {isRunning ? (
              <Pause className="w-4 h-4 text-muted-foreground" />
            ) : (
              <Play className="w-4 h-4 text-muted-foreground" />
            )}
          </motion.button>
        ) : (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            style={{ pointerEvents: 'auto', width: 360 }}
          >
            <Card
              className="shadow-2xl border-border/60 overflow-hidden"
              style={{
                // Force opaque background. var(--card) resolves to the theme's
                // card surface; fallback covers dark mode if --card isn't set.
                background: 'var(--card, #111114)',
                color: 'var(--card-foreground, #f4f4f5)',
                maxHeight: 'calc(100vh - 32px)',
                overflowY: 'auto',
              }}
            >
              {/* Gradient header */}
              <div
                className={cn(
                  'bg-gradient-to-r flex items-center justify-between text-white',
                  meta.gradient,
                )}
                style={{ padding: '14px 16px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: 'rgba(255, 255, 255, 0.22)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
                    <p className="font-semibold">{meta.label}</p>
                    <p className="text-xs opacity-90" style={{ marginTop: 2 }}>
                      Cycle {cyclesCompleted + (phase === 'focus' ? 1 : 0)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="text-white/90 hover:text-white p-1 rounded transition-colors hover:bg-white/20"
                  aria-label="Collapse"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Timer + progress */}
                <div className="text-center">
                  <p
                    className="font-mono font-semibold tracking-tight tabular-nums"
                    style={{ fontSize: 56, lineHeight: 1 }}
                  >
                    {formatMmSs(remainingMs)}
                  </p>
                  <div
                    className="mt-3 w-full bg-muted rounded-full overflow-hidden"
                    style={{ height: 6 }}
                  >
                    <div
                      className={cn('h-full bg-gradient-to-r transition-[width] duration-500', meta.gradient)}
                      style={{ width: `${Math.min(100, Math.max(0, progressPct))}%`, height: '100%' }}
                    />
                  </div>
                </div>

                {/* Primary action: full-width button */}
                {isRunning ? (
                  <Button
                    onClick={pause}
                    variant="outline"
                    style={{ width: '100%', height: 44 }}
                    className="gap-2 font-semibold"
                  >
                    <Pause className="w-4 h-4" /> Pause
                  </Button>
                ) : phase === 'idle' ? (
                  <Button
                    onClick={startFocus}
                    style={{ width: '100%', height: 44 }}
                    className={cn(
                      'gap-2 text-white font-semibold bg-gradient-to-r shadow-md',
                      meta.gradient,
                    )}
                  >
                    <Play className="w-4 h-4" /> Start focus
                  </Button>
                ) : (
                  <Button
                    onClick={resume}
                    style={{ width: '100%', height: 44 }}
                    className={cn(
                      'gap-2 text-white font-semibold bg-gradient-to-r shadow-md',
                      meta.gradient,
                    )}
                  >
                    <Play className="w-4 h-4" /> Resume
                  </Button>
                )}

                {/* Secondary actions: two equal-width text buttons */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 8,
                  }}
                >
                  <Button
                    onClick={skip}
                    variant="outline"
                    className="gap-2"
                    title="End current phase early and roll to next"
                  >
                    <SkipForward className="w-3.5 h-3.5" />
                    <span className="text-xs">Skip phase</span>
                  </Button>
                  <Button
                    onClick={reset}
                    variant="outline"
                    className="gap-2"
                    title="Stop and reset cycle count"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span className="text-xs">Reset</span>
                  </Button>
                </div>

                {/* Task linker */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label
                    className="text-xs text-muted-foreground font-medium"
                    htmlFor="pomodoro-task-link"
                  >
                    Log focus minutes to task
                  </label>
                  <select
                    id="pomodoro-task-link"
                    value={linkedTaskId ?? ''}
                    onChange={(e) => setLinkedTaskId(e.target.value || null)}
                    className="rounded-md border border-border bg-background text-sm"
                    style={{ width: '100%', height: 36, padding: '0 8px' }}
                  >
                    <option value="">— No task (just timer)</option>
                    {todayTasks.length === 0 && (
                      <option disabled>No tasks for today yet</option>
                    )}
                    {todayTasks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.actualHours.toFixed(1)}/{t.estimatedHours}h)
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    Focus minutes are added to this task automatically when the session ends.
                  </p>
                </div>

                {/* Alarm controls */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 8,
                    borderTop: '1px solid var(--border, rgba(255,255,255,0.1))',
                    paddingTop: 12,
                  }}
                >
                  <Button
                    onClick={() => setAlarmOn((v) => !v)}
                    variant="outline"
                    className="gap-2"
                    title={alarmOn ? 'Mute end-of-phase alarm' : 'Un-mute end-of-phase alarm'}
                  >
                    {alarmOn ? (
                      <>
                        <Volume2 className="w-3.5 h-3.5 text-green-500" />
                        <span className="text-xs">Alarm on</span>
                      </>
                    ) : (
                      <>
                        <VolumeX className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-xs">Muted</span>
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleTestAlarm}
                    variant="outline"
                    className="gap-2"
                    title="Hear what the end-of-phase alarm sounds like"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span className="text-xs">Test alarm</span>
                  </Button>
                </div>

                {/* Footer info */}
                <div
                  className="flex items-center justify-between text-[11px] text-muted-foreground"
                >
                  <span>25m focus · 5m / 15m breaks</span>
                  <span>
                    {cyclesCompleted} {cyclesCompleted === 1 ? 'cycle' : 'cycles'} done
                  </span>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>,
    document.body,
  );
}
