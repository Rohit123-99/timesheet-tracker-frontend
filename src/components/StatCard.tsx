import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  gradient?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export function StatCard({
  title,
  value,
  icon: Icon,
  description,
  gradient = 'from-blue-500 to-purple-500',
  trend,
}: StatCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className="bg-card rounded-xl p-6 shadow-md border border-border/50 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-2">{title}</p>
          <p className="text-3xl font-semibold mb-1">{value}</p>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span className={`text-sm ${trend.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {trend.isPositive ? 'Up' : 'Down'} {trend.value}
              </span>
              <span className="text-xs text-muted-foreground">vs last week</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </motion.div>
  );
}
