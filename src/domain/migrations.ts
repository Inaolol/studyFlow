import {
  CURRENT_SCHEMA_VERSION,
  DEFAULT_SETTINGS,
  type PersistedState,
  type Subject,
  type Task,
} from './types';
import { parseISODate } from './dates';

export const LEGACY_KEY = 'studyflow_static_v1';
export const NEW_KEY = 'studyflow:v1';

type Now = () => number;

export function loadAndMigrate(now: Now = () => Date.now()): PersistedState {
  // Try new key first.
  const rawNew = localStorage.getItem(NEW_KEY);
  if (rawNew !== null) {
    try {
      const parsed = JSON.parse(rawNew) as unknown;
      if (isValidState(parsed)) return parsed;
      backup(NEW_KEY, rawNew, now());
    } catch {
      backup(NEW_KEY, rawNew, now());
    }
  }

  // Fall back to legacy.
  const rawLegacy = localStorage.getItem(LEGACY_KEY);
  if (rawLegacy !== null) {
    try {
      const parsed = JSON.parse(rawLegacy) as unknown;
      const migrated = migrateLegacy(parsed, now());
      localStorage.setItem(NEW_KEY, JSON.stringify(migrated));
      return migrated;
    } catch {
      backup(LEGACY_KEY, rawLegacy, now());
    }
  }

  return defaults();
}

function defaults(): PersistedState {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    subjects: [],
    tasks: [],
    sessions: [],
    settings: DEFAULT_SETTINGS,
  };
}

function migrateLegacy(raw: unknown, now: number): PersistedState {
  if (!isObject(raw)) return defaults();
  const legacySubjects = Array.isArray(raw.subjects) ? raw.subjects : [];
  const legacyTasks = Array.isArray(raw.tasks) ? raw.tasks : [];

  const subjects: Subject[] = legacySubjects
    .filter(isObject)
    .map(s => ({
      id: String(s.id),
      name: typeof s.name === 'string' ? s.name : '',
      color: typeof s.color === 'string' ? s.color : '#888888',
      createdAt: now,
    }));

  const tasks: Task[] = legacyTasks
    .filter(isObject)
    .map(t => {
      const dueIso = typeof t.due === 'string' ? t.due : null;
      const dueAt = dueIso ? parseISODate(dueIso) : null;
      const done = t.done === true;
      const est = typeof t.est === 'number' ? t.est : undefined;
      const notes = typeof t.notes === 'string' && t.notes.length > 0 ? t.notes : undefined;
      return {
        id: String(t.id),
        subjectId: typeof t.subjectId === 'string' ? t.subjectId : null,
        title: typeof t.title === 'string' ? t.title : '',
        ...(notes !== undefined ? { notes } : {}),
        dueAt,
        completedAt: done ? now : null,
        ...(est !== undefined ? { estimatedMinutes: est } : {}),
        createdAt: now,
      };
    });

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    subjects,
    tasks,
    sessions: [],
    settings: DEFAULT_SETTINGS,
    active: null,
  };
}

function isValidState(x: unknown): x is PersistedState {
  if (!isObject(x)) return false;
  if (x.schemaVersion !== CURRENT_SCHEMA_VERSION) return false;
  return Array.isArray(x.subjects) && Array.isArray(x.tasks)
    && Array.isArray(x.sessions) && isObject(x.settings);
}

function isObject(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

function backup(key: string, raw: string, now: number): void {
  const backupKey = `studyflow:backup-${now}`;
  try {
    localStorage.setItem(backupKey, raw);
  } catch {
    // Quota exceeded — proceed; user data is lost but app still works.
  }
  localStorage.removeItem(key);
}
