import { Bell, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';

interface TimerAlertProps {
  show: boolean;
  taskName: string;
  estimatedHours: number;
  onDismiss: () => void;
  onSnooze?: () => void;
}

export function TimerAlert({
  show,
  taskName,
  estimatedHours,
  onDismiss,
  onSnooze,
}: TimerAlertProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          className="fixed top-4 right-4 z-50 w-96 bg-white dark:bg-gray-900 rounded-lg shadow-2xl border-2 border-orange-400 dark:border-orange-500 overflow-hidden"
        >
          <div className="bg-gradient-to-r from-orange-500 to-red-500 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <Bell className="w-5 h-5" />
              <h3 className="font-semibold">Estimated time reached</h3>
            </div>
            <button
              onClick={onDismiss}
              className="text-white hover:bg-white/20 rounded p-1 transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 space-y-3">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Task</p>
              <p className="font-semibold text-lg break-words">{taskName}</p>
            </div>

            <div className="bg-orange-50 dark:bg-orange-950/30 p-3 rounded-lg border border-orange-200 dark:border-orange-800">
              <p className="text-sm">
                This task has reached its estimated time of{' '}
                <span className="font-bold text-orange-600 dark:text-orange-400">
                  {estimatedHours}h
                </span>
                .
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Consider wrapping up or extending the estimate.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              {onSnooze && (
                <Button
                  onClick={onSnooze}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  Remind in 5 min
                </Button>
              )}
              <Button
                onClick={onDismiss}
                size="sm"
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
              >
                Dismiss
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
