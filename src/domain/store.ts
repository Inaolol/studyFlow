import { signal, effect, type Signal } from '@/reactive/signal';
import type { PersistedState, Subject, Task, Session, Settings, ActivePomodoro } from './types';
import { loadAndMigrate, NEW_KEY } from './migrations';
import { toast } from '@/ui/toast';

export interface Store {
  subjects: Signal<Subject[]>;
  tasks: Signal<Task[]>;
  sessions: Signal<Session[]>;
  settings: Signal<Settings>;
  active: Signal<ActivePomodoro | null>;
}

export function createStore(initial?: PersistedState): Store {
  const state = initial ?? loadAndMigrate();
  const store: Store = {
    subjects: signal(state.subjects),
    tasks: signal(state.tasks),
    sessions: signal(state.sessions),
    settings: signal(state.settings),
    active: signal(state.active ?? null),
  };

  let timeout: ReturnType<typeof setTimeout> | null = null;
  let pending: PersistedState | null = null;
  let firstRun = true;

  const flush = (): void => {
    if (pending === null) return;
    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = null;
    }
    try {
      localStorage.setItem(NEW_KEY, JSON.stringify(pending));
    } catch (err) {
      console.warn('Failed to persist StudyFlow state', err);
      toast('Could not save — local storage is full.', 'error');
    }
    pending = null;
  };

  effect(() => {
    const snap: PersistedState = {
      schemaVersion: 1,
      subjects: store.subjects(),
      tasks: store.tasks(),
      sessions: store.sessions(),
      settings: store.settings(),
      active: store.active(),
    };
    if (firstRun) {
      firstRun = false;
      return;
    }
    pending = snap;
    if (timeout !== null) clearTimeout(timeout);
    timeout = setTimeout(flush, 200);
  });

  if (typeof window !== 'undefined') {
    window.addEventListener('pagehide', flush);
  }

  return store;
}

export function snapshot(store: Store): PersistedState {
  return {
    schemaVersion: 1,
    subjects: store.subjects(),
    tasks: store.tasks(),
    sessions: store.sessions(),
    settings: store.settings(),
    active: store.active(),
  };
}
