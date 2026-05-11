import type { ActivePomodoro } from './types';

export function elapsedMs(a: ActivePomodoro, now: number): number {
  const baseEnd = a.paused && a.pausedAt !== null ? a.pausedAt : now;
  return Math.max(0, baseEnd - a.startedAt - a.accumulatedPauseMs);
}

export function remainingMs(a: ActivePomodoro, now: number): number {
  return Math.max(0, a.plannedDurationMs - elapsedMs(a, now));
}

export function isComplete(a: ActivePomodoro, now: number): boolean {
  return elapsedMs(a, now) >= a.plannedDurationMs;
}

export type Kind = ActivePomodoro['kind'];

export function nextKind(prev: Kind, prevCycleIndex: number, longEvery: number): Kind {
  if (prev !== 'work') return 'work';
  return (prevCycleIndex + 1) % longEvery === 0 ? 'long-break' : 'short-break';
}
