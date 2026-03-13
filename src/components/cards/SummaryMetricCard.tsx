import { LucideIcon } from 'lucide-react';
import { Card } from '../ui/card';

type SummaryMetricCardProps = {
  title: string;
  value: string;
  icon: LucideIcon;
  tone: 'blue' | 'purple' | 'green' | 'orange';
};

const toneClass: Record<SummaryMetricCardProps['tone'], string> = {
  blue: 'from-blue-50 to-cyan-50 border-blue-200 dark:from-blue-950/30 dark:to-cyan-950/30 dark:border-blue-800',
  purple: 'from-purple-50 to-pink-50 border-purple-200 dark:from-purple-950/30 dark:to-pink-950/30 dark:border-purple-800',
  green: 'from-green-50 to-emerald-50 border-green-200 dark:from-green-950/30 dark:to-emerald-950/30 dark:border-green-800',
  orange: 'from-orange-50 to-red-50 border-orange-200 dark:from-orange-950/30 dark:to-red-950/30 dark:border-orange-800',
};

const iconClass: Record<SummaryMetricCardProps['tone'], string> = {
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
  green: 'bg-green-500',
  orange: 'bg-orange-500',
};

export function SummaryMetricCard({ title, value, icon: Icon, tone }: SummaryMetricCardProps) {
  return (
    <Card className={`p-4 bg-gradient-to-br ${toneClass[tone]}`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${iconClass[tone]}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className="text-3xl leading-tight font-semibold">{value}</p>
        </div>
      </div>
    </Card>
  );
}
