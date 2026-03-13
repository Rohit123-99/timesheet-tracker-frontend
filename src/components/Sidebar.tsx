import { Link, useLocation } from 'react-router';
import { motion } from 'motion/react';
import {
  LayoutDashboard,
  ListChecks,
  BarChart3,
  FileText,
  Settings,
  LucideIcon,
} from 'lucide-react';

interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/tasks', label: 'Tasks', icon: ListChecks },
  { path: '/analytics', label: 'Weekly Analytics', icon: BarChart3 },
  { path: '/reports', label: 'Reports', icon: FileText },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 h-screen bg-gradient-to-b from-sidebar to-sidebar/80 border-r border-sidebar-border flex flex-col">
      <div className="p-6">
        <h2 className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
          Timesheet Tracker
        </h2>
      </div>

      <nav className="flex-1 px-3">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link key={item.path} to={item.path}>
              <motion.div
                whileHover={{ x: 4 }}
                className={`
                  flex items-center gap-3 px-4 py-3 mb-1 rounded-lg transition-colors relative
                  ${
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                  }
                `}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute left-0 w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-r-full"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 rounded-lg p-4">
          <p className="text-xs text-muted-foreground mb-1">Version</p>
          <p className="text-sm font-semibold">v2.0.0</p>
        </div>
      </div>
    </aside>
  );
}
