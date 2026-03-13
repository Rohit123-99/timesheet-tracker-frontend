import { Award, Clock, Target, TrendingUp } from 'lucide-react';
import { SummaryMetricCard } from '../cards/SummaryMetricCard';

type ReportsSummaryCardsGridProps = {
  totalHours: number;
  completionRate: number;
  dailyAvg: number;
  tasksDone: number;
};

export function ReportsSummaryCardsGrid({
  totalHours,
  completionRate,
  dailyAvg,
  tasksDone,
}: ReportsSummaryCardsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <SummaryMetricCard title="Total Hours" value={`${totalHours}h`} icon={Clock} tone="blue" />
      <SummaryMetricCard title="Completion" value={`${completionRate}%`} icon={Target} tone="purple" />
      <SummaryMetricCard title="Daily Avg" value={`${dailyAvg}h`} icon={TrendingUp} tone="green" />
      <SummaryMetricCard title="Tasks Done" value={`${tasksDone}`} icon={Award} tone="orange" />
    </div>
  );
}
