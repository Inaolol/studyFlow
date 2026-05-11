import { describe, it, expect, beforeEach } from 'vitest';
import { parseRoute, type Route } from './router';

describe('parseRoute', () => {
  beforeEach(() => {
    history.replaceState(null, '', '/');
  });

  const cases: Array<[string, Route]> = [
    ['', { name: 'home' }],
    ['#', { name: 'home' }],
    ['#/', { name: 'home' }],
    ['#/today', { name: 'today' }],
    ['#/subjects', { name: 'subjects' }],
    ['#/calendar', { name: 'calendar' }],
    ['#/garbage', { name: 'home' }],
  ];

  for (const [hash, expected] of cases) {
    it(`parses '${hash}' → ${expected.name}`, () => {
      expect(parseRoute(hash)).toEqual(expected);
    });
  }
});

describe('parseRoute — phase 2', () => {
  it('routes #/settings to settings', () => {
    expect(parseRoute('#/settings')).toEqual({ name: 'settings' });
  });
  it('routes #/stats to stats', () => {
    expect(parseRoute('#/stats')).toEqual({ name: 'stats' });
  });
});
