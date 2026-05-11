import type { ID, Session } from './types';

export interface BuildSessionInput {
  id: ID;
  taskId: ID | null;
  subjectId: ID | null;
  startedAt: number;
  endedAt: number;
  /** Part of the caller contract — accepted for future logic; actual duration is derived from endedAt - startedAt. */
  plannedDurationMs: number;
  kind: Session['kind'];
  completed: boolean;
}

export function buildSession(input: BuildSessionInput): Session {
  return {
    id: input.id,
    taskId: input.taskId,
    subjectId: input.subjectId,
    startedAt: input.startedAt,
    endedAt: input.endedAt,
    durationMs: Math.max(0, input.endedAt - input.startedAt),
    kind: input.kind,
    completed: input.completed,
  };
}

export function totalFocusMs(sessions: Session[]): number {
  return sessions
    .filter(s => s.kind === 'work' && s.completed)
    .reduce((sum, s) => sum + s.durationMs, 0);
}
