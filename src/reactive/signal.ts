type EffectFn = () => void;

interface Effect {
  fn: EffectFn;
  deps: Set<Set<Effect>>;
  queued: boolean;
  disposed: boolean;
}

let currentEffect: Effect | null = null;
const queue = new Set<Effect>();
let flushScheduled = false;

export interface Signal<T> {
  (): T;
  set(next: T): void;
}

export function signal<T>(initial: T): Signal<T> {
  let value = initial;
  const subscribers = new Set<Effect>();

  const read = (() => {
    if (currentEffect) {
      subscribers.add(currentEffect);
      currentEffect.deps.add(subscribers);
    }
    return value;
  }) as Signal<T>;

  read.set = (next: T) => {
    if (Object.is(value, next)) return;
    value = next;
    for (const sub of subscribers) schedule(sub);
  };

  return read;
}

export function effect(fn: EffectFn): () => void {
  const eff: Effect = { fn, deps: new Set(), queued: false, disposed: false };
  runEffect(eff);
  return () => {
    eff.disposed = true;
    cleanupDeps(eff);
  };
}

export function computed<T>(fn: () => T): () => T {
  const result = signal<T>(undefined as unknown as T);
  effect(() => { result.set(fn()); });
  return result;
}

function runEffect(eff: Effect): void {
  if (eff.disposed) return;
  cleanupDeps(eff);
  const prev = currentEffect;
  currentEffect = eff;
  try {
    eff.fn();
  } finally {
    currentEffect = prev;
  }
}

function schedule(eff: Effect): void {
  if (eff.queued || eff.disposed) return;
  eff.queued = true;
  queue.add(eff);
  if (!flushScheduled) {
    flushScheduled = true;
    queueMicrotask(flush);
  }
}

function flush(): void {
  flushScheduled = false;
  const effects = [...queue];
  queue.clear();
  for (const eff of effects) {
    eff.queued = false;
    runEffect(eff);
  }
}

function cleanupDeps(eff: Effect): void {
  for (const dep of eff.deps) dep.delete(eff);
  eff.deps.clear();
}
