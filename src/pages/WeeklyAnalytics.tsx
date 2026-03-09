import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Card } from '../components/ui/card';
import { StatCard } from '../components/StatCard';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { Clock, TrendingUp, Calendar } from 'lucide-react';
import { fetchWeeklyReport } from '../data/api';

export default function WeeklyAnalytics() {
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [summary, setSummary] = useState({ total_weekly_hours: 0, daily_average: 0 });
  const [workingDays, setWorkingDays] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const report = await fetchWeeklyReport();
        
        // Format for Recharts BarChart
        const formattedDaily = report.daily_breakdown.map((d: any) => ({
          day: d.day_name,
          hours: d.hours,
          date: d.date
        }));
        setWeeklyData(formattedDaily);
        setSummary(report.summary);
        
        setWorkingDays(report.daily_breakdown.filter((d: any) => d.hours > 0).length);

        // Aggregate categories manually since API returns raw tasks
        const catMap: Record<string, number> = {};
        report.raw_tasks.forEach((t: any) => {
          if (t.hours > 0) {
            const cat = t.category || 'Uncategorized';
            catMap[cat] = (catMap[cat] || 0) + t.hours;
          }
        });

        // Generate distinctive colors
        const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#f43f5e', '#06b6d4'];
        const cats = Object.keys(catMap).map((k, i) => ({
          name: k,
          hours: Number(catMap[k].toFixed(1)),
          color: colors[i % colors.length]
        }));
        
        setCategoryData(cats);
        
      } catch (error) {
        console.error("Failed to load analytics", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  if (isLoading) return <div className="p-6">Loading Analytics...</div>;
  // Stats variables map back to state
  const totalWeeklyHours = summary.total_weekly_hours.toFixed(1);
  const avgDailyHours = summary.daily_average.toFixed(1);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Weekly Analytics</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Showing last 7 days of activity
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Hours This Week"
          value={`${totalWeeklyHours}h`}
          icon={Clock}
          gradient="from-blue-500 to-cyan-500"
          description="Across all tasks"
        />
        <StatCard
          title="Daily Average"
          value={`${avgDailyHours}h`}
          icon={TrendingUp}
          gradient="from-purple-500 to-pink-500"
          description="Per day"
        />
        <StatCard
          title="Working Days"
          value={workingDays}
          icon={Calendar}
          gradient="from-emerald-600 to-teal-700"
          description="This week"
        />
      </div>

      {/* Weekly Hours Chart */}
      <Card className="p-6 bg-gradient-to-br from-card to-card/50 shadow-md">
        <h3 className="text-lg font-semibold mb-6">Weekly Hours</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
            <XAxis
              dataKey="day"
              className="text-xs"
              tick={{ fill: 'currentColor' }}
            />
            <YAxis className="text-xs" tick={{ fill: 'currentColor' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #dbe4ff',
                borderRadius: '8px',
                color: '#0f172a',
                boxShadow: '0 8px 20px rgba(15, 23, 42, 0.12)',
              }}
              labelStyle={{ color: '#0f172a', fontWeight: 600 }}
            />
            <Bar dataKey="hours" radius={[8, 8, 0, 0]}>
              {weeklyData.map((entry, index) => (
                <Cell
                  key={`bar-cell-${index}`}
                  fill={`url(#gradient-${index})`}
                  className="hover:opacity-80 transition-opacity"
                />
              ))}
            </Bar>
            <defs>
              {weeklyData.map((_, index) => (
                <linearGradient
                  key={`bar-gradient-${index}`}
                  id={`gradient-${index}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              ))}
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Work Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-gradient-to-br from-card to-card/50 shadow-md">
          <h3 className="text-lg font-semibold mb-6">Work Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={100}
                fill="#8884d8"
                dataKey="hours"
                animationBegin={0}
                animationDuration={800}
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`pie-cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #dbe4ff',
                  borderRadius: '8px',
                  color: '#0f172a',
                  boxShadow: '0 8px 20px rgba(15, 23, 42, 0.12)',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-card to-card/50 shadow-md">
          <h3 className="text-lg font-semibold mb-6">Category Breakdown</h3>
          <div className="space-y-4">
            {categoryData.map((cat, index) => (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span>{cat.name}</span>
                  </div>
                  <span className="font-semibold">{cat.hours}h</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(cat.hours / Number(totalWeeklyHours || 1)) * 100}%`,
                      }}
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
