import type { Store } from '@/domain/store';
import type { Router } from '@/ui/router';
export function renderHome(host: HTMLElement, _store: Store, _router: Router): () => void {
  host.innerHTML = '<p>Home (placeholder)</p>';
  return () => { host.innerHTML = ''; };
}
