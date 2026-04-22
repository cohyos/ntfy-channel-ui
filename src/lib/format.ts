/**
 * Returns a relative Hebrew time string ("לפני 5 דק'"), falling back to an
 * absolute locale string for anything older than 24 hours.
 */
export function relativeTime(unixSeconds: number, now: number = Date.now()): string {
  const diffMs = now - unixSeconds * 1000;
  const sec = Math.round(diffMs / 1000);

  if (sec < 10) return 'כעת';
  if (sec < 60) return `לפני ${sec} שניות`;
  const min = Math.round(sec / 60);
  if (min < 60) return `לפני ${min} דק'`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `לפני ${hr} שע'`;
  return new Date(unixSeconds * 1000).toLocaleString('he-IL', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

export function humanFileSize(bytes?: number): string {
  if (bytes == null) return '';
  const k = 1024;
  if (bytes < k) return `${bytes} B`;
  if (bytes < k * k) return `${(bytes / k).toFixed(1)} KB`;
  if (bytes < k * k * k) return `${(bytes / (k * k)).toFixed(1)} MB`;
  return `${(bytes / (k * k * k)).toFixed(2)} GB`;
}
