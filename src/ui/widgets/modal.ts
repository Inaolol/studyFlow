export interface ModalHandle {
  close(): void;
  root: HTMLElement;
}

export function openModal(content: HTMLElement, opts: { onClose?: () => void } = {}): ModalHandle {
  const host = document.getElementById('modal-root');
  if (!host) throw new Error('#modal-root missing');

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');

  const panel = document.createElement('div');
  panel.className = 'modal-panel';
  panel.appendChild(content);
  overlay.appendChild(panel);
  host.appendChild(overlay);

  const onKey = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') handle.close();
  };
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) handle.close();
  });
  document.addEventListener('keydown', onKey);

  const focusable = panel.querySelector<HTMLElement>('input, button, textarea, select, [tabindex]:not([tabindex="-1"])');
  focusable?.focus();

  const handle: ModalHandle = {
    root: panel,
    close() {
      document.removeEventListener('keydown', onKey);
      overlay.remove();
      opts.onClose?.();
    },
  };
  return handle;
}
