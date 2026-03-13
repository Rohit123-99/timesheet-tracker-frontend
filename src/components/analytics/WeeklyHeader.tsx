export function WeeklyHeader({ rangeLabel }: { rangeLabel: string }) {
  return (
    <div>
      <h2 className="text-2xl font-semibold">Weekly Analytics</h2>
      <p className="text-sm text-muted-foreground mt-1">{rangeLabel}</p>
    </div>
  );
}
