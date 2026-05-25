import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Brain,
  Coffee,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
  Timer as TimerIcon,
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
import { fetchTasksForDate, updateTask } from '../data/api';
import type { Task as ApiTask } from '../types';
import {
  showSimpleNotification,
  requestNotificationPermission,
} from '../utils/notifications';
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
export function PomodoroWidget({ defaultOpen = false }: PomodoroWidgetProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [todayTasks, setTodayTasks] = useState<ApiTask[]>([]);

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

  const handlePhaseEnd = useCallback((endedPhase: PomodoroPhase, nextPhase: PomodoroPhase) => {
    const ended = PHASE_META[endedPhase].label;
    const next = PHASE_META[nextPhase].label;
    showSimpleNotification(`${ended} complete`, `Starting ${next}.`);
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

  return (
    <div className="fixed bottom-4 right-4 z-40 pointer-events-none">
      <AnimatePresence mode="wait">
        {showCollapsed ? (
          <motion.button
            key="collapsed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={() => setOpen(true)}
            className={cn(
              'pointer-events-auto flex items-center gap-3 px-4 py-2.5 rounded-full shadow-lg border border-border bg-white/95 dark:bg-card/95 backdrop-blur transition-all hover:shadow-xl hover:scale-105',
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
            className="pointer-events-auto"
          >
            <Card className="w-80 shadow-2xl border-border/60 overflow-hidden bg-white/95 dark:bg-card/95 backdrop-blur">
              <div className={cn('bg-gradient-to-r p-3 flex items-center justify-between text-white', meta.gradient)}>
                <div className="flex items-center gap-2">
                  <Icon className="w-5 h-5" />
                  <div>
                    <p className="font-semibold leading-none">{meta.label}</p>
                    <p className="text-xs opacity-90 mt-1">
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

              <div className="p-5 space-y-4">
                <div className="text-center">
                  <p className="font-mono text-5xl font-semibold tracking-tight">
                    {formatMmSs(remainingMs)}
                  </p>
                  <div className="mt-3 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full bg-gradient-to-r transition-[width] duration-500',
                        meta.gradient,
                      )}
                      style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2">
                  {isRunning ? (
                    <Button onClick={pause} variant="outline" className="gap-2">
                      <Pause className="w-4 h-4" /> Pause
                    </Button>
                  ) : phase === 'idle' ? (
                    <Button
                      onClick={startFocus}
                      className={cn('gap-2 text-white bg-gradient-to-r', meta.gradient)}
                    >
                      <Play className="w-4 h-4" /> Start focus
                    </Button>
                  ) : (
                    <Button
                      onClick={resume}
                      className={cn('gap-2 text-white bg-gradient-to-r', meta.gradient)}
                    >
                      <Play className="w-4 h-4" /> Resume
                    </Button>
                  )}
                  <Button onClick={skip} variant="outline" size="icon" title="Skip phase">
                    <SkipForward className="w-4 h-4" />
                  </Button>
                  <Button onClick={reset} variant="outline" size="icon" title="Reset cycle count">
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground" htmlFor="pomodoro-task-link">
                    Log focus minutes to task
                  </label>
                  <select
                    id="pomodoro-task-link"
                    value={linkedTaskId ?? ''}
                    onChange={(e) => setLinkedTaskId(e.target.value || null)}
                    className="w-full h-9 px-2 rounded-md border border-border bg-background text-sm"
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
                    When a focus session ends, its minutes are added to this task automatically.
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/60 pt-3">
                  <span>25 / 5 / 15 (long every 4)</span>
                  <span>{cyclesCompleted} cycles done</span>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
