import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from '../ui/card';
import { TrendPoint } from '../../data/analyticsService';

export function WeeklyHoursTrendAreaChart({ data }: { data: TrendPoint[] }) {
  return (
    <Card className="p-6 bg-gradient-to-br from-card to-card/50 shadow-md">
      <h3 className="text-lg font-semibold mb-6">Weekly Hours Trend</h3>
      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="weeklyAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.12} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted/25" />
          <XAxis dataKey="day" tick={{ fill: 'currentColor' }} />
          <YAxis tick={{ fill: 'currentColor' }} />
          <Tooltip contentStyle={{ backgroundColor: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '8px' }} />
          <Area type="monotone" dataKey="hours" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#weeklyAreaGradient)" />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}
