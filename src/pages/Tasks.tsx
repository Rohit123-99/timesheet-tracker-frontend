import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { AddTaskModal } from '../components/AddTaskModal';
import { Plus, CheckCircle2, Circle, Search, Filter, Trash2, Edit2, Save, X } from 'lucide-react';
import { Task } from '../types';
import { fetchTasksForDate, createTask, deleteTask, updateTask, mockCategories } from '../data/api';
import { formatHours, toLocalDateString } from '../utils/helpers';
import { toast } from 'sonner';

type EditForm = {
  name: string;
  estimatedHours: string;
  actualHours: string;
  category: string;
  notes: string;
};

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showAddTask, setShowAddTask] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'complete' | 'incomplete'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);

  const todayStr = toLocalDateString();

  const loadData = async () => {
    try {
      const dailyTasks = await fetchTasksForDate(todayStr);
      setTasks(dailyTasks);
    } catch (e) {
      console.error('Failed to fetch tasks:', e);
      toast.error('Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [todayStr]);

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || task.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

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
      toast.success('Task deleted');
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
      toast.error('Failed to update task');
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

  if (isLoading) return <div className="p-6">Loading tasks...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">All Tasks</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage and track all your tasks</p>
        </div>
        <Button
          onClick={() => setShowAddTask(true)}
          className="gap-2 text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
        >
          <Plus className="w-4 h-4" />
          Add Task
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'complete' | 'incomplete')}
              className="h-10 min-w-[140px] px-3 rounded-lg border border-border bg-background text-sm"
            >
              <option value="all">All Tasks</option>
              <option value="complete">Complete</option>
              <option value="incomplete">Incomplete</option>
            </select>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="space-y-3">
          <div className="grid grid-cols-12 gap-4 pb-3 border-b border-border text-sm text-muted-foreground">
            <div className="col-span-3">Task Name</div>
            <div className="col-span-2 text-center">Estimated</div>
            <div className="col-span-2 text-center">Actual</div>
            <div className="col-span-2 text-center">Status</div>
            <div className="col-span-2">Notes</div>
            <div className="col-span-1 text-center">Actions</div>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No tasks found</p>
            </div>
          ) : (
            filteredTasks.map((task) => {
              const isEditing = editingTaskId === task.id && editForm;

              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ x: isEditing ? 0 : 4 }}
                className={`
                  p-4 rounded-lg border transition-all
                  ${
                    task.status === 'complete'
                        ? 'bg-green-50 border-green-200 text-foreground dark:bg-green-900/30 dark:border-green-800'
                        : 'bg-muted/30 border-border hover:border-border/80 hover:bg-muted/50'
                  }
                `}
              >
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-3 flex items-center gap-3 min-w-0">
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
                        <p className="text-sm">{formatHours(task.estimatedHours)}</p>
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
                        <p className="text-sm">{formatHours(task.actualHours)}</p>
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
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400'
                            }
                          `}
                        >
                          {task.status === 'complete' ? 'Complete' : 'Incomplete'}
                        </span>
                      )}
                    </div>

                    <div className="col-span-2 min-w-0">
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

      <AddTaskModal
        open={showAddTask}
        onOpenChange={setShowAddTask}
        onAddTask={handleAddTask}
        categories={mockCategories}
      />
    </div>
  );
}
