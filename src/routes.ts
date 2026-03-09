import { createHashRouter } from 'react-router';
import Root from './pages/Root';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import WeeklyAnalytics from './pages/WeeklyAnalytics';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

export const router = createHashRouter([
  {
    path: '/',
    Component: Root,
    children: [
      { index: true, Component: Dashboard },
      { path: 'tasks', Component: Tasks },
      { path: 'analytics', Component: WeeklyAnalytics },
      { path: 'reports', Component: Reports },
      { path: 'settings', Component: Settings },
    ],
  },
]);
