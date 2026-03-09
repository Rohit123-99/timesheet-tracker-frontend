export function formatHours(hours: number): string {
  if (hours === 0) return '0 hours';
  
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);

  if (minutes === 0) {
    return wholeHours === 1 ? '1 hour' : `${wholeHours} hours`;
  }

  const hourPart = wholeHours === 0 ? '' : wholeHours === 1 ? '1 hour' : `${wholeHours} hours`;
  const minutePart = `${minutes} minutes`;

  if (wholeHours === 0) {
    return minutePart;
  }

  return `${hourPart} ${minutePart}`;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatShortDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function toLocalDateString(date = new Date()): string {
  const tzOffsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - tzOffsetMs).toISOString().slice(0, 10);
}

export function getProgressColor(percentage: number): string {
  if (percentage >= 100) return 'text-green-500';
  if (percentage >= 50) return 'text-yellow-500';
  return 'text-red-500';
}

export function getProgressColorBg(percentage: number): string {
  if (percentage >= 100) return 'from-green-500 to-emerald-500';
  if (percentage >= 50) return 'from-yellow-500 to-amber-500';
  return 'from-red-500 to-rose-500';
}
