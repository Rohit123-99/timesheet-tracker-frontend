import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Card } from '../components/ui/card';
import { StatCard } from '../components/StatCard';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Clock, TrendingUp, Calendar } from 'lucide-react';
import { loadAnalytics, type AnalyticsViewModel } from '../data/analyticsService';
import { toast } from 'sonner';

export default function WeeklyAnalytics() {
  const [vm, setVm] = useState<AnalyticsViewModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const data = await loadAnalytics();
        setVm(data);
      } catch (error) {
        console.error('Failed to load analytics', error);
        toast.error('Failed to load analytics');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  if (isLoading || !vm) return <div className="p-6">Loading Analytics...</div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Weekly Analytics</h2>
        <p className="text-sm text-muted-foreground mt-1">{vm.rangeLabel}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Hours This Week"
          value={`${vm.totalHours}h`}
          icon={Clock}
          gradient="from-blue-500 to-cyan-500"
          description="Across all tasks"
        />
        <StatCard
          title="Daily Average"
          value={`${vm.dailyAvg}h`}
          icon={TrendingUp}
          gradient="from-purple-500 to-pink-500"
          description="Per day"
        />
        <StatCard
          title="Working Days"
          value={vm.workingDays}
          icon={Calendar}
          gradient="from-green-500 to-emerald-500"
          description="This week"
        />
      </div>

      <Card className="p-6 bg-gradient-to-br from-card to-card/50 shadow-md">
        <h3 className="text-lg font-semibold mb-6">Weekly Hours Trend</h3>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={vm.weeklyTrend}>
            <defs>
              <linearGradient id="weeklyAreaFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted/20" />
            <XAxis dataKey="day" className="text-xs" tick={{ fill: 'currentColor' }} />
            <YAxis className="text-xs" tick={{ fill: 'currentColor' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--popover)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
              }}
              labelStyle={{ color: 'var(--foreground)' }}
            />
            <Area
              type="monotone"
              dataKey="hours"
              stroke="#3b82f6"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#weeklyAreaFill)"
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-gradient-to-br from-card to-card/50 shadow-md">
          <h3 className="text-lg font-semibold mb-6">Work Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={vm.categoryDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="hours"
                animationBegin={0}
                animationDuration={800}
              >
                {vm.categoryDistribution.map((entry, index) => (
                  <Cell key={`pie-cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--popover)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-card to-card/50 shadow-md">
          <h3 className="text-lg font-semibold mb-6">Category Breakdown</h3>
          <div className="space-y-4">
            {vm.categoryDistribution.map((cat, index) => (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span>{cat.name}</span>
                  </div>
                  <span className="font-semibold">{cat.hours}h</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(cat.hours / Math.max(1, vm.totalHours)) * 100}%` }}
                    transition={{ duration: 0.8, delay: index * 0.1 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
