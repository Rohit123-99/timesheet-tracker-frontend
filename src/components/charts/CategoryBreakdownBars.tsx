import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from '../ui/card';
import { CategoryPoint } from '../../data/analyticsService';

export function CategoryBreakdownBars({ data }: { data: CategoryPoint[] }) {
  return (
    <Card className="p-6 bg-gradient-to-br from-card to-card/50 shadow-md">
      <h3 className="text-lg font-semibold mb-6">Category Breakdown</h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart layout="vertical" data={data} margin={{ left: 24, right: 16 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted/20" />
          <XAxis type="number" tick={{ fill: 'currentColor' }} />
          <YAxis type="category" dataKey="name" tick={{ fill: 'currentColor' }} width={120} />
          <Tooltip contentStyle={{ backgroundColor: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '8px' }} />
          <Bar dataKey="hours" radius={[0, 8, 8, 0]} fill="#6366f1" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
