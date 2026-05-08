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
