import type { Store } from '@/domain/store';
import type { Router } from '@/ui/router';
export function renderStats(host: HTMLElement, _store: Store, _router: Router): () => void {
  host.innerHTML = '<section class="screen-stats"><h2>Stats</h2><p class="empty-state">Coming online…</p></section>';
  return () => { host.innerHTML = ''; };
}
