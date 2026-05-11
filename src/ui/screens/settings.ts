import type { Store } from '@/domain/store';
import type { Router } from '@/ui/router';
export function renderSettings(host: HTMLElement, _store: Store, _router: Router): () => void {
  host.innerHTML = '<section class="screen-settings"><h2>Settings</h2></section>';
  return () => { host.innerHTML = ''; };
}
