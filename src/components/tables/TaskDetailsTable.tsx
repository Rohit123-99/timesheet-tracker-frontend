import { motion } from 'motion/react';
import { Card } from '../ui/card';
import { TaskRow } from '../../data/analyticsService';

export function TaskDetailsTable({ rows }: { rows: TaskRow[] }) {
  return (
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
              <th className="text-center p-3 text-sm font-semibold">Expected</th>
              <th className="text-left p-3 text-sm font-semibold">Notes</th>
              <th className="text-center p-3 text-sm font-semibold">Progress</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <motion.tr
                key={`${row.id}-${index}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                className={index % 2 === 0 ? 'bg-muted/20' : ''}
              >
                <td className="p-3 text-sm font-medium">{row.name}</td>
                <td className="p-3 text-sm text-muted-foreground">{row.category}</td>
                <td className="p-3 text-center">
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      row.status === 'complete'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                    }`}
                  >
                    {row.status}
                  </span>
                </td>
                <td className="p-3 text-sm text-center font-semibold">{row.hours}h</td>
                <td className="p-3 text-sm text-center">{row.expected}h</td>
                <td className="p-3 text-sm text-muted-foreground">{row.notes}</td>
                <td className="p-3 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                        style={{ width: `${Math.min(100, row.progress)}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium min-w-[36px] text-right">{row.progress}%</span>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
