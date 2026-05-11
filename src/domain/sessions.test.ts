import { describe, it, expect } from 'vitest';
import { buildSession, totalFocusMs } from './sessions';
import type { Session } from './types';

describe('buildSession', () => {
  it('records a completed work session with actual duration', () => {
    const s = buildSession({
      id: 's1', taskId: 't1', subjectId: 'sub1',
      startedAt: 1000, endedAt: 1000 + 25 * 60_000,
      plannedDurationMs: 25 * 60_000,
      kind: 'work', completed: true,
    });
    expect(s).toEqual<Session>({
      id: 's1', taskId: 't1', subjectId: 'sub1',
      startedAt: 1000, endedAt: 1000 + 25 * 60_000,
      durationMs: 25 * 60_000, kind: 'work', completed: true,
    });
  });

  it('records an aborted session with elapsed actual duration, not planned', () => {
    const s = buildSession({
      id: 's2', taskId: null, subjectId: null,
      startedAt: 0, endedAt: 10 * 60_000,
      plannedDurationMs: 25 * 60_000,
      kind: 'work', completed: false,
    });
    expect(s.durationMs).toBe(10 * 60_000);
    expect(s.completed).toBe(false);
  });
});

describe('totalFocusMs', () => {
  it('sums only completed work sessions', () => {
    const sessions: Session[] = [
      { id: '1', taskId: null, subjectId: null, startedAt: 0, endedAt: 1000, durationMs: 1000, kind: 'work', completed: true },
      { id: '2', taskId: null, subjectId: null, startedAt: 0, endedAt: 500,  durationMs: 500,  kind: 'work', completed: false },
      { id: '3', taskId: null, subjectId: null, startedAt: 0, endedAt: 2000, durationMs: 2000, kind: 'short-break', completed: true },
    ];
    expect(totalFocusMs(sessions)).toBe(1000);
  });
});
