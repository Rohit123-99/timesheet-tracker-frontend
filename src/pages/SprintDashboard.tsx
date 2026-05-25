import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { CheckCircle2, Circle, Flag, Layers, TrendingUp, Hourglass } from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { fetchSprintOverview, type SprintOverview } from '../data/api';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { cn } from '../utils/cn';

const BLOCK_COLORS: Record<string, string> = {
  A: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  B: 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  C: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  D: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
};

const BLOCK_LABEL: Record<string, string> = {
  A: 'Learn',
  B: 'Build',
  C: 'Practice',
  D: 'Ship',
};

export default function SprintDashboard() {
  const [overview, setOverview] = useState<SprintOverview | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setOverview(await fetchSprintOverview());
    } catch (err) {
      toast.error('Failed to load sprint overview');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  if (loading) return <div className="p-6">Loading sprint overview...</div>;

  if (!overview || overview.days.length === 0) {
    return (
      <div className="p-6 space-y-4">
        <div>
          <h2 className="text-2xl font-semibold">Sprint Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track your 14-day SDET sprint
          </p>
        </div>
        <Card className="p-8 text-center space-y-3">
          <Flag className="w-10 h-10 mx-auto text-muted-foreground" />
          <p className="font-medium">No sprint tasks yet</p>
          <p className="text-sm text-muted-foreground">
            Import the SDET sprint plan from Settings → Sprint Plan Import to
            generate Block A/B/C/D tasks for each of the 14 days.
          </p>
          <Link to="/settings">
            <Button className="mt-2">Go to Settings</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const { summary, days } = overview;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Sprint Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-1">
            14-day SDET sprint · {summary.completed_days}/{summary.total_days} days complete
          </p>
        </div>
        <Button onClick={load} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard
          title="Overall Progress"
          value={`${summary.overall_pct}%`}
          icon={TrendingUp}
          gradient="from-blue-500 to-cyan-500"
          description={`${summary.total_worked.toFixed(1)}h / ${summary.total_expected.toFixed(0)}h`}
        />
        <StatCard
          title="Days Complete"
          value={`${summary.completed_days}/${summary.total_days}`}
          icon={CheckCircle2}
          gradient="from-emerald-500 to-teal-500"
          description=">=80% of day's expected hours"
        />
        <StatCard
          title="Hours Logged"
          value={`${summary.total_worked.toFixed(1)}h`}
          icon={Hourglass}
          gradient="from-purple-500 to-pink-500"
          description="Across all sprint blocks"
        />
        <StatCard
          title="Hours Remaining"
          value={`${Math.max(0, summary.total_expected - summary.total_worked).toFixed(1)}h`}
          icon={Layers}
          gradient="from-orange-500 to-red-500"
          description="To finish the sprint"
        />
      </div>

      <Card className="p-6 bg-gradient-to-br from-card to-card/50 shadow-md">
        <h3 className="text-lg font-semibold mb-1">Daily breakdown</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Each row is one sprint day, showing per-block progress (Learn / Build / Practice / Ship).
        </p>

        <div className="space-y-3">
          {days.map((day, i) => (
            <motion.div
              key={day.date}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className={cn(
                'p-4 rounded-xl border transition-colors',
                day.complete
                  ? 'bg-emerald-50/70 dark:bg-emerald-950/15 border-emerald-200/70 dark:border-emerald-800/50'
                  : 'bg-muted/30 border-border',
              )}
            >
              <div className="grid grid-cols-12 gap-3 items-center">
                <div className="col-span-3 flex items-center gap-3">
                  {day.complete ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  )}
                  <div>
                    <p className="font-medium">
                      Day {day.day_number ?? '?'}{' '}
                      <span className="text-muted-foreground font-normal text-xs">· {day.date}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {day.worked_hours.toFixed(1)} / {day.expected_hours.toFixed(1)}h
                    </p>
                  </div>
                </div>

                <div className="col-span-7 flex items-center gap-2">
                  {(['A', 'B', 'C', 'D'] as const).map((letter) => {
                    const t = day.tasks.find((x) => x.block === letter);
                    const done = t && t.expected_hours > 0 && t.hours >= 0.8 * t.expected_hours;
                    const partial = t && t.hours > 0 && !done;
                    return (
                      <div
                        key={letter}
                        title={t ? `Block ${letter} (${BLOCK_LABEL[letter]}) — ${t.hours}/${t.expected_hours}h` : `Block ${letter} — not imported`}
                        className={cn(
                          'flex-1 h-12 rounded-md border flex flex-col items-center justify-center text-xs',
                          BLOCK_COLORS[letter],
                          done && 'ring-2 ring-emerald-400 dark:ring-emerald-600',
                          !t && 'opacity-40',
                          partial && 'opacity-95',
                        )}
                      >
                        <span className="font-semibold leading-none">{letter}</span>
                        <span className="leading-none text-[10px] mt-0.5">
                          {t ? `${t.hours.toFixed(1)}/${t.expected_hours}h` : '—'}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="col-span-2 text-right">
                  <div className="inline-block text-right">
                    <p className="text-sm font-semibold">{day.completion_pct.toFixed(0)}%</p>
                    <div className="h-1.5 w-20 bg-muted rounded-full overflow-hidden mt-1">
                      <div
                        className={cn(
                          'h-full',
                          day.complete
                            ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
                            : 'bg-gradient-to-r from-blue-400 to-purple-500',
                        )}
                        style={{ width: `${Math.min(100, day.completion_pct)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>
    </div>
  );
}
