import type { Session } from './types';

export function totalFocusMs(sessions: Session[]): number {
  return sessions
    .filter(s => s.kind === 'work' && s.completed)
    .reduce((sum, s) => sum + s.durationMs, 0);
}
