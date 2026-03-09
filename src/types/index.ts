export interface Task {
  id: string;
  name: string;
  estimatedHours: number;
  actualHours: number;
  status: 'complete' | 'incomplete';
  notes: string;
  date: string;
  category: string;
}

export interface WeeklyData {
  day: string;
  hours: number;
  date: string;
}

export interface DailyGoal {
  target: number;
  worked: number;
}
