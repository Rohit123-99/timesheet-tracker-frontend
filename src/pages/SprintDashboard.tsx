import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  CheckCircle2,
  Circle,
  Flag,
  Layers,
  TrendingUp,
  Hourglass,
  Brain,
  Hammer,
  Dumbbell,
  Rocket,
} from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { fetchSprintOverview, type SprintOverview, type SprintOverviewDay } from '../data/api';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { cn } from '../utils/cn';

/**
 * NOTE: This project's `src/index.css` is a frozen Tailwind v4 compile that
 * only contains a small set of utility classes (no `md:grid-cols-*`,
 * `xl:grid-cols-*`, `col-span-3`, etc.). For real grid layouts we use
 * inline `style={{ display: 'grid', gridTemplateColumns: '...' }}` which
 * is browser-native and works regardless of which Tailwind classes are
 * actually in the stylesheet.
 */

const STAT_GRID_STYLE: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '1.25rem',
};

const DAY_CARD_GRID_STYLE: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
  gap: '1rem',
};

const BLOCK_TILE_ROW_STYLE: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: '0.5rem',
};

const BLOCK_META: Record<string, {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  bg: string;
  text: string;
  border: string;
  doneRing: string;
}> = {
  A: {
    label: 'Learn',
    icon: Brain,
    bg: 'bg-blue-100 dark:bg-blue-950/40',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
    doneRing: 'ring-2 ring-blue-500/70',
  },
  B: {
    label: 'Build',
    icon: Hammer,
    bg: 'bg-purple-100 dark:bg-purple-950/40',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-800',
    doneRing: 'ring-2 ring-purple-500/70',
  },
  C: {
    label: 'Practice',
    icon: Dumbbell,
    bg: 'bg-amber-100 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
    doneRing: 'ring-2 ring-amber-500/70',
  },
  D: {
    label: 'Ship',
    icon: Rocket,
    bg: 'bg-emerald-100 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
    doneRing: 'ring-2 ring-emerald-500/70',
  },
};

function BlockTile({
  letter,
  task,
}: {
  letter: 'A' | 'B' | 'C' | 'D';
  task: SprintOverviewDay['tasks'][number] | undefined;
}) {
  const meta = BLOCK_META[letter];
  const Icon = meta.icon;
  const expected = task?.expected_hours ?? 0;
  const hours = task?.hours ?? 0;
  const done = task && expected > 0 && hours >= 0.8 * expected;
  const empty = !task;

  return (
    <div
      title={
        task
          ? `Block ${letter} (${meta.label}) — ${hours}/${expected}h`
          : `Block ${letter} — not imported`
      }
      className={cn(
        'rounded-lg border px-2 py-2 flex flex-col items-center justify-center text-center transition-colors',
        meta.bg,
        meta.text,
        meta.border,
        done && meta.doneRing,
        empty && 'opacity-40',
      )}
    >
      <div className="flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5" />
        <span className="text-xs font-bold leading-none">{letter}</span>
      </div>
      <span className="text-[10px] leading-tight mt-1 opacity-90">
        {task ? `${hours.toFixed(1)}/${expected}h` : '—'}
      </span>
    </div>
  );
}

function DayCard({ day }: { day: SprintOverviewDay }) {
  return (
    <Card
      className={cn(
        'p-4 transition-all hover:shadow-lg',
        day.complete
          ? 'bg-emerald-50/70 dark:bg-emerald-950/15 border-emerald-200/70 dark:border-emerald-800/50'
          : 'bg-card border-border',
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={cn(
              'flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold',
              day.complete
                ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white'
                : 'bg-gradient-to-br from-blue-500 to-purple-500 text-white',
            )}
          >
            {day.day_number ?? '?'}
          </div>
          <div className="min-w-0">
            <p className="font-semibold leading-tight">Day {day.day_number ?? '?'}</p>
            <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{day.date}</p>
          </div>
        </div>
        <div className="flex-shrink-0">
          {day.complete ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          ) : (
            <Circle className="w-5 h-5 text-muted-foreground/60" />
          )}
        </div>
      </div>

      <div style={BLOCK_TILE_ROW_STYLE} className="mb-3">
        {(['A', 'B', 'C', 'D'] as const).map((letter) => (
          <BlockTile
            key={letter}
            letter={letter}
            task={day.tasks.find((t) => t.block === letter)}
          />
        ))}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {day.worked_hours.toFixed(1)} / {day.expected_hours.toFixed(1)}h
          </span>
          <span className="font-semibold">{day.completion_pct.toFixed(0)}%</span>
        </div>
        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full transition-all duration-500',
              day.complete
                ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
                : 'bg-gradient-to-r from-blue-400 to-purple-500',
            )}
            style={{ width: `${Math.min(100, day.completion_pct)}%` }}
          />
        </div>
      </div>
    </Card>
  );
}

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
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-semibold">Sprint Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track your 14-day SDET sprint
          </p>
        </div>
        <Card className="p-10 bg-gradient-to-br from-card to-card/50 shadow-md border-border/60">
          <div className="flex flex-col items-center text-center gap-4 max-w-md mx-auto">
            <div className="p-4 rounded-full bg-gradient-to-br from-blue-500/15 to-purple-500/15 border border-blue-300/40 dark:border-blue-700/40">
              <Flag className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="space-y-1">
              <p className="text-lg font-semibold">No sprint tasks yet</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Import the SDET sprint plan to generate Block A/B/C/D tasks for
                each of the 14 days.
              </p>
            </div>
            <Link to="/settings" className="mt-2">
              <Button className="gap-2 text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
                Go to Settings
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const { summary, days } = overview;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
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

      <div style={STAT_GRID_STYLE}>
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
          description=">=80% of expected hours"
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

      <div>
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold">Daily breakdown</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              One card per sprint day · Block A (Learn) · B (Build) · C (Practice) · D (Ship)
            </p>
          </div>
        </div>

        <div style={DAY_CARD_GRID_STYLE}>
          {days.map((day, i) => (
            <motion.div
              key={day.date}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.4) }}
            >
              <DayCard day={day} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
