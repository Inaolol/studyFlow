let liveRegion: HTMLElement | null = null;

function ensureLiveRegion(): HTMLElement {
  if (liveRegion && liveRegion.isConnected) return liveRegion;
  const el = document.createElement('div');
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');
  el.setAttribute('aria-atomic', 'true');
  el.className = 'toast-region';
  document.body.appendChild(el);
  liveRegion = el;
  return el;
}

export function toast(message: string, kind: 'info' | 'error' = 'info'): void {
  const region = ensureLiveRegion();
  const node = document.createElement('div');
  node.className = `toast toast--${kind}`;
  node.textContent = message;
  region.appendChild(node);
  setTimeout(() => node.remove(), 4000);
}
