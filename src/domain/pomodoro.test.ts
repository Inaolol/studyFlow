import { describe, it, expect } from 'vitest';
import { elapsedMs, remainingMs, isComplete, nextKind } from './pomodoro';
import type { ActivePomodoro } from './types';

function active(over: Partial<ActivePomodoro> = {}): ActivePomodoro {
  return {
    taskId: null, subjectId: null, kind: 'work',
    startedAt: 1_000_000,
    plannedDurationMs: 25 * 60_000,
    cycleIndex: 0,
    paused: false, pausedAt: null, accumulatedPauseMs: 0,
    ...over,
  };
}

describe('elapsedMs', () => {
  it('returns now - startedAt minus accumulated pause', () => {
    const a = active({ accumulatedPauseMs: 30_000 });
    expect(elapsedMs(a, 1_000_000 + 5 * 60_000)).toBe(5 * 60_000 - 30_000);
  });
  it('while paused, freezes elapsed at pausedAt', () => {
    const a = active({ paused: true, pausedAt: 1_000_000 + 3 * 60_000 });
    expect(elapsedMs(a, 1_000_000 + 999 * 60_000)).toBe(3 * 60_000);
  });
});

describe('remainingMs', () => {
  it('clamps at 0', () => {
    const a = active();
    expect(remainingMs(a, 1_000_000 + 999 * 60_000)).toBe(0);
  });
});

describe('isComplete', () => {
  it('true when elapsed >= planned', () => {
    const a = active();
    expect(isComplete(a, a.startedAt + a.plannedDurationMs)).toBe(true);
    expect(isComplete(a, a.startedAt + a.plannedDurationMs - 1)).toBe(false);
  });
});

describe('nextKind', () => {
  it('after work → long-break when cycleIndex+1 is multiple of longEvery', () => {
    expect(nextKind('work', 3, 4)).toBe('long-break');
    expect(nextKind('work', 0, 4)).toBe('short-break');
  });
  it('after any break → work', () => {
    expect(nextKind('short-break', 1, 4)).toBe('work');
    expect(nextKind('long-break',  3, 4)).toBe('work');
  });
});
