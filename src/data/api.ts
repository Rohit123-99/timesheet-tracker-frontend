import { Task } from '../types';

const API_BASE = 'http://127.0.0.1:8000/api';
const SETTINGS_UPDATED_EVENT = 'timesheet:settings-updated';

declare global {
  interface Window {
    pywebview?: {
      api?: {
        save_file_dialog?: (defaultName?: string) => Promise<string | null> | string | null;
        minimize_window?: () => Promise<boolean> | boolean;
        toggle_fullscreen_window?: () => Promise<boolean> | boolean;
        close_window?: () => Promise<boolean> | boolean;
      };
    };
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, options);
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed: ${response.status}`);
  }
  return (await response.json()) as T;
}

// --- API Helpers ---
export const fetchAllSettings = async (): Promise<any> => {
  return request('/settings');
};

export const updateAllSettings = async (settings: any): Promise<void> => {
  await request('/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  });
  window.dispatchEvent(new CustomEvent(SETTINGS_UPDATED_EVENT));
};

export const fetchTasksForDate = async (dateStr: string): Promise<Task[]> => {
  const data = await request<any[]>(`/tasks/${dateStr}`);
  
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
  await request('/tasks', {
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

export const updateTask = async (id: string, task: Omit<Task, 'id' | 'status'>): Promise<void> => {
  await request(`/tasks/${id}`, {
    method: 'PUT',
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

export const deleteTask = async (id: string): Promise<void> => {
  await request(`/tasks/${id}`, {
    method: 'DELETE'
  });
};

export const fetchWeeklyReport = async (): Promise<any> => {
  return request('/reports/weekly');
};

export const fetchReportForRange = async (startDate: string, endDate: string): Promise<any> => {
  const params = new URLSearchParams({ start_date: startDate, end_date: endDate });
  return request(`/reports/range?${params.toString()}`);
};

export const getApiBase = (): string => API_BASE;

export const exportWeeklyReportPdf = async (): Promise<Blob> => {
  const response = await fetch(`${API_BASE}/reports/export`);
  if (!response.ok) {
    throw new Error(`Export failed: ${response.status}`);
  }
  return response.blob();
};

export const exportReportPdfForRange = async (startDate: string, endDate: string): Promise<Blob> => {
  const params = new URLSearchParams({ start_date: startDate, end_date: endDate });
  const response = await fetch(`${API_BASE}/reports/export?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Export failed: ${response.status}`);
  }
  return response.blob();
};

export const exportWeeklyReportPdfToPath = async (filepath: string): Promise<void> => {
  await request('/reports/export/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filepath })
  });
};

export const exportReportPdfForRangeToPath = async (filepath: string, startDate: string, endDate: string): Promise<void> => {
  await request('/reports/export/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filepath, start_date: startDate, end_date: endDate })
  });
};

export const exportAllData = async (): Promise<Blob> => {
  const response = await fetch(`${API_BASE}/export/all`);
  if (!response.ok) {
    throw new Error(`Export failed: ${response.status}`);
  }
  return response.blob();
};

export const choosePdfSavePath = async (defaultName = 'Weekly_Report.pdf'): Promise<string | null> => {
  const dialog = window.pywebview?.api?.save_file_dialog;
  if (!dialog) return null;
  const selected = await dialog(defaultName);
  return selected || null;
};

export const minimizeDesktopWindow = async (): Promise<boolean> => {
  const fn = window.pywebview?.api?.minimize_window;
  if (!fn) return false;
  return Boolean(await fn());
};

export const toggleDesktopFullscreen = async (): Promise<boolean> => {
  const fn = window.pywebview?.api?.toggle_fullscreen_window;
  if (!fn) return false;
  return Boolean(await fn());
};

export const closeDesktopWindow = async (): Promise<boolean> => {
  const fn = window.pywebview?.api?.close_window;
  if (!fn) return false;
  return Boolean(await fn());
};

export const notifySettingsUpdated = (): void => {
  window.dispatchEvent(new CustomEvent(SETTINGS_UPDATED_EVENT));
};

export const onSettingsUpdated = (handler: () => void): (() => void) => {
  const wrapped = () => handler();
  window.addEventListener(SETTINGS_UPDATED_EVENT, wrapped);
  return () => window.removeEventListener(SETTINGS_UPDATED_EVENT, wrapped);
};

// Keep categories static for the UI dropdown
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
