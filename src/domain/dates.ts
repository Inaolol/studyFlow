import type { WeekStart } from './types';

export function startOfDay(t: number): number {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function addDays(t: number, n: number): number {
  const d = new Date(t);
  d.setDate(d.getDate() + n);
  return d.getTime();
}

export function isOverdue(dueAt: number | null, now: number = Date.now()): boolean {
  if (dueAt === null) return false;
  return startOfDay(dueAt) < startOfDay(now);
}

export function startOfWeek(t: number, weekStartsOn: WeekStart): number {
  const d = new Date(startOfDay(t));
  const day = d.getDay(); // 0 = Sun
  const diff = (day - weekStartsOn + 7) % 7;
  d.setDate(d.getDate() - diff);
  return d.getTime();
}

export function daysBetween(a: number, b: number): number {
  const start = startOfDay(a);
  const end = startOfDay(b);
  return Math.round((end - start) / 86_400_000);
}

export function parseISODate(iso: string): number {
  // 'YYYY-MM-DD' parsed as local midnight (NOT UTC).
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
  return new Date(y, m - 1, d).getTime();
}

export function toISODate(t: number): string {
  const d = new Date(t);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
