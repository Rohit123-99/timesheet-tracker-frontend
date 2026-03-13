import { Award, Target, TrendingUp } from 'lucide-react';
import { InsightCard } from '../cards/InsightCard';

type ReportsInsightsRowProps = {
  peakDayLabel: string;
  peakDayHours: number;
  tasksDone: number;
  completionRate: number;
};

export function ReportsInsightsRow({ peakDayLabel, peakDayHours, tasksDone, completionRate }: ReportsInsightsRowProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <InsightCard
        tone="blue"
        icon={TrendingUp}
        title="Peak Productivity"
        text={`Your most productive day was ${peakDayLabel} with ${peakDayHours} hours logged.`}
      />
      <InsightCard
        tone="purple"
        icon={Award}
        title="Achievement"
        text={`You completed ${tasksDone} tasks in this period.`}
      />
      <InsightCard
        tone="green"
        icon={Target}
        title="Goal Status"
        text={`You're at ${completionRate}% of your target hours.`}
      />
    </div>
  );
}
