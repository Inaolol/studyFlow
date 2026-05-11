import { describe, it, expect } from 'vitest';
import { kpis, dailyFocusMinutes, dailyCompletedCounts, timeOnSubject,
         weeklyFocusMinutes, hourOfDayHistogram, subjectLeaderboard } from './stats';
import type { Task, Session, Subject } from './types';

const day = 24 * 60 * 60_000;
const T0 = new Date('2026-05-01T00:00:00').getTime();  // local midnight ms

function sess(over: Partial<Session>): Session {
  return {
    id: crypto.randomUUID(), taskId: null, subjectId: null,
    startedAt: T0, endedAt: T0 + 25 * 60_000, durationMs: 25 * 60_000,
    kind: 'work', completed: true, ...over,
  };
}

describe('kpis', () => {
  it('counts current streak as consecutive days with focus', () => {
    const sessions: Session[] = [
      sess({ startedAt: T0 - day,   endedAt: T0 - day + 25*60_000 }),
      sess({ startedAt: T0 - 2*day, endedAt: T0 - 2*day + 25*60_000 }),
    ];
    const k = kpis([], sessions, T0);
    expect(k.currentStreak).toBe(2);
  });
  it('completion rate is 0 when no tasks', () => {
    const k = kpis([], [], T0);
    expect(k.completionRate30d).toBe(0);
  });
});

describe('dailyFocusMinutes', () => {
  it('buckets minutes into local-day keys for the requested window', () => {
    const sessions = [sess({ startedAt: T0 + 60_000, endedAt: T0 + 26 * 60_000 })];
    const series = dailyFocusMinutes(sessions, T0 - 6 * day, 7);
    expect(series).toHaveLength(7);
    expect(series[6]?.minutes).toBeCloseTo(25, 0);
  });
});

describe('dailyCompletedCounts', () => {
  it('counts tasks per completed-day in window', () => {
    const tasks: Task[] = [
      { id: '1', subjectId: null, title: 'a', dueAt: null, completedAt: T0 + 60_000, createdAt: 0 },
      { id: '2', subjectId: null, title: 'b', dueAt: null, completedAt: T0 - 30 * day, createdAt: 0 },
    ];
    const series = dailyCompletedCounts(tasks, T0 - 6 * day, 7);
    expect(series[6]?.count).toBe(1);
  });
});

describe('timeOnSubject', () => {
  it('groups work minutes by subjectId', () => {
    const sessions = [
      sess({ subjectId: 'a' }), sess({ subjectId: 'a' }),
      sess({ subjectId: 'b' }),
    ];
    const t = timeOnSubject(sessions, T0 - 30 * day, T0 + day);
    expect(t['a']).toBe(50);
    expect(t['b']).toBe(25);
  });
});

describe('weeklyFocusMinutes', () => {
  it('returns N weekly buckets including current week', () => {
    const w = weeklyFocusMinutes([sess({})], 1, 4, T0);
    expect(w).toHaveLength(4);
  });
});

describe('hourOfDayHistogram', () => {
  it('returns 24 buckets summing minutes', () => {
    const h = hourOfDayHistogram([sess({})]);
    expect(h).toHaveLength(24);
    expect(h.reduce((a, b) => a + b, 0)).toBeCloseTo(25, 0);
  });
});

describe('subjectLeaderboard', () => {
  it('orders subjects by focus minutes desc', () => {
    const subjects: Subject[] = [
      { id: 'a', name: 'A', color: '#000', createdAt: 0 },
      { id: 'b', name: 'B', color: '#000', createdAt: 0 },
    ];
    const tasks: Task[] = [];
    const sessions = [sess({ subjectId: 'b' }), sess({ subjectId: 'b' }), sess({ subjectId: 'a' })];
    const lb = subjectLeaderboard(subjects, tasks, sessions, T0 - 30 * day, T0 + day);
    expect(lb[0]?.subject.id).toBe('b');
  });
});
