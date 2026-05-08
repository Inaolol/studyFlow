import type { Store } from '@/domain/store';
import type { Router } from '@/ui/router';
export function renderToday(host: HTMLElement, _store: Store, _router: Router): () => void {
  host.innerHTML = '<p>Today (placeholder)</p>';
  return () => { host.innerHTML = ''; };
}
