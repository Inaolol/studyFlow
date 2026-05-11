import { createStore } from '@/domain/store';
import { createRouter } from '@/ui/router';
import { effect } from '@/reactive/signal';
import { renderHome } from '@/ui/screens/home';
import { renderToday } from '@/ui/screens/today';
import { renderSubjects } from '@/ui/screens/subjects';
import { renderCalendar } from '@/ui/screens/calendar';
import { renderStats } from '@/ui/screens/stats';
import { renderSettings } from '@/ui/screens/settings';
import type { Route, Router } from '@/ui/router';
import type { Store } from '@/domain/store';

const store = createStore();
const router = createRouter();
const root = document.getElementById('app');
if (!root) throw new Error('#app mount point missing');

let dispose: (() => void) | null = null;

effect(() => {
  const route = router.current();
  if (dispose) { dispose(); dispose = null; }
  dispose = mountRoute(route, store, router, root);
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
