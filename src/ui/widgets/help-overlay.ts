import { effect, signal } from '@/reactive/signal';

const open = signal(false);

export const helpOverlay = {
  toggle(): void { open.set(!open()); },
  mount(): () => void {
    const node = document.createElement('div');
    node.className = 'help-overlay';
    node.setAttribute('role', 'dialog');
    node.setAttribute('aria-label', 'Keyboard shortcuts');
    node.innerHTML = `
      <div class="help-overlay__panel">
        <h3>Keyboard shortcuts</h3>
        <dl>
          <dt><kbd>g</kbd> <kbd>t</kbd></dt><dd>Today</dd>
          <dt><kbd>g</kbd> <kbd>s</kbd></dt><dd>Subjects</dd>
          <dt><kbd>g</kbd> <kbd>c</kbd></dt><dd>Calendar</dd>
          <dt><kbd>g</kbd> <kbd>d</kbd></dt><dd>Stats</dd>
          <dt><kbd>n</kbd></dt><dd>New task</dd>
          <dt><kbd>/</kbd></dt><dd>Focus search</dd>
          <dt><kbd>?</kbd></dt><dd>Toggle this help</dd>
        </dl>
        <button class="btn" data-act="close">Close</button>
      </div>
    `;
    document.body.appendChild(node);
    const onClose = (): void => open.set(false);
    node.querySelector<HTMLButtonElement>('[data-act="close"]')!.addEventListener('click', onClose);
    node.addEventListener('click', e => { if (e.target === node) onClose(); });

    const stop = effect(() => { node.classList.toggle('is-open', open()); });
    return () => { stop(); node.remove(); };
  },
};
