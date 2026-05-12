import { describe, it, expect } from 'vitest';
import { exportICal } from './ical';
import type { Task } from './types';

const baseTask: Task = {
  id: 'abc-123',
  subjectId: null,
  title: 'Read chapter 4',
  dueAt: new Date('2026-05-15').getTime(),
  completedAt: null,
  createdAt: 1_000_000,
};

describe('exportICal', () => {
  it('wraps output in VCALENDAR with one VTODO', () => {
    const result = exportICal([baseTask]);
    expect(result).toContain('BEGIN:VCALENDAR');
    expect(result).toContain('END:VCALENDAR');
    expect(result).toContain('BEGIN:VTODO');
    expect(result).toContain('END:VTODO');
    expect(result).toContain('SUMMARY:Read chapter 4');
    expect(result).toContain(`UID:abc-123@studyflow`);
  });

  it('excludes tasks without dueAt', () => {
    const noDate: Task = { ...baseTask, id: 'no-date', dueAt: null };
    const result = exportICal([noDate]);
    expect(result).not.toContain('BEGIN:VTODO');
  });

  it('excludes completed tasks', () => {
    const done: Task = { ...baseTask, id: 'done', completedAt: Date.now() };
    const result = exportICal([done]);
    expect(result).not.toContain('BEGIN:VTODO');
  });

  it('includes notes as DESCRIPTION when present', () => {
    const withNotes: Task = { ...baseTask, notes: 'Focus on section 2' };
    const result = exportICal([withNotes]);
    expect(result).toContain('DESCRIPTION:Focus on section 2');
  });

  it('escapes special characters in title', () => {
    const special: Task = { ...baseTask, title: 'Chemistry, Lab; Results' };
    const result = exportICal([special]);
    expect(result).toContain('SUMMARY:Chemistry\\, Lab\\; Results');
  });

  it('folds lines longer than 75 characters', () => {
    const longTitle: Task = { ...baseTask, title: 'A'.repeat(80) };
    const result = exportICal([longTitle]);
    const lines = result.split('\r\n');
    expect(lines.every(l => l.length <= 75)).toBe(true);
  });
});
