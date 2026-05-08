import { signal, effect, type Signal } from '@/reactive/signal';
import type { PersistedState, Subject, Task, Session, Settings } from './types';
import { loadAndMigrate, NEW_KEY } from './migrations';

export interface Store {
  subjects: Signal<Subject[]>;
  tasks: Signal<Task[]>;
  sessions: Signal<Session[]>;
  settings: Signal<Settings>;
}

export function createStore(initial?: PersistedState): Store {
  const state = initial ?? loadAndMigrate();
  const store: Store = {
    subjects: signal(state.subjects),
    tasks: signal(state.tasks),
    sessions: signal(state.sessions),
    settings: signal(state.settings),
  };

  let timeout: ReturnType<typeof setTimeout> | null = null;
  effect(() => {
    // Read all signals so the effect re-runs on any change.
    const snapshot: PersistedState = {
      schemaVersion: 1,
      subjects: store.subjects(),
      tasks: store.tasks(),
      sessions: store.sessions(),
      settings: store.settings(),
    };
    if (timeout !== null) clearTimeout(timeout);
    timeout = setTimeout(() => {
      try {
        localStorage.setItem(NEW_KEY, JSON.stringify(snapshot));
      } catch (err) {
        console.warn('Failed to persist StudyFlow state', err);
      }
    }, 200);
  });

  return store;
}

export function snapshot(store: Store): PersistedState {
  return {
    schemaVersion: 1,
    subjects: store.subjects(),
    tasks: store.tasks(),
    sessions: store.sessions(),
    settings: store.settings(),
  };
}
