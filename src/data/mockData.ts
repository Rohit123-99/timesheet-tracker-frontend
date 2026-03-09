import { Task } from '../types';

const API_BASE = 'http://localhost:8000/api';

// --- API Helpers ---
export const fetchDailyGoal = async (): Promise<number> => {
  const res = await fetch(`${API_BASE}/settings/target_hours`);
  const data = await res.json();
  return data.target_hours || 8.0;
};

export const updateDailyGoal = async (hours: number): Promise<void> => {
  await fetch(`${API_BASE}/settings/target_hours`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ value: String(hours) })
  });
};

export const fetchTasksForDate = async (dateStr: string): Promise<Task[]> => {
  const res = await fetch(`${API_BASE}/tasks/${dateStr}`);
  const data = await res.json();
  
  return data.map((t: any) => ({
    id: String(t.id),
    name: t.task_name,
    estimatedHours: t.expected_hours,
    actualHours: t.hours,
    status: (t.hours > 0 && t.hours >= 0.8 * t.expected_hours) ? 'complete' : 'incomplete',
    notes: t.notes,
    date: t.date,
    category: t.category
  }));
};

export const createTask = async (task: Omit<Task, 'id' | 'status'>): Promise<void> => {
  await fetch(`${API_BASE}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      task_name: task.name,
      hours: task.actualHours,
      expected_hours: task.estimatedHours,
      notes: task.notes,
      date: task.date,
      category: task.category
    })
  });
};

export const fetchWeeklyReport = async (): Promise<any> => {
  const res = await fetch(`${API_BASE}/reports/weekly`);
  return res.json();
};

// Replace dynamic dropdown mapping with some static examples to prevent build errors
export const mockCategories = [
  'Development',
  'Design',
  'Meeting',
  'Testing',
  'Documentation',
  'Research',
  'Planning',
  'Bug Fixing'
];
