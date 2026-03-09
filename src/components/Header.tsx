import { useState, useEffect } from 'react';
import { useRef } from 'react';
import { Moon, Sun, FileDown, Calendar, Bell } from 'lucide-react';
import { Button } from './ui/button';
import { useTheme } from '../contexts/ThemeContext';
import { formatDate } from '../utils/helpers';
import {
  choosePdfSavePath,
  exportWeeklyReportPdf,
  exportWeeklyReportPdfToPath,
  fetchAllSettings,
  onSettingsUpdated,
} from '../data/api';
import { toast } from 'sonner';

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const today = new Date();

  const [dailyGoal, setDailyGoal] = useState(8);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [unreadCount, setUnreadCount] = useState(1);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const refreshSettings = () => {
      fetchAllSettings()
        .then((settings) => {
          setDailyGoal(settings.target_hours ?? 8);
          setNotificationsEnabled(settings.notifications);
        })
        .catch(console.error);
    };

    refreshSettings();
    return onSettingsUpdated(refreshSettings);
  }, []);

  useEffect(() => {
    if (!showNotifications) return;
    const handleOutsideClick = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showNotifications]);

  const handleClearNotifications = () => {
    setUnreadCount(0);
    setShowNotifications(false);
  };

  const handleExportPDF = async () => {
    try {
      const savePath = await choosePdfSavePath('Weekly_Report.pdf');
      if (savePath) {
        await exportWeeklyReportPdfToPath(savePath);
        toast.success(`Weekly report saved to ${savePath}`);
        return;
      }

      const blob = await exportWeeklyReportPdf();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Weekly_Report.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      toast.success('Weekly report exported');
    } catch {
      toast.error('Failed to export weekly report');
    }
  };

  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6">
      <div className="flex items-center gap-6">
        <div>
          <h1 className="text-lg font-semibold">Personal Timesheet Tracker</h1>
        </div>
        <div className="h-8 w-px bg-border" />
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>{formatDate(today)}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 border border-blue-200 dark:bg-blue-950/20 dark:border-blue-800">
          <span className="text-sm text-muted-foreground">Daily Goal:</span>
          <span className="text-sm font-semibold">{dailyGoal}h</span>
        </div>

        <Button variant="outline" size="sm" onClick={handleExportPDF} className="gap-2 font-semibold">
          <FileDown className="w-4 h-4" />
          Export PDF
        </Button>

        <Button variant="outline" size="sm" onClick={toggleTheme} className="w-9 h-9 p-0 relative">
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </Button>

        <div className="relative" ref={notificationRef}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-9 h-9 p-0 relative"
          >
            <Bell className="w-4 h-4" />
            {notificationsEnabled && unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
              </span>
            )}
          </Button>

          {showNotifications && (
            <div
              className="fixed bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50"
              style={{ top: 68, right: 8, width: 'min(16rem, calc(100vw - 1rem))' }}
            >
              <div className="px-3 py-2 border-b border-border">
                <h3 className="font-semibold text-sm">Notifications</h3>
              </div>
              <div className="px-3 py-2 flex flex-col gap-2">
                {notificationsEnabled ? (
                  unreadCount > 0 ? (
                    <div className="text-sm">
                      <p className="text-muted-foreground">
                        Do not forget to wrap up your timesheet for today to meet the {dailyGoal}h goal.
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-center text-muted-foreground py-4">All caught up!</p>
                  )
                ) : (
                  <p className="text-sm text-center text-muted-foreground py-4">Notifications are disabled in Settings.</p>
                )}
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={handleClearNotifications} className="self-end h-auto px-2 py-1 text-xs">
                    Clear
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
