import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from '../ui/card';
import { CategoryPoint } from '../../data/analyticsService';

export function WorkCategoryDistributionChart({ data }: { data: CategoryPoint[] }) {
  return (
    <Card className="p-6 bg-gradient-to-br from-card to-card/50 shadow-md">
      <h3 className="text-lg font-semibold mb-6">Work Category Distribution</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted/20" />
          <XAxis dataKey="name" tick={{ fill: 'currentColor' }} />
          <YAxis tick={{ fill: 'currentColor' }} />
          <Tooltip contentStyle={{ backgroundColor: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '8px' }} />
          <Bar dataKey="hours" radius={[8, 8, 0, 0]}>
            {data.map((entry, idx) => (
              <Cell key={`${entry.name}-${idx}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
