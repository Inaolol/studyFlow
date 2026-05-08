import { describe, it, expect, beforeEach } from 'vitest';
import { loadAndMigrate, NEW_KEY, LEGACY_KEY } from './migrations';
import { CURRENT_SCHEMA_VERSION, DEFAULT_SETTINGS } from './types';

describe('loadAndMigrate', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns defaults when no data exists', () => {
    const state = loadAndMigrate(() => 1_700_000_000_000);
    expect(state.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(state.subjects).toEqual([]);
    expect(state.tasks).toEqual([]);
    expect(state.sessions).toEqual([]);
    expect(state.settings).toEqual(DEFAULT_SETTINGS);
  });

  it('migrates legacy v0 data to v1', () => {
    const legacy = {
      subjects: [
        { id: 's1', name: 'Calc II', color: '#E34432', code: 'MATH 221' },
      ],
      tasks: [
        { id: 't1', title: 'Problem set', subjectId: 's1', due: '2026-05-08',
          priority: 'high', est: 60, done: false, notes: 'Read first' },
        { id: 't2', title: 'Read Ch 12', subjectId: 's1', due: '2026-05-09',
          priority: 'medium', est: 45, done: true, notes: '' },
      ],
    };
    localStorage.setItem(LEGACY_KEY, JSON.stringify(legacy));

    const NOW = 1_700_000_000_000;
    const state = loadAndMigrate(() => NOW);

    expect(state.schemaVersion).toBe(1);
    expect(state.subjects).toHaveLength(1);
    expect(state.subjects[0]).toMatchObject({ id: 's1', name: 'Calc II', color: '#E34432' });
    expect(state.tasks).toHaveLength(2);
    expect(state.tasks[0]).toMatchObject({
      id: 't1', title: 'Problem set', subjectId: 's1', notes: 'Read first',
      completedAt: null, estimatedMinutes: 60,
    });
    expect(state.tasks[0]!.dueAt).toBe(new Date(2026, 4, 8).getTime());
    expect(state.tasks[1]!.completedAt).toBe(NOW);
  });

  it('reads v1 data unchanged', () => {
    const v1 = {
      schemaVersion: 1,
      subjects: [{ id: 's1', name: 'A', color: '#000', createdAt: 1 }],
      tasks: [],
      sessions: [],
      settings: DEFAULT_SETTINGS,
    };
    localStorage.setItem(NEW_KEY, JSON.stringify(v1));

    const state = loadAndMigrate(() => 1_700_000_000_000);
    expect(state).toEqual(v1);
  });

  it('backs up corrupted data and returns defaults', () => {
    localStorage.setItem(NEW_KEY, '{not json');
    const state = loadAndMigrate(() => 1_700_000_000_000);
    expect(state.tasks).toEqual([]);
    const backupKey = Object.keys(localStorage).find(k => k.startsWith('studyflow:backup-'));
    expect(backupKey).toBeDefined();
  });
});
