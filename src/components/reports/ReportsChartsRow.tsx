import { PerformancePoint, TrendPoint } from '../../data/analyticsService';
import { DailyHoursTrendChart } from '../charts/DailyHoursTrendChart';
import { PerformanceMetricsRadar } from '../charts/PerformanceMetricsRadar';

type ReportsChartsRowProps = {
  dailyTrend: TrendPoint[];
  performanceMetrics: PerformancePoint[];
};

export function ReportsChartsRow({ dailyTrend, performanceMetrics }: ReportsChartsRowProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
      <DailyHoursTrendChart data={dailyTrend} />
      <PerformanceMetricsRadar data={performanceMetrics} />
    </div>
  );
}
