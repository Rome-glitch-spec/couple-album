export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function formatDate(iso: string | null, opts?: Intl.DateTimeFormatOptions): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', opts ?? { month: 'long', day: 'numeric', year: 'numeric' });
}

export function monthYearLabel(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function monthsBetween(startIso: string, endDate = new Date()): number {
  const start = new Date(startIso);
  let months =
    (endDate.getFullYear() - start.getFullYear()) * 12 + (endDate.getMonth() - start.getMonth());
  if (endDate.getDate() < start.getDate()) months -= 1;
  return Math.max(0, months);
}

export function daysUntilNextMonthsary(day: number): number {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth(), day);
  if (next < now) next.setMonth(next.getMonth() + 1);
  const diff = next.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function isMonthsaryToday(day: number): boolean {
  return new Date().getDate() === day;
}

export function daysRemainingInTrash(deletedAt: string | null, retentionDays = 30): number {
  if (!deletedAt) return retentionDays;
  const deleted = new Date(deletedAt).getTime();
  const now = Date.now();
  const remaining = retentionDays - Math.floor((now - deleted) / (1000 * 60 * 60 * 24));
  return Math.max(0, remaining);
}

export const ACCEPTED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
export const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];
export const MAX_PHOTO_SIZE = 25 * 1024 * 1024; // 25MB
export const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB

export function validateFile(file: File): { ok: true; type: 'photo' | 'video' } | { ok: false; reason: string } {
  if (ACCEPTED_PHOTO_TYPES.includes(file.type)) {
    if (file.size > MAX_PHOTO_SIZE) return { ok: false, reason: `${file.name} is over the 25MB photo limit.` };
    return { ok: true, type: 'photo' };
  }
  if (ACCEPTED_VIDEO_TYPES.includes(file.type)) {
    if (file.size > MAX_VIDEO_SIZE) return { ok: false, reason: `${file.name} is over the 500MB video limit.` };
    return { ok: true, type: 'video' };
  }
  return { ok: false, reason: `${file.name} isn't a supported photo or video format.` };
}
