import type { Subject, ID } from './types';

export function subjectsById(subjects: Subject[]): Record<ID, Subject> {
  const out: Record<ID, Subject> = {};
  for (const s of subjects) out[s.id] = s;
  return out;
}
