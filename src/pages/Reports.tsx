import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { FileDown, FileText } from 'lucide-react';
import { choosePdfSavePath, exportWeeklyReportPdf, exportWeeklyReportPdfToPath, fetchWeeklyReport } from '../data/api';
import { toast } from 'sonner';

export default function Reports() {
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [summary, setSummary] = useState({ total_weekly_hours: 0, daily_average: 0, daily_target: 8.0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const report = await fetchWeeklyReport();

        const formattedDaily = report.daily_breakdown.map((d: any) => ({
          day: d.day_name,
          hours: d.hours,
          date: d.date,
        }));
        setWeeklyData(formattedDaily);
        setTasks(report.raw_tasks);
        setSummary(report.summary);

        const catMap: Record<string, number> = {};
        report.raw_tasks.forEach((t: any) => {
          if (t.hours > 0) {
            const cat = t.category || 'Uncategorized';
            catMap[cat] = (catMap[cat] || 0) + t.hours;
          }
        });

        const colors = ['#0f766e', '#155e75', '#0369a1', '#0284c7', '#0e7490', '#334155', '#15803d'];
        const cats = Object.keys(catMap).map((k, i) => ({
          name: k,
          hours: Number(catMap[k].toFixed(1)),
          color: colors[i % colors.length],
        }));

        setCategoryData(cats);
      } catch (error) {
        console.error('Failed to load analytics', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const totalWeeklyHours = summary.total_weekly_hours.toFixed(1);
  const targetWeeklyHours = (summary.daily_target * 7).toFixed(1);
  const avgDailyHours = summary.daily_average.toFixed(1);
  const rangeStart = weeklyData[0]?.date ? new Date(weeklyData[0].date) : null;
  const rangeEnd = weeklyData[weeklyData.length - 1]?.date ? new Date(weeklyData[weeklyData.length - 1].date) : null;

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
    } catch (err) {
      toast.error('Failed to export weekly report');
    }
  };

  if (isLoading) return <div className="p-6">Loading Report...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Reports</h2>
          <p className="text-sm text-muted-foreground mt-1">Export and view your weekly timesheet reports</p>
        </div>
        <Button
          onClick={handleExportReport}
          className="gap-2 text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
        >
          <FileDown className="w-4 h-4" />
          Export Weekly Report
        </Button>
      </div>

      <Card className="p-8 bg-gradient-to-br from-card to-card/50 shadow-md">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center border-b border-border pb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <FileText className="w-8 h-8 text-blue-500" />
              <h1 className="text-3xl font-semibold">Personal Work Timesheet Report</h1>
            </div>
            <p className="text-muted-foreground">
              Week:{' '}
              {rangeStart && rangeEnd
                ? `${rangeStart.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })} - ${rangeEnd.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}`
                : 'Last 7 days'}
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-4">Summary</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-gradient-to-br from-cyan-50 to-sky-50 dark:from-cyan-950/30 dark:to-sky-950/30 rounded-lg border border-cyan-200 dark:border-cyan-800">
                <p className="text-sm text-muted-foreground mb-1">Total Hours</p>
                <p className="text-2xl font-semibold">{totalWeeklyHours}h</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-slate-50 to-zinc-50 dark:from-slate-900/40 dark:to-zinc-900/30 rounded-lg border border-slate-200 dark:border-slate-700">
                <p className="text-sm text-muted-foreground mb-1">Target Hours</p>
                <p className="text-2xl font-semibold">{targetWeeklyHours}h</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <p className="text-sm text-muted-foreground mb-1">Weekly Average</p>
                <p className="text-2xl font-semibold">{avgDailyHours}h/day</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-4">Daily Hours</h3>
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 text-sm font-semibold">Day</th>
                    <th className="text-left p-3 text-sm font-semibold">Date</th>
                    <th className="text-right p-3 text-sm font-semibold">Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {weeklyData.map((day, index) => (
                    <tr key={day.day + index} className={index % 2 === 0 ? 'bg-muted/20' : ''}>
                      <td className="p-3 text-sm">{day.day}</td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {new Date(day.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="p-3 text-sm text-right font-medium">{day.hours}h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-4">Task Summary</h3>
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 text-sm font-semibold">Task</th>
                    <th className="text-center p-3 text-sm font-semibold">Hours</th>
                    <th className="text-left p-3 text-sm font-semibold">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task, index) => (
                    <tr key={task.id + index} className={index % 2 === 0 ? 'bg-muted/20' : ''}>
                      <td className="p-3 text-sm">
                        <div>
                          <p className="font-medium">{task.task_name || task.name}</p>
                          <p className="text-xs text-muted-foreground">{task.category}</p>
                        </div>
                      </td>
                      <td className="p-3 text-sm text-center font-medium">{task.hours || task.actualHours}h</td>
                      <td className="p-3 text-sm text-muted-foreground">{task.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-4">Work Hours Distribution</h3>
            <div className="space-y-3">
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
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span>{cat.name}</span>
                    </div>
                    <span className="font-semibold">{cat.hours}h</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(cat.hours / Number(totalWeeklyHours || 1)) * 100}%` }}
                      transition={{ duration: 0.8, delay: index * 0.1 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
