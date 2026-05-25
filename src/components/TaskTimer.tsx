import { Play, Pause, Square, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { useTaskTimer } from '../hooks/useTaskTimer';
import { cn } from '../utils/cn';

interface TaskTimerProps {
  taskId: string;
  taskName: string;
  estimatedHours: number;
  onTimeUpdate: (taskId: string, elapsedHours: number) => void;
  onNotification: (taskId: string, taskName: string) => void;
}

export function TaskTimer({
  taskId,
  taskName,
  estimatedHours,
  onTimeUpdate,
  onNotification,
}: TaskTimerProps) {
  const {
    timerState,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    formatTime,
  } = useTaskTimer({
    taskId,
    estimatedHours,
    taskName,
    onTimeComplete: onNotification,
  });

  const handleStop = () => {
    const elapsedHours = stopTimer();
    if (elapsedHours > 0) onTimeUpdate(taskId, elapsedHours);
  };

  const estSeconds = estimatedHours * 3600;
  const isOver = estSeconds > 0 && timerState.elapsedSeconds > estSeconds;
  const isNear =
    estSeconds > 0 &&
    !isOver &&
    timerState.elapsedSeconds > estSeconds * 0.9;
  const active = timerState.isRunning || timerState.isPaused;

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-sm transition-colors',
          active
            ? isOver
              ? 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-800'
              : isNear
              ? 'bg-orange-100 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 border border-orange-300 dark:border-orange-800'
              : 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-800'
            : 'bg-muted/50 text-muted-foreground border border-border',
        )}
      >
        <Clock className="w-3.5 h-3.5" />
        <span className="min-w-[70px]">{formatTime()}</span>
      </div>

      <div className="flex items-center gap-1">
        {!timerState.isRunning && !timerState.isPaused && (
          <Button
            variant="outline"
            size="sm"
            onClick={startTimer}
            className="h-8 w-8 p-0 hover:bg-green-50 dark:hover:bg-green-950/20 hover:border-green-300 dark:hover:border-green-800"
            title="Start timer"
          >
            <Play className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
          </Button>
        )}

        {timerState.isRunning && (
          <Button
            variant="outline"
            size="sm"
            onClick={pauseTimer}
            className="h-8 w-8 p-0 hover:bg-orange-50 dark:hover:bg-orange-950/20 hover:border-orange-300 dark:hover:border-orange-800"
            title="Pause timer"
          >
            <Pause className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
          </Button>
        )}

        {timerState.isPaused && (
          <Button
            variant="outline"
            size="sm"
            onClick={resumeTimer}
            className="h-8 w-8 p-0 hover:bg-green-50 dark:hover:bg-green-950/20 hover:border-green-300 dark:hover:border-green-800"
            title="Resume timer"
          >
            <Play className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
          </Button>
        )}

        {active && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleStop}
            className="h-8 w-8 p-0 hover:bg-red-50 dark:hover:bg-red-950/20 hover:border-red-300 dark:hover:border-red-800"
            title="Stop timer & save"
          >
            <Square className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
          </Button>
        )}
      </div>
    </div>
  );
}
