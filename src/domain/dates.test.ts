import { describe, it, expect } from 'vitest';
import { startOfDay, addDays, isOverdue, startOfWeek, daysBetween, parseISODate } from './dates';

describe('startOfDay', () => {
  it('returns local midnight for a given timestamp', () => {
    const noon = new Date(2026, 4, 8, 12, 30).getTime(); // local
    const midnight = new Date(2026, 4, 8, 0, 0, 0, 0).getTime();
    expect(startOfDay(noon)).toBe(midnight);
  });
});

describe('addDays', () => {
  it('handles DST forward and back without drifting', () => {
    // Pick a known DST transition: in many tz, March 9 2026 spring forward.
    // We assert the day part rather than exact hours.
    const start = new Date(2026, 2, 7, 12, 0).getTime();
    const plusTwo = addDays(start, 2);
    const d = new Date(plusTwo);
    expect(d.getDate()).toBe(9);
    expect(d.getMonth()).toBe(2);
  });
});

describe('isOverdue', () => {
  it('returns false when due is later today', () => {
    const now = new Date(2026, 4, 8, 9, 0).getTime();
    const due = new Date(2026, 4, 8, 0, 0).getTime();
    expect(isOverdue(due, now)).toBe(false);
  });

  it('returns true when due was a previous day', () => {
    const now = new Date(2026, 4, 8, 9, 0).getTime();
    const due = new Date(2026, 4, 7, 0, 0).getTime();
    expect(isOverdue(due, now)).toBe(true);
  });

  it('returns false for null due', () => {
    expect(isOverdue(null, Date.now())).toBe(false);
  });
});

describe('startOfWeek', () => {
  it('Monday-week treats Monday as the first day', () => {
    const wed = new Date(2026, 4, 6).getTime(); // Wed May 6 2026
    const mon = new Date(2026, 4, 4).getTime(); // Mon May 4 2026
    expect(startOfWeek(wed, 1)).toBe(mon);
  });

  it('Sunday-week treats Sunday as the first day', () => {
    const wed = new Date(2026, 4, 6).getTime();
    const sun = new Date(2026, 4, 3).getTime();
    expect(startOfWeek(wed, 0)).toBe(sun);
  });
});

describe('parseISODate', () => {
  it('parses YYYY-MM-DD as local midnight', () => {
    const t = parseISODate('2026-05-08');
    const d = new Date(t);
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(4);
    expect(d.getDate()).toBe(8);
    expect(d.getHours()).toBe(0);
  });
});

describe('daysBetween', () => {
  it('returns the number of whole days from a to b', () => {
    const a = new Date(2026, 4, 8).getTime();
    const b = new Date(2026, 4, 11).getTime();
    expect(daysBetween(a, b)).toBe(3);
  });
});
