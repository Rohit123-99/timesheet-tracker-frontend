import { motion } from 'motion/react';

interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}

export function CircularProgress({
  percentage,
  size = 180,
  strokeWidth = 12,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  const getColor = () => {
    if (percentage >= 100) return '#10b981'; // green
    if (percentage >= 50) return '#eab308'; // yellow
    return '#ef4444'; // red
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-muted/30"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getColor()}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{
            filter: 'drop-shadow(0 0 8px rgba(0, 0, 0, 0.1))',
          }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-3xl font-semibold">
          {Math.round(percentage)}%
        </span>
      </div>
    </div>
  );
}
