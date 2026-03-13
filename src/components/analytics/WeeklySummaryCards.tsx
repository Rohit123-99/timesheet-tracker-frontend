import { Calendar, Clock, TrendingUp } from 'lucide-react';
import { SummaryMetricCard } from '../cards/SummaryMetricCard';

type WeeklySummaryCardsProps = {
  totalHours: number;
  dailyAvg: number;
  workingDays: number;
};

export function WeeklySummaryCards({ totalHours, dailyAvg, workingDays }: WeeklySummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <SummaryMetricCard title="Total Hours This Week" value={`${totalHours}h`} icon={Clock} tone="blue" />
      <SummaryMetricCard title="Daily Average" value={`${dailyAvg}h`} icon={TrendingUp} tone="purple" />
      <SummaryMetricCard title="Working Days" value={`${workingDays}`} icon={Calendar} tone="green" />
    </div>
  );
}
