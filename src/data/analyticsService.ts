import { fetchReportForRange, fetchWeeklyReport } from './api';

type ReportTask = {
  id: number;
  task_name: string;
  hours: number;
  expected_hours: number;
  notes: string;
  date: string;
  category: string;
};

type ReportDay = {
  date: string;
  day_name: string;
  hours: number;
  tasks: number;
};

type ReportResponse = {
  summary: {
    total_weekly_hours: number;
    daily_average: number;
    daily_target: number;
  };
  daily_breakdown: ReportDay[];
  raw_tasks: ReportTask[];
  range?: {
    start_date: string;
    end_date: string;
    days: number;
  };
};

export type TrendPoint = { day: string; hours: number; date: string };
export type CategoryPoint = { name: string; hours: number; color: string };
export type PerformancePoint = { subject: string; value: number; fullMark: number };
export type TaskRow = {
  id: number;
  name: string;
  category: string;
  hours: number;
  expected: number;
  notes: string;
  status: 'complete' | 'incomplete';
  progress: number;
};

export type AnalyticsViewModel = {
  rangeLabel: string;
  startDate: string;
  endDate: string;
  totalHours: number;
  targetHours: number;
  dailyAvg: number;
  completionRate: number;
  tasksDone: number;
  totalTasks: number;
  workingDays: number;
  peakDayLabel: string;
  peakDayHours: number;
  dailyTrend: TrendPoint[];
  weeklyTrend: TrendPoint[];
  categoryDistribution: CategoryPoint[];
  performanceMetrics: PerformancePoint[];
  taskRows: TaskRow[];
};

const CATEGORY_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#14b8a6', '#f97316'];

export function getDailyTrend(report: ReportResponse): TrendPoint[] {
  return report.daily_breakdown.map((d) => ({ day: d.day_name, hours: d.hours, date: d.date }));
}

export function getWeeklyHours(report: ReportResponse): TrendPoint[] {
  return getDailyTrend(report);
}

export function getCategoryDistribution(report: ReportResponse): CategoryPoint[] {
  const catMap: Record<string, number> = {};
  report.raw_tasks.forEach((task) => {
    if (task.hours > 0) {
      const key = task.category || 'Uncategorized';
      catMap[key] = (catMap[key] || 0) + task.hours;
    }
  });
  return Object.keys(catMap).map((name, index) => ({
    name,
    hours: Number(catMap[name].toFixed(1)),
    color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
  }));
}

export function getCompletionRate(report: ReportResponse): number {
  const total = report.raw_tasks.length;
  if (total === 0) return 0;
  const completed = report.raw_tasks.filter((task) => task.expected_hours > 0 && task.hours >= 0.8 * task.expected_hours).length;
  return Math.round((completed / total) * 100);
}

export function getWorkingDays(report: ReportResponse): number {
  return report.daily_breakdown.filter((day) => day.hours > 0).length;
}

function buildPerformanceMetrics(completionRate: number, workingDays: number, totalDays: number, totalHours: number, targetHours: number): PerformancePoint[] {
  const targetPct = targetHours > 0 ? Math.min(100, Math.round((totalHours / targetHours) * 100)) : 0;
  const consistency = totalDays > 0 ? Math.round((workingDays / totalDays) * 100) : 0;
  return [
    { subject: 'Productivity', value: targetPct, fullMark: 100 },
    { subject: 'Focus', value: Math.max(55, Math.round((targetPct + consistency) / 2)), fullMark: 100 },
    { subject: 'Efficiency', value: targetPct, fullMark: 100 },
    { subject: 'Consistency', value: consistency, fullMark: 100 },
    { subject: 'Quality', value: Math.max(50, completionRate), fullMark: 100 },
  ];
}

function toTaskRows(tasks: ReportTask[]): TaskRow[] {
  return tasks.map((task) => {
    const progress = task.expected_hours > 0 ? Math.round((task.hours / task.expected_hours) * 100) : 0;
    const complete = task.expected_hours > 0 && task.hours >= 0.8 * task.expected_hours;
    return {
      id: task.id,
      name: task.task_name,
      category: task.category || '-',
      hours: task.hours,
      expected: task.expected_hours,
      notes: task.notes || '-',
      status: complete ? 'complete' : 'incomplete',
      progress,
    };
  });
}

function toRangeLabel(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
}

function toViewModel(report: ReportResponse): AnalyticsViewModel {
  const dailyTrend = getDailyTrend(report);
  const weeklyTrend = getWeeklyHours(report);
  const categoryDistribution = getCategoryDistribution(report);
  const completionRate = getCompletionRate(report);
  const totalHours = Number(report.summary.total_weekly_hours.toFixed(1));
  const totalDays = report.range?.days ?? 7;
  const targetHours = Number((report.summary.daily_target * totalDays).toFixed(1));
  const workingDays = getWorkingDays(report);
  const tasksDone = report.raw_tasks.filter((task) => task.expected_hours > 0 && task.hours >= 0.8 * task.expected_hours).length;
  const totalTasks = report.raw_tasks.length;
  const peak = report.daily_breakdown.reduce(
    (acc, day) => (day.hours > acc.hours ? { day: day.day_name, hours: day.hours } : acc),
    { day: '-', hours: 0 }
  );

  const startDate = report.range?.start_date ?? report.daily_breakdown[0]?.date ?? '';
  const endDate = report.range?.end_date ?? report.daily_breakdown[report.daily_breakdown.length - 1]?.date ?? '';

  return {
    rangeLabel: startDate && endDate ? toRangeLabel(startDate, endDate) : 'Last 7 Days',
    startDate,
    endDate,
    totalHours,
    targetHours,
    dailyAvg: Number(report.summary.daily_average.toFixed(1)),
    completionRate,
    tasksDone,
    totalTasks,
    workingDays,
    peakDayLabel: peak.day,
    peakDayHours: Number(peak.hours.toFixed(1)),
    dailyTrend,
    weeklyTrend,
    categoryDistribution,
    performanceMetrics: buildPerformanceMetrics(completionRate, workingDays, totalDays, totalHours, targetHours),
    taskRows: toTaskRows(report.raw_tasks),
  };
}

export async function loadAnalytics(startDate?: string, endDate?: string): Promise<AnalyticsViewModel> {
  const report = (startDate && endDate)
    ? (await fetchReportForRange(startDate, endDate) as ReportResponse)
    : (await fetchWeeklyReport() as ReportResponse);
  return toViewModel(report);
}
