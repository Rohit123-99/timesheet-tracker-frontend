import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { CircularProgress } from '../components/CircularProgress';
import { StatCard } from '../components/StatCard';
import { AddTaskModal } from '../components/AddTaskModal';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import {
  Clock,
  TrendingUp,
  Target,
  Plus,
  CheckCircle2,
  Edit2,
  Circle,
  Trash2,
  ListChecks,
  Save,
  X,
} from 'lucide-react';
import { Task } from '../types';
import {
  fetchAllSettings,
  fetchTasksForDate,
  createTask,
  deleteTask,
  updateTask,
  updateAllSettings,
  fetchWeeklyReport,
  mockCategories,
} from '../data/api';
import { formatHours, toLocalDateString } from '../utils/helpers';
import { toast } from 'sonner';
import { useSelectedDate } from '../contexts/DateContext';

type EditForm = {
  name: string;
  estimatedHours: string;
  actualHours: string;
  category: string;
  notes: string;
};

export default function Dashboard() {
  const { selectedDate } = useSelectedDate();
  const [dailyGoal, setDailyGoal] = useState(8);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [yesterdayTasks, setYesterdayTasks] = useState<Task[]>([]);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [goalInput, setGoalInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [weeklyAverage, setWeeklyAverage] = useState(0);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);

  const todayStr = toLocalDateString(selectedDate);
  const yesterdayStr = toLocalDateString(new Date(selectedDate.getTime() - 24 * 60 * 60 * 1000));

  const loadData = async () => {
    try {
      const [settings, dailyTasks, previousDayTasks, weeklyReport] = await Promise.all([
        fetchAllSettings(),
        fetchTasksForDate(todayStr),
        fetchTasksForDate(yesterdayStr),
        fetchWeeklyReport(),
      ]);
      setDailyGoal(settings.target_hours);
      setTasks(dailyTasks);
      setYesterdayTasks(previousDayTasks);
      setWeeklyAverage(weeklyReport.summary?.daily_average ?? 0);
    } catch (e) {
      console.error('Failed to fetch data:', e);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [todayStr, yesterdayStr]);

  const todayTasks = tasks;
  const yesterdayTotalWorked = yesterdayTasks.reduce((sum, task) => sum + task.actualHours, 0);
  const totalWorked = todayTasks.reduce((sum, task) => sum + task.actualHours, 0);
  const remaining = Math.max(0, dailyGoal - totalWorked);
  const progressPercentage = dailyGoal > 0 ? (totalWorked / dailyGoal) * 100 : 0;
  const hasComparison = yesterdayTotalWorked > 0;
  const hoursDeltaPct = hasComparison
    ? ((totalWorked - yesterdayTotalWorked) / yesterdayTotalWorked) * 100
    : 0;
  const todayTrend = hasComparison
    ? { value: `${Math.abs(hoursDeltaPct).toFixed(0)}%`, isPositive: hoursDeltaPct >= 0, label: 'vs yesterday' }
    : undefined;

  const handleAddTask = async (taskData: Omit<Task, 'id' | 'status'>) => {
    try {
      await createTask(taskData);
      toast.success('Task added');
      await loadData();
    } catch {
      toast.error('Failed to add task');
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await deleteTask(id);
      toast.success('Task removed');
      await loadData();
    } catch {
      toast.error('Failed to delete task');
    }
  };

  const handleToggleStatus = async (task: Task) => {
    if (editingTaskId === task.id) return;

    const newActualHours = task.status === 'complete' ? 0 : task.estimatedHours || 1;

    try {
      await updateTask(task.id, {
        name: task.name,
        estimatedHours: task.estimatedHours,
        actualHours: newActualHours,
        notes: task.notes,
        date: task.date,
        category: task.category,
      });
      await loadData();
    } catch {
      toast.error('Failed to update task status');
    }
  };

  const startEditing = (task: Task) => {
    setEditingTaskId(task.id);
    setEditForm({
      name: task.name,
      estimatedHours: String(task.estimatedHours),
      actualHours: String(task.actualHours),
      category: task.category || '',
      notes: task.notes || '',
    });
  };

  const cancelEditing = () => {
    setEditingTaskId(null);
    setEditForm(null);
  };

  const saveEditing = async (task: Task) => {
    if (!editForm) return;

    const estimated = Number(editForm.estimatedHours);
    const actual = Number(editForm.actualHours);

    if (!editForm.name.trim()) {
      toast.error('Task name is required');
      return;
    }

    if (Number.isNaN(estimated) || estimated < 0 || Number.isNaN(actual) || actual < 0) {
      toast.error('Hours must be valid non-negative numbers');
      return;
    }

    try {
      await updateTask(task.id, {
        name: editForm.name.trim(),
        estimatedHours: estimated,
        actualHours: actual,
        notes: editForm.notes.trim(),
        date: task.date,
        category: editForm.category.trim(),
      });
      toast.success('Task updated');
      cancelEditing();
      await loadData();
    } catch {
      toast.error('Failed to update task');
    }
  };

  const handleChangeGoal = async () => {
    const newGoal = Number(goalInput);
    if (Number.isNaN(newGoal) || newGoal < 0) {
      toast.error('Please enter a valid goal value');
      return;
    }

    try {
      const settings = await fetchAllSettings();
      await updateAllSettings({ ...settings, target_hours: newGoal });
      toast.success('Daily goal updated');
      setShowGoalDialog(false);
      await loadData();
    } catch {
      toast.error('Failed to update daily goal');
    }
  };

  if (isLoading) return <div className="p-6">Loading dashboard...</div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Dashboard</h2>
        <p className="text-sm text-muted-foreground mt-1">Track daily progress and today's execution</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Hours Today"
          value={formatHours(totalWorked)}
          icon={Clock}
          gradient="from-blue-500 to-cyan-500"
          trend={todayTrend}
          trendMessage={hasComparison ? undefined : 'No comparison available'}
        />
        <StatCard
          title="Tasks Completed"
          value={`${todayTasks.filter((t) => t.status === 'complete').length}/${todayTasks.length}`}
          icon={CheckCircle2}
          gradient="from-emerald-600 to-teal-700"
        />
        <StatCard
          title="Weekly Average"
          value={`${weeklyAverage.toFixed(1)}h`}
          icon={TrendingUp}
          gradient="from-purple-500 to-pink-500"
          description="Per day"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 bg-gradient-to-br from-card to-card/50 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Daily Goal & Progress</h3>
            <Button
              variant="ghost"
              size="sm"
              className="w-8 h-8 p-0 rounded-lg bg-muted/40 hover:bg-muted/70"
              onClick={() => {
                setGoalInput(String(dailyGoal));
                setShowGoalDialog(true);
              }}
            >
              <Edit2 className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex flex-col items-center">
            <CircularProgress percentage={progressPercentage} />

            <div className="mt-6 w-full space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-muted-foreground">Daily Goal</span>
                </div>
                <span className="font-semibold">{formatHours(dailyGoal)}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm text-muted-foreground">Worked</span>
                </div>
                <span className="font-semibold">{formatHours(totalWorked)}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-500" />
                  <span className="text-sm text-muted-foreground">Remaining</span>
                </div>
                <span className="font-semibold">{formatHours(remaining)}</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-2 p-6 bg-gradient-to-br from-card to-card/50 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Today's Tasks</h3>
            <Button
              onClick={() => setShowAddTask(true)}
              className="gap-2 text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              <Plus className="w-4 h-4" />
              Add Task
            </Button>
          </div>

          <div className="space-y-3">
            {todayTasks.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ListChecks className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No tasks for today. Add one to get started.</p>
              </div>
            ) : (
              todayTasks.map((task) => {
                const isEditing = editingTaskId === task.id && editForm;

                return (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ x: isEditing ? 0 : 4 }}
                    className={`
                      p-4 rounded-xl border transition-all
                      ${
                        task.status === 'complete'
                          ? 'bg-green-50/95 border-green-200 text-foreground dark:bg-green-950/25 dark:border-green-800/70'
                          : 'bg-muted/30 border-border hover:border-border/80 hover:bg-muted/40'
                      }
                    `}
                  >
                    <div className="grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-4 flex items-center gap-3 min-w-0">
                        <button
                          onClick={() => handleToggleStatus(task)}
                          className="focus:outline-none flex-shrink-0 transition-transform hover:scale-110 active:scale-95"
                        >
                          {task.status === 'complete' ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <Circle className="w-5 h-5 text-muted-foreground hover:text-cyan-600" />
                          )}
                        </button>

                        {isEditing ? (
                          <div className="w-full space-y-1">
                            <Input
                              value={editForm.name}
                              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                              placeholder="Task name"
                              className="h-9"
                            />
                            <Input
                              value={editForm.category}
                              onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                              placeholder="Category"
                              className="h-9"
                            />
                          </div>
                        ) : (
                          <div>
                            <p className="font-medium">{task.name}</p>
                            <p className={`text-xs ${task.status === 'complete' ? 'text-green-700 dark:text-green-400' : 'text-muted-foreground'}`}>{task.category}</p>
                          </div>
                        )}
                      </div>

                      <div className="col-span-2 text-center">
                        {isEditing ? (
                          <Input
                            type="number"
                            step="0.25"
                            min="0"
                            value={editForm.estimatedHours}
                            onChange={(e) => setEditForm({ ...editForm, estimatedHours: e.target.value })}
                          />
                        ) : (
                          <>
                            <p className={`text-sm ${task.status === 'complete' ? 'text-foreground' : 'text-muted-foreground'}`}>Estimated</p>
                            <p className="font-medium">{formatHours(task.estimatedHours)}</p>
                          </>
                        )}
                      </div>

                      <div className="col-span-2 text-center">
                        {isEditing ? (
                          <Input
                            type="number"
                            step="0.25"
                            min="0"
                            value={editForm.actualHours}
                            onChange={(e) => setEditForm({ ...editForm, actualHours: e.target.value })}
                          />
                        ) : (
                          <>
                            <p className={`text-sm ${task.status === 'complete' ? 'text-foreground' : 'text-muted-foreground'}`}>Actual</p>
                            <p className="font-medium">{formatHours(task.actualHours)}</p>
                          </>
                        )}
                      </div>

                      <div className="col-span-2 text-center">
                        {isEditing ? (
                          <span className="text-xs text-muted-foreground">Will auto-update after save</span>
                        ) : (
                          <span
                            className={`
                              inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium
                              ${
                                task.status === 'complete'
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400'
                              }
                            `}
                          >
                            {task.status === 'complete' ? 'Complete' : 'Incomplete'}
                          </span>
                        )}
                      </div>

                      <div className="col-span-1 min-w-0">
                        {isEditing ? (
                          <Input
                            value={editForm.notes}
                            onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                            placeholder="Notes"
                          />
                        ) : (
                          <p className={`text-sm truncate ${task.status === 'complete' ? 'text-green-700 dark:text-green-400' : 'text-muted-foreground'}`} title={task.notes}>
                            {task.notes || '-'}
                          </p>
                        )}
                      </div>

                      <div className="col-span-1 flex items-center justify-center gap-1">
                        {isEditing ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => saveEditing(task)}
                              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                            >
                              <Save className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={cancelEditing}>
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => startEditing(task)}>
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTask(task.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </Card>
      </div>

      <AddTaskModal
        open={showAddTask}
        onOpenChange={setShowAddTask}
        onAddTask={handleAddTask}
        categories={mockCategories}
        initialDate={selectedDate}
      />

      <Dialog open={showGoalDialog} onOpenChange={setShowGoalDialog}>
        <DialogContent className="w-[min(28rem,calc(100%-2rem))] !max-w-[min(28rem,calc(100%-2rem))] sm:!max-w-[min(28rem,calc(100%-2rem))]">
          <DialogHeader>
            <DialogTitle>Update Daily Goal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="number"
              min="0"
              step="0.25"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              placeholder="Enter hours"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowGoalDialog(false)}>
                Cancel
              </Button>
              <Button
                className="text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                onClick={handleChangeGoal}
              >
                Save Goal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
