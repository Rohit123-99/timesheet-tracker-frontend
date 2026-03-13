import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Card } from '../ui/card';
import { CategoryPoint } from '../../data/analyticsService';

export function WorkDistributionPie({ data }: { data: CategoryPoint[] }) {
  return (
    <Card className="p-6 bg-gradient-to-br from-card to-card/50 shadow-md">
      <h3 className="text-lg font-semibold mb-6">Work Distribution</h3>
      <ResponsiveContainer width="100%" height={320}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={108}
            dataKey="hours"
            labelLine={false}
            label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
          >
            {data.map((entry, idx) => (
              <Cell key={`${entry.name}-${idx}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ backgroundColor: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '8px' }} />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}
