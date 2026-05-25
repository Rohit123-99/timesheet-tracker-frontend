import { useState, useEffect, useRef } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Separator } from '../components/ui/separator';
import { User, Bell, Database, Palette, Save, FileDown, CalendarPlus, FileUp } from 'lucide-react';
import { toast } from 'sonner';
import {
  exportAllData,
  fetchAllSettings,
  updateAllSettings,
  importSprintPlan,
  importSprintPlanInline,
  SprintImportResult,
} from '../data/api';

export default function Settings() {
  const [defaultDailyGoal, setDefaultDailyGoal] = useState('8');
  const [weeklyTarget, setWeeklyTarget] = useState('40');
  const [notifications, setNotifications] = useState(true);
  const [dailyReminders, setDailyReminders] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Sprint import state
  const [sprintMdPath, setSprintMdPath] = useState(
    'C:\\Users\\Killestro\\Study Tracking\\SDET_Sprint_Tracker.md',
  );
  const [sprintStartDate, setSprintStartDate] = useState('2026-05-26');
  const [sprintReplace, setSprintReplace] = useState(false);
  const [sprintImporting, setSprintImporting] = useState(false);
  const [sprintLastResult, setSprintLastResult] = useState<SprintImportResult | null>(null);
  const sprintFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await fetchAllSettings();
        setDefaultDailyGoal(String(data.target_hours ?? ''));
        setWeeklyTarget(String(data.weekly_target ?? ''));
        setNotifications(data.notifications);
        setAutoSave(data.auto_save);
      } catch (err) {
        toast.error("Failed to load settings");
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    const parsedDailyGoal = Number(defaultDailyGoal);
    const parsedWeeklyTarget = Number(weeklyTarget);
    if (
      defaultDailyGoal.trim() === '' ||
      weeklyTarget.trim() === '' ||
      Number.isNaN(parsedDailyGoal) ||
      Number.isNaN(parsedWeeklyTarget)
    ) {
      toast.error('Please enter valid goal values');
      return;
    }
    try {
      await updateAllSettings({
        target_hours: parsedDailyGoal,
        weekly_target: parsedWeeklyTarget,
        notifications: notifications,
        auto_save: autoSave
      });
      toast.success('Settings saved successfully!');
    } catch (err) {
      toast.error('Failed to save settings');
    }
  };

  const summariseImport = (result: SprintImportResult): string => {
    const parts = [`Created ${result.created} tasks`];
    if (result.skipped > 0) parts.push(`skipped ${result.skipped} (already existed)`);
    if (result.deleted > 0) parts.push(`replaced ${result.deleted} existing`);
    parts.push(`Day 1 = ${result.start_date}, Day 14 = ${result.end_date}`);
    return parts.join(' · ');
  };

  const handleImportFromPath = async () => {
    if (!sprintMdPath.trim() || !sprintStartDate.trim()) {
      toast.error('Provide both a file path and a start date');
      return;
    }
    setSprintImporting(true);
    try {
      const result = await importSprintPlan(sprintMdPath.trim(), sprintStartDate.trim(), sprintReplace);
      setSprintLastResult(result);
      toast.success(summariseImport(result));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Import failed';
      toast.error(message);
    } finally {
      setSprintImporting(false);
    }
  };

  const handleImportFromUpload = async (file: File) => {
    if (!sprintStartDate.trim()) {
      toast.error('Set a start date first');
      return;
    }
    setSprintImporting(true);
    try {
      const text = await file.text();
      const result = await importSprintPlanInline(text, sprintStartDate.trim(), sprintReplace);
      setSprintLastResult(result);
      toast.success(summariseImport(result));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Import failed';
      toast.error(message);
    } finally {
      setSprintImporting(false);
      if (sprintFileInputRef.current) sprintFileInputRef.current.value = '';
    }
  };

  const handleExportAllData = async () => {
    try {
      const blob = await exportAllData();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Timesheet_Data_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Data exported successfully');
    } catch (err) {
      toast.error('Failed to export data');
    }
  };

  if (isLoading) return <div className="p-6">Loading settings...</div>;

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div>
        <h2 className="text-2xl font-semibold">Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your application preferences
        </p>
      </div>

      {/* General Settings */}
      <Card className="p-6 shadow-md border-border/60 bg-white/80 dark:bg-card/80 backdrop-blur">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg">
            <User className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold">General</h3>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dailyGoal">Default Daily Goal (hours)</Label>
              <Input
                id="dailyGoal"
                type="number"
                value={defaultDailyGoal}
                onChange={(e) => setDefaultDailyGoal(e.target.value)}
                className="mt-1.5 border-border bg-input-background"
              />
            </div>
            <div>
              <Label htmlFor="weeklyTarget">Weekly Target (hours)</Label>
              <Input
                id="weeklyTarget"
                type="number"
                value={weeklyTarget}
                onChange={(e) => setWeeklyTarget(e.target.value)}
                className="mt-1.5 border-border bg-input-background"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Notifications */}
      <Card className="p-6 shadow-md border-border/60 bg-white/80 dark:bg-card/80 backdrop-blur">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
            <Bell className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold">Notifications</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Enable Notifications</p>
              <p className="text-sm text-muted-foreground">
                Receive reminders and updates
              </p>
            </div>
            <Switch checked={notifications} onCheckedChange={setNotifications} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Daily Goal Reminders</p>
              <p className="text-sm text-muted-foreground">
                Get notified when approaching daily goal
              </p>
            </div>
            <Switch checked={dailyReminders} onCheckedChange={setDailyReminders} />
          </div>
        </div>
      </Card>

      {/* Data & Storage */}
      <Card className="p-6 shadow-md border-border/60 bg-white/80 dark:bg-card/80 backdrop-blur">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg">
            <Database className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold">Data & Storage</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Auto-save</p>
              <p className="text-sm text-muted-foreground">
                Automatically save changes
              </p>
            </div>
            <Switch checked={autoSave} onCheckedChange={setAutoSave} />
          </div>
          <Separator />
          <div>
            <Button variant="outline" className="gap-2" onClick={handleExportAllData}>
              <FileDown className="w-4 h-4" />
              Export All Data
            </Button>
          </div>
        </div>
      </Card>

      {/* Appearance */}
      <Card className="p-6 shadow-md border-border/60 bg-white/80 dark:bg-card/80 backdrop-blur">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
            <Palette className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold">Appearance</h3>
        </div>

        <div className="space-y-4">
          <div>
            <p className="font-medium mb-3">Theme</p>
            <p className="text-sm text-muted-foreground mb-3">
              Toggle between light and dark mode using the button in the header
            </p>
          </div>
        </div>
      </Card>

      {/* Sprint Plan Import */}
      <Card className="p-6 shadow-md border-border/60 bg-white/80 dark:bg-card/80 backdrop-blur">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-lg">
            <CalendarPlus className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold">Sprint Plan Import</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Import the SDET 14-Day Sprint markdown tracker. Creates one task per Block (A/B/C/D)
          for every day, with expected hours and deliverables pre-populated. Tasks are tagged with
          category <span className="font-mono">SDET Sprint</span>.
        </p>

        <div className="space-y-4">
          <div>
            <Label htmlFor="sprintMdPath">Markdown file path (on this machine)</Label>
            <Input
              id="sprintMdPath"
              value={sprintMdPath}
              onChange={(e) => setSprintMdPath(e.target.value)}
              placeholder="C:\\path\\to\\SDET_Sprint_Tracker.md"
              className="mt-1.5 font-mono text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sprintStartDate">Day 1 date (YYYY-MM-DD)</Label>
              <Input
                id="sprintStartDate"
                type="date"
                value={sprintStartDate}
                onChange={(e) => setSprintStartDate(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div className="flex items-end pb-1">
              <div className="flex items-center gap-3">
                <Switch
                  id="sprintReplace"
                  checked={sprintReplace}
                  onCheckedChange={setSprintReplace}
                />
                <Label htmlFor="sprintReplace" className="cursor-pointer">
                  Replace existing sprint tasks
                </Label>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button
              onClick={handleImportFromPath}
              disabled={sprintImporting}
              className="gap-2 text-white bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600"
            >
              <CalendarPlus className="w-4 h-4" />
              {sprintImporting ? 'Importing…' : 'Import Sprint Plan'}
            </Button>

            <Button
              variant="outline"
              className="gap-2"
              onClick={() => sprintFileInputRef.current?.click()}
              disabled={sprintImporting}
            >
              <FileUp className="w-4 h-4" />
              Upload .md instead
            </Button>
            <input
              ref={sprintFileInputRef}
              type="file"
              accept=".md,text/markdown"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleImportFromUpload(file);
              }}
            />
          </div>

          {sprintLastResult && (
            <div className="mt-2 text-xs text-muted-foreground border border-border/40 rounded-md p-3 bg-muted/30">
              <div className="font-semibold mb-1">Last import</div>
              <div>
                Parsed {sprintLastResult.days_parsed} days · created {sprintLastResult.created} ·
                skipped {sprintLastResult.skipped} · replaced {sprintLastResult.deleted}
              </div>
              <div>
                Day 1 → {sprintLastResult.start_date} · Day 14 → {sprintLastResult.end_date}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          className="gap-2 text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
        >
          <Save className="w-4 h-4" />
          Save Settings
        </Button>
      </div>
    </div>
  );
}
