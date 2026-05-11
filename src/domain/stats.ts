import type { Subject, Task, Session } from './types';
import { startOfDay, addDays } from './dates';

export interface Kpis {
  currentStreak: number;
  longestStreak: number;
  completionRate30d: number;
  focusMinutes30d: number;
}

export function kpis(tasks: Task[], sessions: Session[], now: number): Kpis {
  const today = startOfDay(now);
  const days = new Set<number>();
  for (const s of sessions) {
    if (s.kind === 'work' && s.completed) days.add(startOfDay(s.startedAt));
  }

  let currentStreak = 0;
  // Start from today; if today has no focus, allow streak to start from yesterday
  const streakStart = days.has(today) ? today : addDays(today, -1);
  for (let d = streakStart; days.has(d); d = addDays(d, -1)) currentStreak++;

  let longestStreak = 0;
  const sorted = [...days].sort((a, b) => a - b);
  let run = 0;
  let prev: number | null = null;
  for (const d of sorted) {
    if (prev !== null && d === addDays(prev, 1)) run++;
    else run = 1;
    if (run > longestStreak) longestStreak = run;
    prev = d;
  }

  const windowStart = addDays(today, -29);
  const focusMinutes30d = sessions
    .filter(s => s.kind === 'work' && s.completed && s.startedAt >= windowStart)
    .reduce((sum, s) => sum + s.durationMs / 60_000, 0);

  const tasksIn = tasks.filter(t => (t.completedAt ?? t.createdAt) >= windowStart);
  const completionRate30d = tasksIn.length === 0 ? 0
    : tasksIn.filter(t => t.completedAt !== null).length / tasksIn.length;

  return { currentStreak, longestStreak, completionRate30d, focusMinutes30d };
}

export interface DailyPoint { day: number; minutes: number }
export interface DailyCount { day: number; count: number }

export function dailyFocusMinutes(sessions: Session[], fromDay: number, days: number): DailyPoint[] {
  const buckets = new Map<number, number>();
  for (let i = 0; i < days; i++) buckets.set(addDays(fromDay, i), 0);
  for (const s of sessions) {
    if (s.kind !== 'work' || !s.completed) continue;
    const k = startOfDay(s.startedAt);
    if (buckets.has(k)) buckets.set(k, (buckets.get(k) ?? 0) + s.durationMs / 60_000);
  }
  return [...buckets.entries()].map(([day, minutes]) => ({ day, minutes }));
}

export function dailyCompletedCounts(tasks: Task[], fromDay: number, days: number): DailyCount[] {
  const buckets = new Map<number, number>();
  for (let i = 0; i < days; i++) buckets.set(addDays(fromDay, i), 0);
  for (const t of tasks) {
    if (t.completedAt === null) continue;
    const k = startOfDay(t.completedAt);
    if (buckets.has(k)) buckets.set(k, (buckets.get(k) ?? 0) + 1);
  }
  return [...buckets.entries()].map(([day, count]) => ({ day, count }));
}

export function timeOnSubject(sessions: Session[], from: number, to: number): Record<string, number> {
  const out: Record<string, number> = {};
  for (const s of sessions) {
    if (s.kind !== 'work' || !s.completed) continue;
    if (s.startedAt < from || s.startedAt >= to) continue;
    const key = s.subjectId ?? '__none__';
    out[key] = (out[key] ?? 0) + s.durationMs / 60_000;
  }
  return out;
}

export function weeklyFocusMinutes(sessions: Session[], weekStartsOn: 0 | 1, weeks: number, now: number): DailyPoint[] {
  const today = startOfDay(now);
  const dow = new Date(today).getDay();
  const offset = (dow - weekStartsOn + 7) % 7;
  const thisWeekStart = addDays(today, -offset);
  const buckets = new Map<number, number>();
  for (let i = weeks - 1; i >= 0; i--) buckets.set(addDays(thisWeekStart, -7 * i), 0);
  for (const s of sessions) {
    if (s.kind !== 'work' || !s.completed) continue;
    const d = startOfDay(s.startedAt);
    const o = (new Date(d).getDay() - weekStartsOn + 7) % 7;
    const wk = addDays(d, -o);
    if (buckets.has(wk)) buckets.set(wk, (buckets.get(wk) ?? 0) + s.durationMs / 60_000);
  }
  return [...buckets.entries()].map(([day, minutes]) => ({ day, minutes }));
}

export function hourOfDayHistogram(sessions: Session[]): number[] {
  const hours = new Array<number>(24).fill(0);
  for (const s of sessions) {
    if (s.kind !== 'work' || !s.completed) continue;
    const h = new Date(s.startedAt).getHours();
    hours[h] = (hours[h] ?? 0) + s.durationMs / 60_000;
  }
  return hours;
}

export interface LeaderboardRow {
  subject: Subject;
  focusMinutes: number;
  completionRate: number;
}

export function subjectLeaderboard(subjects: Subject[], tasks: Task[], sessions: Session[], from: number, to: number): LeaderboardRow[] {
  const focus = timeOnSubject(sessions, from, to);
  return subjects.map(subject => {
    const subjTasks = tasks.filter(t => t.subjectId === subject.id && (t.completedAt ?? t.createdAt) >= from);
    const done = subjTasks.filter(t => t.completedAt !== null).length;
    return {
      subject,
      focusMinutes: focus[subject.id] ?? 0,
      completionRate: subjTasks.length === 0 ? 0 : done / subjTasks.length,
    };
  }).sort((a, b) => b.focusMinutes - a.focusMinutes);
}
