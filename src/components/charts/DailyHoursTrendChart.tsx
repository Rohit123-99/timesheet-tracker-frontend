import { Activity } from 'lucide-react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from '../ui/card';
import { TrendPoint } from '../../data/analyticsService';

export function DailyHoursTrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <Card className="p-6 bg-gradient-to-br from-card to-card/50 shadow-md">
      <div className="flex items-center gap-2 mb-6">
        <Activity className="w-5 h-5 text-blue-500" />
        <h3 className="text-lg font-semibold">Daily Hours Trend</h3>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <defs>
            <linearGradient id="dailyLineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted/20" />
          <XAxis dataKey="day" tick={{ fill: 'currentColor' }} />
          <YAxis tick={{ fill: 'currentColor' }} />
          <Tooltip contentStyle={{ backgroundColor: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '8px' }} />
          <Line type="monotone" dataKey="hours" stroke="url(#dailyLineGradient)" strokeWidth={3} dot={{ fill: '#3b82f6', r: 5 }} activeDot={{ r: 7 }} />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
