import type { PersistedState } from './types';
import { CURRENT_SCHEMA_VERSION } from './types';

export type ImportResult =
  | { ok: true; state: PersistedState }
  | { ok: false; reason: string };

export function exportJSON(state: PersistedState): string {
  return JSON.stringify(state, null, 2);
}

export function parseImport(json: string): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { ok: false, reason: 'Invalid JSON' };
  }
  if (!isValid(parsed)) return { ok: false, reason: 'Unrecognized data shape' };
  return { ok: true, state: parsed };
}

function isValid(x: unknown): x is PersistedState {
  if (typeof x !== 'object' || x === null || Array.isArray(x)) return false;
  const o = x as Record<string, unknown>;
  return o.schemaVersion === CURRENT_SCHEMA_VERSION
    && Array.isArray(o.subjects)
    && Array.isArray(o.tasks)
    && Array.isArray(o.sessions)
    && typeof o.settings === 'object' && o.settings !== null;
}
