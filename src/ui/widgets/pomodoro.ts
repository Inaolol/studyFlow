import { effect } from '@/reactive/signal';
import type { Store } from '@/domain/store';
import { remainingMs, isComplete, nextKind } from '@/domain/pomodoro';
import { buildSession } from '@/domain/sessions';
import { toast } from '@/ui/toast';

export function mountPomodoro(host: HTMLElement, store: Store): () => void {
  const node = document.createElement('aside');
  node.className = 'pomodoro';
  node.setAttribute('aria-label', 'Pomodoro timer');
  host.appendChild(node);

  let raf: number | null = null;
  const tick = (): void => {
    render();
    const a = store.active();
    if (a && !a.paused) {
      const now = Date.now();
      if (isComplete(a, now)) {
        complete();
        return;
      }
    }
    raf = requestAnimationFrame(tick);
  };

  function render(): void {
    const a = store.active();
    if (!a) { node.innerHTML = ''; node.classList.remove('is-active'); return; }
    node.classList.add('is-active');
    const rem = remainingMs(a, Date.now());
    const mm = String(Math.floor(rem / 60_000)).padStart(2, '0');
    const ss = String(Math.floor((rem % 60_000) / 1000)).padStart(2, '0');
    const task = a.taskId ? store.tasks().find(t => t.id === a.taskId) : null;
    node.innerHTML = `
      <div class="pomodoro__label">${a.kind.replace('-', ' ')}${task ? ` · ${escape(task.title)}` : ''}</div>
      <div class="pomodoro__clock" aria-live="off">${mm}:${ss}</div>
      <div class="pomodoro__controls">
        <button data-act="pause">${a.paused ? 'Resume' : 'Pause'}</button>
        <button data-act="abort">Abort</button>
      </div>
    `;
    node.querySelector<HTMLButtonElement>('[data-act="pause"]')!.addEventListener('click', togglePause);
    node.querySelector<HTMLButtonElement>('[data-act="abort"]')!.addEventListener('click', abort);
  }

  function togglePause(): void {
    const a = store.active(); if (!a) return;
    const now = Date.now();
    if (a.paused && a.pausedAt !== null) {
      store.active.set({ ...a, paused: false, pausedAt: null, accumulatedPauseMs: a.accumulatedPauseMs + (now - a.pausedAt) });
    } else {
      store.active.set({ ...a, paused: true, pausedAt: now });
    }
  }

  function abort(): void {
    const a = store.active(); if (!a) return;
    if (a.kind === 'work') {
      const session = buildSession({
        id: crypto.randomUUID(),
        taskId: a.taskId, subjectId: a.subjectId,
        startedAt: a.startedAt, endedAt: Date.now(),
        plannedDurationMs: a.plannedDurationMs,
        kind: 'work', completed: false,
      });
      store.sessions.set([...store.sessions(), session]);
    }
    store.active.set(null);
    toast('Pomodoro aborted');
  }

  function complete(): void {
    const a = store.active(); if (!a) return;
    if (a.kind === 'work') {
      const session = buildSession({
        id: crypto.randomUUID(),
        taskId: a.taskId, subjectId: a.subjectId,
        startedAt: a.startedAt, endedAt: a.startedAt + a.plannedDurationMs,
        plannedDurationMs: a.plannedDurationMs,
        kind: 'work', completed: true,
      });
      store.sessions.set([...store.sessions(), session]);
    }
    const settings = store.settings();
    const nk = nextKind(a.kind, a.cycleIndex, settings.pomodoro.longEvery);
    const durMin =
      nk === 'work' ? settings.pomodoro.workMin :
      nk === 'short-break' ? settings.pomodoro.shortBreakMin :
      settings.pomodoro.longBreakMin;
    store.active.set({
      taskId: a.taskId, subjectId: a.subjectId,
      kind: nk, startedAt: Date.now(),
      plannedDurationMs: durMin * 60_000,
      cycleIndex: a.kind === 'work' ? a.cycleIndex + 1 : a.cycleIndex,
      paused: false, pausedAt: null, accumulatedPauseMs: 0,
    });
    toast(a.kind === 'work' ? 'Work block complete — break time' : 'Break over — back to work');
  }

  const stopActive = effect(() => {
    const a = store.active();
    render();
    if (a && raf === null) { raf = requestAnimationFrame(tick); }
    if (!a && raf !== null) { cancelAnimationFrame(raf); raf = null; }
  });

  return () => {
    stopActive();
    if (raf !== null) cancelAnimationFrame(raf);
    node.remove();
  };
}

function escape(s: string): string {
  return s.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]!));
}
