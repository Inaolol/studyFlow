import { createStore } from '@/domain/store';
import { createRouter } from '@/ui/router';
import { effect } from '@/reactive/signal';
import { renderHome } from '@/ui/screens/home';
import { renderToday } from '@/ui/screens/today';
import { renderSubjects } from '@/ui/screens/subjects';
import { renderCalendar } from '@/ui/screens/calendar';
import { renderStats } from '@/ui/screens/stats';
import { renderSettings } from '@/ui/screens/settings';
import { mountPomodoro, recoverActive } from '@/ui/widgets/pomodoro';
import { installShortcuts } from '@/ui/shortcuts';
import { helpOverlay } from '@/ui/widgets/help-overlay';
import { openTaskModal } from '@/ui/screens/today.modal';
import type { Route, Router } from '@/ui/router';
import type { Store } from '@/domain/store';

const store = createStore();
const router = createRouter();
const root = document.getElementById('app');
if (!root) throw new Error('#app mount point missing');

const themeMql = matchMedia('(prefers-color-scheme: dark)');
const reduceMql = matchMedia('(prefers-reduced-motion: reduce)');

effect(() => {
  const { theme, reducedMotion } = store.settings();
  const resolvedTheme = theme === 'system' ? (themeMql.matches ? 'dark' : 'light') : theme;
  document.documentElement.setAttribute('data-theme', resolvedTheme);
  const resolvedRM =
    reducedMotion === 'system' ? (reduceMql.matches ? 'on' : 'off') :
    reducedMotion;
  document.documentElement.setAttribute('data-reduced-motion', resolvedRM);
});

// Re-trigger when OS preference changes while user is in "system" mode.
themeMql.addEventListener('change', () => { store.settings.set({ ...store.settings() }); });
reduceMql.addEventListener('change', () => { store.settings.set({ ...store.settings() }); });

let dispose: (() => void) | null = null;

effect(() => {
  const route = router.current();
  if (dispose) { dispose(); dispose = null; }
  dispose = mountRoute(route, store, router, root);
});

mountPomodoro(document.body, store);
recoverActive(store);

helpOverlay.mount();
installShortcuts(router, {
  newTask: () => {
    if (router.current().name !== 'today') router.navigate('today');
    openTaskModal({ store });
  },
  focusSearch: () => {
    if (router.current().name !== 'today') router.navigate('today');
    requestAnimationFrame(() => document.querySelector<HTMLInputElement>('#task-search')?.focus());
  },
  toggleHelp: () => helpOverlay.toggle(),
});

function mountRoute(route: Route, store: Store, router: Router, host: HTMLElement): () => void {
  switch (route.name) {
    case 'home': return renderHome(host, store, router);
    case 'today': return renderToday(host, store, router);
    case 'subjects': return renderSubjects(host, store, router);
    case 'calendar': return renderCalendar(host, store, router);
    case 'stats': return renderStats(host, store, router);
    case 'settings': return renderSettings(host, store, router);
  }
}
