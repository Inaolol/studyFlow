import { signal, type Signal } from '@/reactive/signal';

export type RouteName = 'home' | 'today' | 'subjects' | 'calendar' | 'settings' | 'stats';

export interface Route {
  name: RouteName;
}

const VALID = new Set<RouteName>(['home', 'today', 'subjects', 'calendar', 'settings', 'stats']);

export function parseRoute(hash: string): Route {
  const cleaned = hash.replace(/^#\/?/, '').trim();
  if (cleaned === '') return { name: 'home' };
  if (VALID.has(cleaned as RouteName)) return { name: cleaned as RouteName };
  return { name: 'home' };
}

export interface Router {
  current: Signal<Route>;
  navigate(name: RouteName): void;
}

export function createRouter(): Router {
  const current = signal<Route>(parseRoute(location.hash));
  window.addEventListener('hashchange', () => {
    current.set(parseRoute(location.hash));
  });
  return {
    current,
    navigate: (name: RouteName) => {
      location.hash = name === 'home' ? '/' : `/${name}`;
    },
  };
}
