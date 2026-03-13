import { Zap } from 'lucide-react';
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Card } from '../ui/card';
import { PerformancePoint } from '../../data/analyticsService';

export function PerformanceMetricsRadar({ data }: { data: PerformancePoint[] }) {
  return (
    <Card className="p-6 bg-gradient-to-br from-card to-card/50 shadow-md">
      <div className="flex items-center gap-2 mb-6">
        <Zap className="w-5 h-5 text-purple-500" />
        <h3 className="text-lg font-semibold">Performance Metrics</h3>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={data}>
          <PolarGrid stroke="currentColor" strokeOpacity={0.2} />
          <PolarAngleAxis dataKey="subject" tick={{ fill: 'currentColor', fontSize: 12 }} />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: 'currentColor' }} />
          <Radar name="Metrics" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.55} />
          <Tooltip contentStyle={{ backgroundColor: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '8px' }} />
        </RadarChart>
      </ResponsiveContainer>
    </Card>
  );
}
