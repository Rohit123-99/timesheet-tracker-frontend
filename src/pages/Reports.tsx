import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { FileDown, TrendingUp, Clock, Target, Award, Zap, Activity } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Cell,
} from 'recharts';
import { toast } from 'sonner';
import { choosePdfSavePath, exportWeeklyReportPdf, exportWeeklyReportPdfToPath } from '../data/api';
import { loadAnalytics, type AnalyticsViewModel } from '../data/analyticsService';

export default function Reports() {
  const [data, setData] = useState<AnalyticsViewModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const vm = await loadAnalytics();
        setData(vm);
      } catch (error) {
        console.error('Failed to load reports', error);
        toast.error('Failed to load reports');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const performanceData = useMemo(() => data?.performanceMetrics ?? [], [data]);
  const chartDailyData = useMemo(() => data?.dailyTrend ?? [], [data]);
  const categoryData = useMemo(() => data?.categoryDistribution ?? [], [data]);
  const taskRows = useMemo(() => data?.taskRows ?? [], [data]);

  const handleExportReport = async () => {
    try {
      const savePath = await choosePdfSavePath('Weekly_Report.pdf');
      if (savePath) {
        await exportWeeklyReportPdfToPath(savePath);
        toast.success(`Weekly report saved to ${savePath}`);
        return;
      }
      const blob = await exportWeeklyReportPdf();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Weekly_Report.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      toast.success('Weekly report exported');
    } catch {
      toast.error('Failed to export report');
    }
  };

  if (isLoading || !data) return <div className="p-6">Loading Report...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Reports & Analytics</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Comprehensive insights for week: {data.rangeLabel}
          </p>
        </div>
        <Button
          onClick={handleExportReport}
          className="gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
        >
          <FileDown className="w-4 h-4" />
          Export Report
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Hours</p>
                <p className="text-xl font-bold">{data.totalHours}h</p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Completion</p>
                <p className="text-xl font-bold">{data.completionRate}%</p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Daily Avg</p>
                <p className="text-xl font-bold">{data.dailyAvg}h</p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-4 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 border-orange-200 dark:border-orange-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500 rounded-lg flex items-center justify-center">
                <Award className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tasks Done</p>
                <p className="text-xl font-bold">{data.tasksDone}</p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Hours Trend */}
        <Card className="p-6 bg-gradient-to-br from-card to-card/50 shadow-md">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold">Daily Hours Trend</h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartDailyData}>
              <defs>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted/20" />
              <XAxis
                dataKey="day"
                className="text-xs"
                tick={{ fill: 'currentColor' }}
              />
              <YAxis className="text-xs" tick={{ fill: 'currentColor' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--popover)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--popover-foreground)',
                }}
              />
              <Line
                type="monotone"
                dataKey="hours"
                stroke="url(#lineGradient)"
                strokeWidth={3}
                dot={{ fill: '#3b82f6', r: 5 }}
                activeDot={{ r: 7 }}
                animationDuration={1500}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Performance Radar */}
        <Card className="p-6 bg-gradient-to-br from-card to-card/50 shadow-md">
          <div className="flex items-center gap-2 mb-6">
            <Zap className="w-5 h-5 text-purple-500" />
            <h3 className="text-lg font-semibold">Performance Metrics</h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={performanceData}>
              <PolarGrid stroke="currentColor" strokeOpacity={0.2} />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: 'currentColor', fontSize: 12 }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{ fill: 'currentColor' }}
              />
              <Radar
                name="Performance"
                dataKey="value"
                stroke="#8b5cf6"
                fill="#8b5cf6"
                fillOpacity={0.6}
                animationDuration={1500}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--popover)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--popover-foreground)',
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Category Distribution */}
      <Card className="p-6 bg-gradient-to-br from-card to-card/50 shadow-md">
        <h3 className="text-lg font-semibold mb-6">Work Category Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={categoryData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted/20" />
            <XAxis dataKey="name" tick={{ fill: 'currentColor' }} />
            <YAxis tick={{ fill: 'currentColor' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--popover)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: 'var(--popover-foreground)',
              }}
            />
            <Bar dataKey="hours" radius={[8, 8, 0, 0]} animationDuration={1500}>
              {categoryData.map((entry, index) => (
                <Cell key={`bar-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Task Details */}
      <Card className="p-6 bg-gradient-to-br from-card to-card/50 shadow-md">
        <h3 className="text-lg font-semibold mb-6">Task Details</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 text-sm font-semibold">Task Name</th>
                <th className="text-left p-3 text-sm font-semibold">Category</th>
                <th className="text-center p-3 text-sm font-semibold">Status</th>
                <th className="text-center p-3 text-sm font-semibold">Hours</th>
                <th className="text-center p-3 text-sm font-semibold">Progress</th>
              </tr>
            </thead>
            <tbody>
              {taskRows.map((task, index) => (
                <motion.tr
                  key={task.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={index % 2 === 0 ? 'bg-muted/20' : ''}
                >
                  <td className="p-3 text-sm font-medium">{task.name}</td>
                  <td className="p-3 text-sm text-muted-foreground">
                    {task.category}
                  </td>
                  <td className="p-3 text-sm text-center">
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        task.status === 'complete'
                          ? 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400'
                          : task.status === 'in-progress'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-950/30 dark:text-gray-400'
                      }`}
                    >
                      {task.status}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-center font-semibold">
                    {task.hours}h
                  </td>
                  <td className="p-3 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                          style={{
                            width: `${Math.min(100, task.progress)}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs font-medium min-w-[35px]">
                        {task.progress}%
                      </span>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-500 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold mb-1">Peak Productivity</h4>
              <p className="text-sm text-muted-foreground">
                Your most productive day was{' '}
                <span className="font-medium text-foreground">{data.peakDayLabel}</span>{' '}
                with {data.peakDayHours} hours logged
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-500 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold mb-1">Achievement</h4>
              <p className="text-sm text-muted-foreground">
                You completed{' '}
                <span className="font-medium text-foreground">
                  {data.tasksDone} tasks
                </span>{' '}
                this week. Great work!
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-green-500 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold mb-1">Goal Status</h4>
              <p className="text-sm text-muted-foreground">
                You're at{' '}
                <span className="font-medium text-foreground">
                  {data.completionRate}%
                </span>{' '}
                of your weekly target. Keep it up!
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
