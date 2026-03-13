import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';

type DateFilterPanelProps = {
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onApply: () => void;
  onReset: () => void;
};

export function DateFilterPanel({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onApply,
  onReset,
}: DateFilterPanelProps) {
  return (
    <Card className="p-4 bg-gradient-to-br from-card to-card/50 shadow-md">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-muted-foreground">Start Date</label>
          <Input type="date" value={startDate} onChange={(e) => onStartDateChange(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">End Date</label>
          <Input type="date" value={endDate} onChange={(e) => onEndDateChange(e.target.value)} />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3">
        <Button onClick={onApply} className="h-10 bg-[#121327] hover:bg-[#1b1f3d] text-white">Apply Filter</Button>
        <Button variant="outline" onClick={onReset} className="h-10">Reset to Last 7 Days</Button>
      </div>
    </Card>
  );
}
