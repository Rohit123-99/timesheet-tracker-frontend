import { Task } from '../types';

const API_BASE = 'http://127.0.0.1:8000/api';
const SETTINGS_UPDATED_EVENT = 'timesheet:settings-updated';

// Per-process token fetched from /api/auth/token at boot. The backend enforces
// this on POST/PUT/PATCH/DELETE so another browser tab on the same machine
// can't blind-write to your timesheet. Read-only GETs don't need it.
let sessionToken: string | null = null;
let sessionTokenPromise: Promise<string | null> | null = null;

async function loadSessionToken(): Promise<string | null> {
  try {
    const response = await fetch(`${API_BASE}/auth/token`);
    if (!response.ok) return null;
    const data = (await response.json()) as { token?: string; auth_required?: boolean };
    return data.token ?? null;
  } catch {
    return null;
  }
}

async function ensureSessionToken(): Promise<string | null> {
  if (sessionToken) return sessionToken;
  if (!sessionTokenPromise) sessionTokenPromise = loadSessionToken();
  sessionToken = await sessionTokenPromise;
  return sessionToken;
}

void ensureSessionToken();

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

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const method = (options?.method ?? 'GET').toUpperCase();
  const headers = new Headers(options?.headers ?? {});

  if (MUTATING_METHODS.has(method)) {
    const token = await ensureSessionToken();
    if (token) headers.set('X-Timesheet-Token', token);
  }

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
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

export interface StreakInfo {
  current_streak: number;
  longest_streak: number;
  daily_target: number;
  scanned_from: string;
  scanned_to: string;
}

export const fetchStreak = async (): Promise<StreakInfo> => {
  return request<StreakInfo>('/stats/streak');
};

export interface SprintOverviewTask {
  id: number;
  task_name: string;
  expected_hours: number;
  hours: number;
  block: string | null;
}

export interface SprintOverviewDay {
  date: string;
  day_number: number | null;
  tasks: SprintOverviewTask[];
  expected_hours: number;
  worked_hours: number;
  completion_pct: number;
  complete: boolean;
}

export interface SprintOverview {
  summary: {
    total_days: number;
    completed_days: number;
    total_expected: number;
    total_worked: number;
    overall_pct: number;
  };
  days: SprintOverviewDay[];
}

export const fetchSprintOverview = async (): Promise<SprintOverview> => {
  return request<SprintOverview>('/sprint/overview');
};

export const exportTasksCsv = async (): Promise<Blob> => {
  const response = await fetch(`${API_BASE}/export/csv`);
  if (!response.ok) throw new Error(`Export failed: ${response.status}`);
  return response.blob();
};

export interface SprintImportResult {
  status: string;
  start_date: string;
  end_date: string;
  days_parsed: number;
  created: number;
  skipped: number;
  deleted: number;
}

export const importSprintPlan = async (
  mdPath: string,
  startDate: string,
  replace: boolean,
): Promise<SprintImportResult> => {
  return request<SprintImportResult>('/import/sprint', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ md_path: mdPath, start_date: startDate, replace }),
  });
};

export const importSprintPlanInline = async (
  markdown: string,
  startDate: string,
  replace: boolean,
): Promise<SprintImportResult> => {
  return request<SprintImportResult>('/import/sprint/inline', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ markdown, start_date: startDate, replace }),
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
