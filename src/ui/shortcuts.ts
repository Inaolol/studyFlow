import type { Router, RouteName } from './router';

export function shouldIgnore(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable || target.getAttribute('contenteditable') === 'true') return true;
  return false;
}

const GO_MAP: Record<string, RouteName | 'help'> = {
  t: 'today', s: 'subjects', c: 'calendar', d: 'stats', '?': 'help',
};

export interface ShortcutHandlers {
  newTask(): void;
  focusSearch(): void;
  toggleHelp(): void;
}

export function installShortcuts(router: Router, h: ShortcutHandlers): () => void {
  let goArmed = false;
  let goTimer: ReturnType<typeof setTimeout> | null = null;

  function onKey(e: KeyboardEvent): void {
    if (shouldIgnore(e.target)) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    if (goArmed) {
      goArmed = false;
      if (goTimer) clearTimeout(goTimer);
      const target = GO_MAP[e.key];
      if (target === 'help') { h.toggleHelp(); e.preventDefault(); return; }
      if (target) { router.navigate(target); e.preventDefault(); return; }
      return;
    }
    if (e.key === 'g') {
      goArmed = true;
      goTimer = setTimeout(() => { goArmed = false; }, 1200);
      e.preventDefault();
      return;
    }
    if (e.key === 'n') { h.newTask(); e.preventDefault(); return; }
    if (e.key === '/') { h.focusSearch(); e.preventDefault(); return; }
    if (e.key === '?') { h.toggleHelp(); e.preventDefault(); return; }
  }
  window.addEventListener('keydown', onKey);
  return () => window.removeEventListener('keydown', onKey);
}
