import { LucideIcon } from 'lucide-react';
import { Card } from '../ui/card';

type InsightCardProps = {
  title: string;
  text: string;
  icon: LucideIcon;
  tone: 'blue' | 'purple' | 'green';
};

const styleByTone: Record<InsightCardProps['tone'], string> = {
  blue: 'from-blue-500/10 to-cyan-500/10 border-blue-500/20',
  purple: 'from-purple-500/10 to-pink-500/10 border-purple-500/20',
  green: 'from-green-500/10 to-emerald-500/10 border-green-500/20',
};

const iconByTone: Record<InsightCardProps['tone'], string> = {
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
  green: 'bg-green-500',
};

export function InsightCard({ title, text, icon: Icon, tone }: InsightCardProps) {
  return (
    <Card className={`p-6 bg-gradient-to-br ${styleByTone[tone]}`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${iconByTone[tone]}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h4 className="font-semibold mb-1">{title}</h4>
          <p className="text-sm text-muted-foreground">{text}</p>
        </div>
      </div>
    </Card>
  );
}
