// Browser notifications for task timers.

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch {
    return false;
  }
}

export function showTaskTimeNotification(
  taskName: string,
  estimatedHours: number,
  onDismiss?: () => void,
) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
    return;
  }
  const notification = new Notification('Estimated time reached', {
    body: `"${taskName}" hit ${estimatedHours}h — wrap up or extend the estimate.`,
    tag: `task-${taskName}`,
    requireInteraction: true,
  });
  notification.onclick = () => {
    window.focus();
    notification.close();
    onDismiss?.();
  };
  // Auto-close after 30s
  setTimeout(() => notification.close(), 30000);
}

export function showSimpleNotification(title: string, body: string) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
    return;
  }
  const n = new Notification(title, { body });
  setTimeout(() => n.close(), 6000);
}
