import { describe, it, expect } from 'vitest';
import { exportJSON, parseImport } from './io';
import { CURRENT_SCHEMA_VERSION, DEFAULT_SETTINGS } from './types';

describe('exportJSON / parseImport', () => {
  const state = {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    subjects: [{ id: 's1', name: 'A', color: '#000', createdAt: 1 }],
    tasks: [],
    sessions: [],
    settings: DEFAULT_SETTINGS,
  };

  it('round-trips through JSON', () => {
    const json = exportJSON(state);
    const result = parseImport(json);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.state).toEqual(state);
  });

  it('rejects malformed JSON', () => {
    const result = parseImport('{not json');
    expect(result.ok).toBe(false);
  });

  it('rejects valid JSON with wrong shape', () => {
    const result = parseImport('{"foo":1}');
    expect(result.ok).toBe(false);
  });
});
