import type { Store } from '@/domain/store';
import type { Router } from '@/ui/router';
export function renderCalendar(host: HTMLElement, _store: Store, _router: Router): () => void {
  host.innerHTML = '<p>Calendar (placeholder)</p>';
  return () => { host.innerHTML = ''; };
}
