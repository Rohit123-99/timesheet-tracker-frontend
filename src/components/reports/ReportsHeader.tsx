import { FileDown } from 'lucide-react';
import { Button } from '../ui/button';

export function ReportsHeader({ rangeLabel, onExport }: { rangeLabel: string; onExport: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-semibold">Reports & Analytics</h2>
        <p className="text-sm text-muted-foreground mt-1">Comprehensive insights for week: {rangeLabel}</p>
      </div>
      <Button
        onClick={onExport}
        className="gap-2 text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
      >
        <FileDown className="w-4 h-4" />
        Export Report
      </Button>
    </div>
  );
}
