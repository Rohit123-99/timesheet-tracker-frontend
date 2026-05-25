import { Outlet } from 'react-router';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { PomodoroWidget } from '../components/PomodoroWidget';
import { Toaster } from '../components/ui/sonner';

export default function Root() {
  return (
    <div className="flex h-screen overflow-hidden bg-background timesheet-desktop-shell">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
      <PomodoroWidget />
      <Toaster />
    </div>
  );
}
