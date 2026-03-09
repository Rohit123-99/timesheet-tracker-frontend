import { useState, useEffect } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Separator } from '../components/ui/separator';
import { User, Bell, Database, Palette, Save, FileDown } from 'lucide-react';
import { toast } from 'sonner';
import { exportAllData, fetchAllSettings, updateAllSettings } from '../data/api';

export default function Settings() {
  const [defaultDailyGoal, setDefaultDailyGoal] = useState('8');
  const [weeklyTarget, setWeeklyTarget] = useState('40');
  const [notifications, setNotifications] = useState(true);
  const [dailyReminders, setDailyReminders] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

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
