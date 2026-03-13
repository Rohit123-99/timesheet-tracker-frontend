import { CategoryPoint, TrendPoint } from '../../data/analyticsService';
import { CategoryBreakdownBars } from '../charts/CategoryBreakdownBars';
import { WeeklyHoursTrendAreaChart } from '../charts/WeeklyHoursTrendAreaChart';
import { WorkDistributionPie } from '../charts/WorkDistributionPie';

type WorkDistributionSectionProps = {
  weeklyTrend: TrendPoint[];
  categoryDistribution: CategoryPoint[];
};

export function WorkDistributionSection({ weeklyTrend, categoryDistribution }: WorkDistributionSectionProps) {
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        <WeeklyHoursTrendAreaChart data={weeklyTrend} />
        <WorkDistributionPie data={categoryDistribution} />
      </div>
      <CategoryBreakdownBars data={categoryDistribution} />
    </>
  );
}
