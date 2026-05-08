type EffectFn = () => void;

interface Effect {
  fn: EffectFn;
  deps: Set<Set<Effect>>;
}

let currentEffect: Effect | null = null;

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
    // Snapshot to avoid mutation-during-iteration
    for (const sub of [...subscribers]) {
      runEffect(sub);
    }
  };

  return read;
}

export function effect(fn: EffectFn): () => void {
  const eff: Effect = { fn, deps: new Set() };
  runEffect(eff);
  return () => dispose(eff);
}

function runEffect(eff: Effect): void {
  cleanupDeps(eff);
  const prev = currentEffect;
  currentEffect = eff;
  try {
    eff.fn();
  } finally {
    currentEffect = prev;
  }
}

function cleanupDeps(eff: Effect): void {
  for (const dep of eff.deps) dep.delete(eff);
  eff.deps.clear();
}

function dispose(eff: Effect): void {
  cleanupDeps(eff);
}
