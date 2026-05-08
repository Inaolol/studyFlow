import type { Store } from '@/domain/store';
import type { Router } from '@/ui/router';
export function renderSubjects(host: HTMLElement, _store: Store, _router: Router): () => void {
  host.innerHTML = '<p>Subjects (placeholder)</p>';
  return () => { host.innerHTML = ''; };
}
