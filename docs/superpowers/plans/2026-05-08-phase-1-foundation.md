# Phase 1 — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate StudyFlow from a single 866-line `script.js` and 1709-line `styles.css` to a modular Vite + TypeScript codebase with a hand-rolled signal-based reactive core, achieving visual and functional parity with the existing app and deploying to GitHub Pages — without adding new features.

**Architecture:** Three runtime layers. (1) `src/reactive/` — ~80-LOC signal/computed/effect lib with microtask-batched updates. (2) `src/domain/` — pure TS modules (types, store-as-signals, dates, tasks, subjects, sessions stub, JSON IO, versioned migrations). (3) `src/ui/` — hash router, screens (home/today/subjects/calendar) and widgets (task-row, modal) using effects to subscribe to store signals. Persistence is one debounced effect writing the snapshot to localStorage. Migrations run at boot before signals are initialized.

**Tech Stack:** Vite 5, TypeScript 5 (strict), Vitest (unit) + Playwright (E2E, scaffolded only — full happy-path lands in Phase 2), ESLint with `@typescript-eslint`, vite-plugin-pwa (config only — manifest content lands in Phase 3), GitHub Actions for CI + Pages deploy.

**Reference spec:** `docs/superpowers/specs/2026-05-08-portfolio-evolution-design.md`

---

## Pre-flight: legacy data shape (read-only reference)

The current `script.js` writes localStorage key `studyflow_static_v1` with this shape:

```ts
// Legacy v0 (no schemaVersion)
interface LegacyState {
  subjects: Array<{ id: string; name: string; color: string; code: string }>;
  tasks: Array<{
    id: string;
    title: string;
    subjectId: string;
    due: string;          // "YYYY-MM-DD"
    priority: 'high' | 'medium' | 'low';
    est: number;          // minutes
    done: boolean;
    notes: string;
  }>;
}
```

Migration to v1 (per spec) drops `priority` and subject `code` (deliberate simplification — documented in commit). `due` becomes `dueAt: number` (local-midnight epoch ms). `done: true` becomes `completedAt: <migration-run-time>`. `est` becomes optional `estimatedMinutes`. `createdAt` is set to migration time for both. New empty arrays for `sessions`. Default `Settings` applied.

---

## File structure

This phase creates these files. Tasks below populate them in order.

```
.github/workflows/ci.yml                    # Task 2
package.json                                # Task 1
tsconfig.json                               # Task 1
vite.config.ts                              # Task 1
vitest.config.ts                            # Task 1
playwright.config.ts                        # Task 1
.eslintrc.cjs                               # Task 1
.gitignore                                  # Task 1
index.html                                  # Task 18 (rewrite)
src/main.ts                                 # Task 18
src/reactive/signal.ts                      # Tasks 3-5
src/reactive/signal.test.ts                 # Tasks 3-5
src/domain/types.ts                         # Task 6
src/domain/dates.ts                         # Task 7
src/domain/dates.test.ts                    # Task 7
src/domain/tasks.ts                         # Task 8
src/domain/tasks.test.ts                    # Task 8
src/domain/subjects.ts                      # Task 9
src/domain/sessions.ts                      # Task 10 (stub)
src/domain/migrations.ts                    # Task 11
src/domain/migrations.test.ts               # Task 11
src/domain/store.ts                         # Task 12
src/domain/io.ts                            # Task 13
src/domain/io.test.ts                       # Task 13
src/styles/tokens.css                       # Task 14
src/styles/base.css                         # Task 15
src/styles/layout.css                       # Task 15
src/styles/components.css                   # Task 15
src/styles/animations.css                   # Task 15
src/ui/router.ts                            # Task 16
src/ui/router.test.ts                       # Task 16
src/ui/toast.ts                             # Task 17
src/ui/widgets/modal.ts                     # Task 19
src/ui/widgets/task-row.ts                  # Task 20
src/ui/screens/home.ts                      # Task 21
src/ui/screens/today.ts                     # Task 22
src/ui/screens/subjects.ts                  # Task 23
src/ui/screens/calendar.ts                  # Task 24

DELETED at the end:
script.js, styles.css                       # Task 26
```

Old `script.js` and root `styles.css` remain in place until Task 26 so screens have a reference and the migration can be tested against real saved data.

---

## Task 1: Initialize Vite + TypeScript project

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `playwright.config.ts`, `.eslintrc.cjs`, `.gitignore`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "studyflow",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview --port 4173",
    "test": "vitest",
    "test:e2e": "playwright test",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src tests --ext .ts",
    "check": "npm run typecheck && npm run lint && npm run test -- --run"
  },
  "devDependencies": {
    "@playwright/test": "^1.47.0",
    "@types/node": "^22.5.0",
    "@typescript-eslint/eslint-plugin": "^8.0.0",
    "@typescript-eslint/parser": "^8.0.0",
    "eslint": "^9.0.0",
    "jsdom": "^25.0.0",
    "typescript": "^5.6.0",
    "vite": "^5.4.0",
    "vitest": "^2.0.0"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "useDefineForClassFields": true,
    "verbatimModuleSyntax": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] },
    "types": ["vitest/globals"]
  },
  "include": ["src/**/*", "tests/**/*", "vite.config.ts", "vitest.config.ts", "playwright.config.ts"]
}
```

- [ ] **Step 3: Create `vite.config.ts`**

```ts
import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  base: '/studyFlow/',
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
  build: {
    target: 'es2022',
    sourcemap: true,
  },
});
```

- [ ] **Step 4: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
  test: {
    globals: true,
    environment: 'node',
    environmentMatchGlobs: [['src/ui/**', 'jsdom']],
    include: ['src/**/*.test.ts', 'tests/unit/**/*.test.ts'],
  },
});
```

- [ ] **Step 5: Create `playwright.config.ts`**

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4173/studyFlow/',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: devices['Desktop Chrome'] }],
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4173/studyFlow/',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

- [ ] **Step 6: Create `.eslintrc.cjs`**

```js
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 2022, sourceType: 'module', project: ['./tsconfig.json'] },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended-type-checked',
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    '@typescript-eslint/consistent-type-imports': 'error',
    '@typescript-eslint/no-floating-promises': 'error',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
  ignorePatterns: ['dist', 'node_modules', '*.cjs', 'script.js'],
};
```

- [ ] **Step 7: Create `.gitignore`**

```
node_modules
dist
.vite
coverage
playwright-report
test-results
.DS_Store
*.log
```

- [ ] **Step 8: Install dependencies**

Run: `npm install`
Expected: `package-lock.json` is created; no errors.

- [ ] **Step 9: Verify the toolchain**

Run: `npm run typecheck`
Expected: PASS (no source files yet, so nothing to type-check; tsc exits 0).

Run: `npx playwright install chromium`
Expected: downloads Chromium for Playwright.

- [ ] **Step 10: Commit**

```bash
git add package.json package-lock.json tsconfig.json vite.config.ts vitest.config.ts playwright.config.ts .eslintrc.cjs .gitignore
git commit -m "chore: scaffold Vite + TypeScript + Vitest + Playwright + ESLint"
```

---

## Task 2: Add CI workflow

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create the workflow**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm test -- --run
      - run: npm run build
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add typecheck, lint, unit, build, and e2e workflow"
```

The first run will fail until source files exist — that's expected. We'll let it go red until Task 26.

---

## Task 3: Reactive core — `signal()` primitive

**Files:**
- Create: `src/reactive/signal.ts`
- Test: `src/reactive/signal.test.ts`

This task adds `signal()` and basic dependency tracking (no `computed`, no batching yet — those come in Tasks 4 and 5).

- [ ] **Step 1: Write the failing tests**

Create `src/reactive/signal.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import { signal, effect } from './signal';

describe('signal', () => {
  it('returns the initial value when read', () => {
    const count = signal(0);
    expect(count()).toBe(0);
  });

  it('updates the value via set()', () => {
    const count = signal(0);
    count.set(5);
    expect(count()).toBe(5);
  });

  it('runs an effect once on creation', () => {
    const fn = vi.fn();
    effect(fn);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('re-runs effects when a tracked signal changes', async () => {
    const count = signal(0);
    const fn = vi.fn(() => { count(); });
    effect(fn);
    expect(fn).toHaveBeenCalledTimes(1);
    count.set(1);
    await Promise.resolve();
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('does not re-run effects that did not read the signal', async () => {
    const a = signal(0);
    const b = signal(0);
    const fn = vi.fn(() => { a(); });
    effect(fn);
    b.set(1);
    await Promise.resolve();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('does not notify when set() writes the same value', async () => {
    const count = signal(0);
    const fn = vi.fn(() => { count(); });
    effect(fn);
    count.set(0);
    await Promise.resolve();
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run tests; confirm they fail**

Run: `npm test -- --run signal`
Expected: FAIL with "Cannot find module './signal'".

- [ ] **Step 3: Implement signal + effect (minimal, no batching yet)**

Create `src/reactive/signal.ts`:

```ts
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
```

- [ ] **Step 4: Run tests; confirm pass**

Run: `npm test -- --run signal`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/reactive/signal.ts src/reactive/signal.test.ts
git commit -m "feat(reactive): add signal() and effect() with dependency tracking"
```

---

## Task 4: Reactive core — microtask batching + `computed()`

**Files:**
- Modify: `src/reactive/signal.ts`
- Modify: `src/reactive/signal.test.ts`

- [ ] **Step 1: Add failing tests for batching and computed**

Append to `src/reactive/signal.test.ts`:

```ts
import { computed } from './signal';

describe('batching', () => {
  it('coalesces multiple writes in the same tick into one effect run', async () => {
    const a = signal(0);
    const fn = vi.fn(() => { a(); });
    effect(fn);
    a.set(1);
    a.set(2);
    a.set(3);
    expect(fn).toHaveBeenCalledTimes(1); // not yet flushed
    await Promise.resolve();
    expect(fn).toHaveBeenCalledTimes(2); // initial + one batched
  });
});

describe('computed', () => {
  it('returns the derived value', () => {
    const n = signal(2);
    const doubled = computed(() => n() * 2);
    expect(doubled()).toBe(4);
  });

  it('recomputes after a dependency changes', async () => {
    const n = signal(2);
    const doubled = computed(() => n() * 2);
    expect(doubled()).toBe(4);
    n.set(5);
    await Promise.resolve();
    expect(doubled()).toBe(10);
  });

  it('caches the result between dependency changes', () => {
    const n = signal(2);
    const compute = vi.fn(() => n() * 2);
    const doubled = computed(compute);
    doubled();
    doubled();
    doubled();
    expect(compute).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run tests; confirm batching and computed tests fail**

Run: `npm test -- --run signal`
Expected: 3 tests FAIL (batching expects only 2 calls, computed import missing).

- [ ] **Step 3: Replace `src/reactive/signal.ts` with the batched + computed version**

```ts
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
```

- [ ] **Step 4: Run tests; confirm pass**

Run: `npm test -- --run signal`
Expected: PASS (9 tests).

- [ ] **Step 5: Commit**

```bash
git add src/reactive/signal.ts src/reactive/signal.test.ts
git commit -m "feat(reactive): add microtask batching and computed()"
```

---

## Task 5: Reactive core — dispose, no-leak, nested effects

**Files:**
- Modify: `src/reactive/signal.test.ts`

The current implementation already supports dispose (via the returned function in `effect()`). This task adds tests proving the no-leak property and nested effect behavior.

- [ ] **Step 1: Add tests**

Append to `src/reactive/signal.test.ts`:

```ts
describe('dispose', () => {
  it('stops re-running after dispose', async () => {
    const a = signal(0);
    const fn = vi.fn(() => { a(); });
    const stop = effect(fn);
    stop();
    a.set(1);
    await Promise.resolve();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('removes effect from signal subscribers (no leak)', async () => {
    const a = signal(0);
    let calls = 0;
    const stop = effect(() => { a(); calls++; });
    stop();
    for (let i = 0; i < 10; i++) a.set(i + 1);
    await Promise.resolve();
    expect(calls).toBe(1);
  });
});

describe('nested effects', () => {
  it('inner effect tracks its own dependencies independently', async () => {
    const a = signal(0);
    const b = signal(0);
    const outerFn = vi.fn(() => {
      a();
      effect(() => { b(); });
    });
    effect(outerFn);
    expect(outerFn).toHaveBeenCalledTimes(1);
    b.set(1);
    await Promise.resolve();
    // Outer should NOT re-run when only b changes
    expect(outerFn).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run tests**

Run: `npm test -- --run signal`
Expected: PASS (12 tests). If nested-effects test fails, that signals a real bug — see fix in Step 3.

- [ ] **Step 3: (If needed) restore previous effect after inner runs**

The `runEffect` already saves/restores `currentEffect` via `prev`. The test should pass without changes. If it doesn't, double-check that the implementation matches Task 4 step 3 verbatim.

- [ ] **Step 4: Commit**

```bash
git add src/reactive/signal.test.ts
git commit -m "test(reactive): cover dispose no-leak and nested effects"
```

---

## Task 6: Domain types

**Files:**
- Create: `src/domain/types.ts`

- [ ] **Step 1: Write the file**

```ts
export type ID = string;

export interface Subject {
  id: ID;
  name: string;
  color: string;       // hex like '#E34432'
  createdAt: number;
}

export interface Task {
  id: ID;
  subjectId: ID | null;
  title: string;
  notes?: string;
  dueAt: number | null;        // local-midnight epoch ms
  completedAt: number | null;
  estimatedMinutes?: number;
  createdAt: number;
}

export interface Session {
  id: ID;
  taskId: ID | null;
  subjectId: ID | null;
  startedAt: number;
  endedAt: number;
  durationMs: number;
  kind: 'work' | 'short-break' | 'long-break';
  completed: boolean;
}

export type Theme = 'system' | 'light' | 'dark';
export type ReducedMotionPref = 'system' | 'on' | 'off';
export type WeekStart = 0 | 1;

export interface Settings {
  theme: Theme;
  pomodoro: {
    workMin: number;
    shortBreakMin: number;
    longBreakMin: number;
    longEvery: number;
  };
  reducedMotion: ReducedMotionPref;
  weekStartsOn: WeekStart;
}

export interface PersistedState {
  schemaVersion: number;
  subjects: Subject[];
  tasks: Task[];
  sessions: Session[];
  settings: Settings;
}

export const CURRENT_SCHEMA_VERSION = 1;

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  pomodoro: { workMin: 25, shortBreakMin: 5, longBreakMin: 15, longEvery: 4 },
  reducedMotion: 'system',
  weekStartsOn: 1,
};

export const SUBJECT_PALETTE = [
  '#E34432', '#497D7E', '#0F66AE', '#B05A8E',
  '#4C7A45', '#C77A2C', '#6B5BA8', '#D14F70',
] as const;
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/domain/types.ts
git commit -m "feat(domain): add Task, Subject, Session, Settings types"
```

---

## Task 7: Date helpers (pure)

**Files:**
- Create: `src/domain/dates.ts`
- Test: `src/domain/dates.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/domain/dates.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { startOfDay, addDays, isOverdue, startOfWeek, daysBetween, parseISODate } from './dates';

describe('startOfDay', () => {
  it('returns local midnight for a given timestamp', () => {
    const noon = new Date(2026, 4, 8, 12, 30).getTime(); // local
    const midnight = new Date(2026, 4, 8, 0, 0, 0, 0).getTime();
    expect(startOfDay(noon)).toBe(midnight);
  });
});

describe('addDays', () => {
  it('handles DST forward and back without drifting', () => {
    // Pick a known DST transition: in many tz, March 9 2026 spring forward.
    // We assert the day part rather than exact hours.
    const start = new Date(2026, 2, 7, 12, 0).getTime();
    const plusTwo = addDays(start, 2);
    const d = new Date(plusTwo);
    expect(d.getDate()).toBe(9);
    expect(d.getMonth()).toBe(2);
  });
});

describe('isOverdue', () => {
  it('returns false when due is later today', () => {
    const now = new Date(2026, 4, 8, 9, 0).getTime();
    const due = new Date(2026, 4, 8, 0, 0).getTime();
    expect(isOverdue(due, now)).toBe(false);
  });

  it('returns true when due was a previous day', () => {
    const now = new Date(2026, 4, 8, 9, 0).getTime();
    const due = new Date(2026, 4, 7, 0, 0).getTime();
    expect(isOverdue(due, now)).toBe(true);
  });

  it('returns false for null due', () => {
    expect(isOverdue(null, Date.now())).toBe(false);
  });
});

describe('startOfWeek', () => {
  it('Monday-week treats Monday as the first day', () => {
    const wed = new Date(2026, 4, 6).getTime(); // Wed May 6 2026
    const mon = new Date(2026, 4, 4).getTime(); // Mon May 4 2026
    expect(startOfWeek(wed, 1)).toBe(mon);
  });

  it('Sunday-week treats Sunday as the first day', () => {
    const wed = new Date(2026, 4, 6).getTime();
    const sun = new Date(2026, 4, 3).getTime();
    expect(startOfWeek(wed, 0)).toBe(sun);
  });
});

describe('parseISODate', () => {
  it('parses YYYY-MM-DD as local midnight', () => {
    const t = parseISODate('2026-05-08');
    const d = new Date(t);
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(4);
    expect(d.getDate()).toBe(8);
    expect(d.getHours()).toBe(0);
  });
});

describe('daysBetween', () => {
  it('returns the number of whole days from a to b', () => {
    const a = new Date(2026, 4, 8).getTime();
    const b = new Date(2026, 4, 11).getTime();
    expect(daysBetween(a, b)).toBe(3);
  });
});
```

- [ ] **Step 2: Run tests; confirm fail**

Run: `npm test -- --run dates`
Expected: FAIL ("Cannot find module './dates'").

- [ ] **Step 3: Implement `src/domain/dates.ts`**

```ts
import type { WeekStart } from './types';

export function startOfDay(t: number): number {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function addDays(t: number, n: number): number {
  const d = new Date(t);
  d.setDate(d.getDate() + n);
  return d.getTime();
}

export function isOverdue(dueAt: number | null, now: number = Date.now()): boolean {
  if (dueAt === null) return false;
  return startOfDay(dueAt) < startOfDay(now);
}

export function startOfWeek(t: number, weekStartsOn: WeekStart): number {
  const d = new Date(startOfDay(t));
  const day = d.getDay(); // 0 = Sun
  const diff = (day - weekStartsOn + 7) % 7;
  d.setDate(d.getDate() - diff);
  return d.getTime();
}

export function daysBetween(a: number, b: number): number {
  const start = startOfDay(a);
  const end = startOfDay(b);
  return Math.round((end - start) / 86_400_000);
}

export function parseISODate(iso: string): number {
  // 'YYYY-MM-DD' parsed as local midnight (NOT UTC).
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
  return new Date(y, m - 1, d).getTime();
}

export function toISODate(t: number): string {
  const d = new Date(t);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
```

- [ ] **Step 4: Run tests; confirm pass**

Run: `npm test -- --run dates`
Expected: PASS (~7 tests).

- [ ] **Step 5: Commit**

```bash
git add src/domain/dates.ts src/domain/dates.test.ts
git commit -m "feat(domain): add date helpers with DST and week-start handling"
```

---

## Task 8: Task filters and operations (pure)

**Files:**
- Create: `src/domain/tasks.ts`
- Test: `src/domain/tasks.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/domain/tasks.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import type { Task } from './types';
import { filterTasks, completeTask, uncompleteTask } from './tasks';

const day = (offset: number): number => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return d.getTime();
};

const t = (overrides: Partial<Task>): Task => ({
  id: Math.random().toString(),
  subjectId: 's1',
  title: 'x',
  dueAt: day(0),
  completedAt: null,
  createdAt: day(-30),
  ...overrides,
});

describe('filterTasks', () => {
  const tasks: Task[] = [
    t({ id: 'a', dueAt: day(0) }),
    t({ id: 'b', dueAt: day(1) }),
    t({ id: 'c', dueAt: day(-1) }),
    t({ id: 'd', dueAt: day(0), completedAt: day(0) }),
    t({ id: 'e', subjectId: 's2', dueAt: day(0) }),
    t({ id: 'f', dueAt: null }),
  ];

  it('today returns tasks due today, including completed', () => {
    const ids = filterTasks(tasks, { type: 'today' }).map(x => x.id);
    expect(ids.sort()).toEqual(['a', 'd', 'e']);
  });

  it('next7 returns uncompleted tasks due in [today, today+7)', () => {
    const ids = filterTasks(tasks, { type: 'next7' }).map(x => x.id);
    expect(ids.sort()).toEqual(['a', 'b', 'e']);
  });

  it('overdue returns uncompleted tasks past due', () => {
    const ids = filterTasks(tasks, { type: 'overdue' }).map(x => x.id);
    expect(ids).toEqual(['c']);
  });

  it('all returns uncompleted tasks regardless of due', () => {
    const ids = filterTasks(tasks, { type: 'all' }).map(x => x.id);
    expect(ids.sort()).toEqual(['a', 'b', 'c', 'e', 'f']);
  });

  it('subject returns tasks for the given subject', () => {
    const ids = filterTasks(tasks, { type: 'subject', subjectId: 's2' }).map(x => x.id);
    expect(ids).toEqual(['e']);
  });
});

describe('completeTask / uncompleteTask', () => {
  it('completeTask sets completedAt to the given time', () => {
    const task = t({ completedAt: null });
    const updated = completeTask(task, 1234);
    expect(updated.completedAt).toBe(1234);
  });

  it('completeTask is idempotent on already-completed tasks', () => {
    const task = t({ completedAt: 100 });
    const updated = completeTask(task, 1234);
    expect(updated.completedAt).toBe(100);
  });

  it('uncompleteTask clears completedAt', () => {
    const task = t({ completedAt: 100 });
    const updated = uncompleteTask(task);
    expect(updated.completedAt).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests; confirm fail**

Run: `npm test -- --run tasks`
Expected: FAIL.

- [ ] **Step 3: Implement `src/domain/tasks.ts`**

```ts
import type { Task, ID } from './types';
import { startOfDay, addDays, isOverdue } from './dates';

export type TaskFilter =
  | { type: 'today' }
  | { type: 'next7' }
  | { type: 'overdue' }
  | { type: 'all' }
  | { type: 'subject'; subjectId: ID };

export function filterTasks(tasks: Task[], filter: TaskFilter, now: number = Date.now()): Task[] {
  const today = startOfDay(now);
  const weekEnd = addDays(today, 7);

  switch (filter.type) {
    case 'today':
      return tasks.filter(t => t.dueAt !== null && startOfDay(t.dueAt) === today);
    case 'next7':
      return tasks.filter(t =>
        t.completedAt === null &&
        t.dueAt !== null &&
        startOfDay(t.dueAt) >= today &&
        startOfDay(t.dueAt) < weekEnd,
      );
    case 'overdue':
      return tasks.filter(t => t.completedAt === null && isOverdue(t.dueAt, now));
    case 'all':
      return tasks.filter(t => t.completedAt === null);
    case 'subject':
      return tasks.filter(t => t.subjectId === filter.subjectId);
  }
}

export function completeTask(task: Task, now: number = Date.now()): Task {
  if (task.completedAt !== null) return task;
  return { ...task, completedAt: now };
}

export function uncompleteTask(task: Task): Task {
  if (task.completedAt === null) return task;
  return { ...task, completedAt: null };
}
```

- [ ] **Step 4: Run tests; confirm pass**

Run: `npm test -- --run tasks`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/tasks.ts src/domain/tasks.test.ts
git commit -m "feat(domain): add task filters and complete/uncomplete operations"
```

---

## Task 9: Subjects helper

**Files:**
- Create: `src/domain/subjects.ts`

Subjects are simple enough that we don't need a separate test file; they get exercised in screen tests indirectly. We add a single utility.

- [ ] **Step 1: Write the file**

```ts
import type { Subject, ID } from './types';

export function subjectsById(subjects: Subject[]): Record<ID, Subject> {
  const out: Record<ID, Subject> = {};
  for (const s of subjects) out[s.id] = s;
  return out;
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/domain/subjects.ts
git commit -m "feat(domain): add subjectsById helper"
```

---

## Task 10: Sessions stub

**Files:**
- Create: `src/domain/sessions.ts`

Phase 2 builds the Pomodoro logic. Phase 1 just exports an empty namespace so the store can hold sessions.

- [ ] **Step 1: Write the file**

```ts
import type { Session } from './types';

export function totalFocusMs(sessions: Session[]): number {
  return sessions
    .filter(s => s.kind === 'work' && s.completed)
    .reduce((sum, s) => sum + s.durationMs, 0);
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/domain/sessions.ts
git commit -m "feat(domain): add sessions module with totalFocusMs (stub for phase 2)"
```

---

## Task 11: Versioned migrations from legacy storage

**Files:**
- Create: `src/domain/migrations.ts`
- Test: `src/domain/migrations.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/domain/migrations.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { loadAndMigrate, NEW_KEY, LEGACY_KEY } from './migrations';
import { CURRENT_SCHEMA_VERSION, DEFAULT_SETTINGS } from './types';

describe('loadAndMigrate', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns defaults when no data exists', () => {
    const state = loadAndMigrate(() => 1_700_000_000_000);
    expect(state.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(state.subjects).toEqual([]);
    expect(state.tasks).toEqual([]);
    expect(state.sessions).toEqual([]);
    expect(state.settings).toEqual(DEFAULT_SETTINGS);
  });

  it('migrates legacy v0 data to v1', () => {
    const legacy = {
      subjects: [
        { id: 's1', name: 'Calc II', color: '#E34432', code: 'MATH 221' },
      ],
      tasks: [
        { id: 't1', title: 'Problem set', subjectId: 's1', due: '2026-05-08',
          priority: 'high', est: 60, done: false, notes: 'Read first' },
        { id: 't2', title: 'Read Ch 12', subjectId: 's1', due: '2026-05-09',
          priority: 'medium', est: 45, done: true, notes: '' },
      ],
    };
    localStorage.setItem(LEGACY_KEY, JSON.stringify(legacy));

    const NOW = 1_700_000_000_000;
    const state = loadAndMigrate(() => NOW);

    expect(state.schemaVersion).toBe(1);
    expect(state.subjects).toHaveLength(1);
    expect(state.subjects[0]).toMatchObject({ id: 's1', name: 'Calc II', color: '#E34432' });
    expect(state.tasks).toHaveLength(2);
    expect(state.tasks[0]).toMatchObject({
      id: 't1', title: 'Problem set', subjectId: 's1', notes: 'Read first',
      completedAt: null, estimatedMinutes: 60,
    });
    expect(state.tasks[0].dueAt).toBe(new Date(2026, 4, 8).getTime());
    expect(state.tasks[1].completedAt).toBe(NOW);
  });

  it('reads v1 data unchanged', () => {
    const v1 = {
      schemaVersion: 1,
      subjects: [{ id: 's1', name: 'A', color: '#000', createdAt: 1 }],
      tasks: [],
      sessions: [],
      settings: DEFAULT_SETTINGS,
    };
    localStorage.setItem(NEW_KEY, JSON.stringify(v1));

    const state = loadAndMigrate(() => 1_700_000_000_000);
    expect(state).toEqual(v1);
  });

  it('backs up corrupted data and returns defaults', () => {
    localStorage.setItem(NEW_KEY, '{not json');
    const state = loadAndMigrate(() => 1_700_000_000_000);
    expect(state.tasks).toEqual([]);
    const backupKey = Object.keys(localStorage).find(k => k.startsWith('studyflow:backup-'));
    expect(backupKey).toBeDefined();
  });
});
```

- [ ] **Step 2: Configure vitest to use jsdom for migration test**

Modify `vitest.config.ts` — add `src/domain/migrations.test.ts` to the jsdom glob:

```ts
environmentMatchGlobs: [
  ['src/ui/**', 'jsdom'],
  ['src/domain/migrations.test.ts', 'jsdom'],
],
```

- [ ] **Step 3: Run tests; confirm fail**

Run: `npm test -- --run migrations`
Expected: FAIL ("Cannot find module './migrations'").

- [ ] **Step 4: Implement `src/domain/migrations.ts`**

```ts
import {
  CURRENT_SCHEMA_VERSION,
  DEFAULT_SETTINGS,
  type PersistedState,
  type Subject,
  type Task,
} from './types';
import { parseISODate } from './dates';

export const LEGACY_KEY = 'studyflow_static_v1';
export const NEW_KEY = 'studyflow:v1';

type Now = () => number;

export function loadAndMigrate(now: Now = () => Date.now()): PersistedState {
  // Try new key first.
  const rawNew = localStorage.getItem(NEW_KEY);
  if (rawNew !== null) {
    try {
      const parsed = JSON.parse(rawNew) as unknown;
      if (isValidState(parsed)) return parsed;
      backup(NEW_KEY, rawNew, now());
    } catch {
      backup(NEW_KEY, rawNew, now());
    }
  }

  // Fall back to legacy.
  const rawLegacy = localStorage.getItem(LEGACY_KEY);
  if (rawLegacy !== null) {
    try {
      const parsed = JSON.parse(rawLegacy) as unknown;
      const migrated = migrateLegacy(parsed, now());
      localStorage.setItem(NEW_KEY, JSON.stringify(migrated));
      return migrated;
    } catch {
      backup(LEGACY_KEY, rawLegacy, now());
    }
  }

  return defaults();
}

function defaults(): PersistedState {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    subjects: [],
    tasks: [],
    sessions: [],
    settings: DEFAULT_SETTINGS,
  };
}

function migrateLegacy(raw: unknown, now: number): PersistedState {
  if (!isObject(raw)) return defaults();
  const legacySubjects = Array.isArray(raw.subjects) ? raw.subjects : [];
  const legacyTasks = Array.isArray(raw.tasks) ? raw.tasks : [];

  const subjects: Subject[] = legacySubjects
    .filter(isObject)
    .map(s => ({
      id: String(s.id),
      name: String(s.name ?? ''),
      color: typeof s.color === 'string' ? s.color : '#888888',
      createdAt: now,
    }));

  const tasks: Task[] = legacyTasks
    .filter(isObject)
    .map(t => {
      const dueIso = typeof t.due === 'string' ? t.due : null;
      const dueAt = dueIso ? parseISODate(dueIso) : null;
      const done = t.done === true;
      const est = typeof t.est === 'number' ? t.est : undefined;
      const notes = typeof t.notes === 'string' && t.notes.length > 0 ? t.notes : undefined;
      return {
        id: String(t.id),
        subjectId: typeof t.subjectId === 'string' ? t.subjectId : null,
        title: String(t.title ?? ''),
        ...(notes !== undefined ? { notes } : {}),
        dueAt,
        completedAt: done ? now : null,
        ...(est !== undefined ? { estimatedMinutes: est } : {}),
        createdAt: now,
      };
    });

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    subjects,
    tasks,
    sessions: [],
    settings: DEFAULT_SETTINGS,
  };
}

function isValidState(x: unknown): x is PersistedState {
  if (!isObject(x)) return false;
  if (x.schemaVersion !== CURRENT_SCHEMA_VERSION) return false;
  return Array.isArray(x.subjects) && Array.isArray(x.tasks)
    && Array.isArray(x.sessions) && isObject(x.settings);
}

function isObject(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

function backup(key: string, raw: string, now: number): void {
  const backupKey = `studyflow:backup-${now}`;
  try {
    localStorage.setItem(backupKey, raw);
  } catch {
    // Quota exceeded — proceed; user data is lost but app still works.
  }
  localStorage.removeItem(key);
}
```

- [ ] **Step 5: Run tests; confirm pass**

Run: `npm test -- --run migrations`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add src/domain/migrations.ts src/domain/migrations.test.ts vitest.config.ts
git commit -m "feat(domain): add versioned migrations from legacy localStorage"
```

---

## Task 12: Store (signals + debounced persistence)

**Files:**
- Create: `src/domain/store.ts`

- [ ] **Step 1: Write the file**

```ts
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
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/domain/store.ts
git commit -m "feat(domain): add signal-based store with debounced persistence"
```

---

## Task 13: JSON import/export

**Files:**
- Create: `src/domain/io.ts`
- Test: `src/domain/io.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/domain/io.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { exportJSON, parseImport } from './io';
import { CURRENT_SCHEMA_VERSION, DEFAULT_SETTINGS } from './types';

describe('exportJSON / parseImport', () => {
  const state = {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    subjects: [{ id: 's1', name: 'A', color: '#000', createdAt: 1 }],
    tasks: [],
    sessions: [],
    settings: DEFAULT_SETTINGS,
  };

  it('round-trips through JSON', () => {
    const json = exportJSON(state);
    const result = parseImport(json);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.state).toEqual(state);
  });

  it('rejects malformed JSON', () => {
    const result = parseImport('{not json');
    expect(result.ok).toBe(false);
  });

  it('rejects valid JSON with wrong shape', () => {
    const result = parseImport('{"foo":1}');
    expect(result.ok).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests; confirm fail**

Run: `npm test -- --run io`
Expected: FAIL.

- [ ] **Step 3: Implement `src/domain/io.ts`**

```ts
import type { PersistedState } from './types';
import { CURRENT_SCHEMA_VERSION } from './types';

export type ImportResult =
  | { ok: true; state: PersistedState }
  | { ok: false; reason: string };

export function exportJSON(state: PersistedState): string {
  return JSON.stringify(state, null, 2);
}

export function parseImport(json: string): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { ok: false, reason: 'Invalid JSON' };
  }
  if (!isValid(parsed)) return { ok: false, reason: 'Unrecognized data shape' };
  return { ok: true, state: parsed };
}

function isValid(x: unknown): x is PersistedState {
  if (typeof x !== 'object' || x === null || Array.isArray(x)) return false;
  const o = x as Record<string, unknown>;
  return o.schemaVersion === CURRENT_SCHEMA_VERSION
    && Array.isArray(o.subjects)
    && Array.isArray(o.tasks)
    && Array.isArray(o.sessions)
    && typeof o.settings === 'object' && o.settings !== null;
}
```

- [ ] **Step 4: Run tests; confirm pass**

Run: `npm test -- --run io`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/io.ts src/domain/io.test.ts
git commit -m "feat(domain): add JSON export/import with shape validation"
```

---

## Task 14: Design tokens

**Files:**
- Create: `src/styles/tokens.css`

The existing `styles.css` (root) defines design tokens at the top. This task extracts them into a single tokens file and adds a dark-mode override block (no toggle UI yet — Phase 2).

- [ ] **Step 1: Read existing tokens**

Run: `head -120 styles.css`

Identify the `:root { ... }` block holding `--bg`, `--ink`, `--accent`, subject colors `--subj-1` … `--subj-8`, etc.

- [ ] **Step 2: Create `src/styles/tokens.css`**

Copy the existing `:root { ... }` block verbatim from `styles.css` into the new file, then append a dark-mode override that re-declares the same custom-property names with dark-appropriate values. Keep the subject palette identical across themes — only background/ink/surface/border tokens change.

```css
/* Tokens — base (light) */
:root {
  /* COPY EVERYTHING FROM the :root block in the legacy styles.css here, verbatim. */
}

/* Dark theme overrides */
[data-theme="dark"] {
  --bg: #1a1a1a;
  --ink: #f5f1e6;
  --surface: #242424;
  --surface-soft: #2c2c2c;
  --border: #3a3a3a;
  --muted: #a8a8a8;
  /* Keep --accent and --subj-* identical to light. */
}
```

The dark values above are reasonable defaults; tweak after Task 25 visual diff if needed.

- [ ] **Step 3: Commit**

```bash
git add src/styles/tokens.css
git commit -m "style: extract design tokens with dark-mode variables"
```

---

## Task 15: Split remaining CSS into 4 files

**Files:**
- Create: `src/styles/base.css`, `src/styles/layout.css`, `src/styles/components.css`, `src/styles/animations.css`

- [ ] **Step 1: Split the legacy `styles.css` by responsibility**

Read the existing `styles.css`. Cut blocks into the new files using these rules:

- `base.css` — element resets, typography defaults, body, html, links, headings, focus rings.
- `layout.css` — `.app-shell`, header, navigation bar, page containers, grid scaffolds.
- `components.css` — buttons, cards, task rows, progress bars, modal, forms, badges, sidebar, calendar grid, subject cards. (This is the bulk.)
- `animations.css` — `@keyframes`, animated landing classes, transitions on tokens.

Keep all selectors identical. Do **not** rename classes or restructure HTML expectations.

- [ ] **Step 2: Verify nothing was lost**

Run: `wc -l styles.css src/styles/*.css`
Expected: total lines of all `src/styles/*.css` files (including `tokens.css` from Task 14) ≈ lines of `styles.css` ± a small delta from added comments.

- [ ] **Step 3: Commit**

```bash
git add src/styles/base.css src/styles/layout.css src/styles/components.css src/styles/animations.css
git commit -m "style: split styles.css into base/layout/components/animations"
```

---

## Task 16: Hash router

**Files:**
- Create: `src/ui/router.ts`
- Test: `src/ui/router.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/ui/router.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { parseRoute, type Route } from './router';

describe('parseRoute', () => {
  beforeEach(() => {
    history.replaceState(null, '', '/');
  });

  const cases: Array<[string, Route]> = [
    ['', { name: 'home' }],
    ['#', { name: 'home' }],
    ['#/', { name: 'home' }],
    ['#/today', { name: 'today' }],
    ['#/subjects', { name: 'subjects' }],
    ['#/calendar', { name: 'calendar' }],
    ['#/garbage', { name: 'home' }],
  ];

  for (const [hash, expected] of cases) {
    it(`parses '${hash}' → ${expected.name}`, () => {
      expect(parseRoute(hash)).toEqual(expected);
    });
  }
});
```

- [ ] **Step 2: Run tests; confirm fail**

Run: `npm test -- --run router`
Expected: FAIL.

- [ ] **Step 3: Implement `src/ui/router.ts`**

```ts
import { signal, type Signal } from '@/reactive/signal';

export type RouteName = 'home' | 'today' | 'subjects' | 'calendar';

export interface Route {
  name: RouteName;
}

const VALID = new Set<RouteName>(['home', 'today', 'subjects', 'calendar']);

export function parseRoute(hash: string): Route {
  const cleaned = hash.replace(/^#\/?/, '').trim();
  if (cleaned === '') return { name: 'home' };
  if (VALID.has(cleaned as RouteName)) return { name: cleaned as RouteName };
  return { name: 'home' };
}

export interface Router {
  current: Signal<Route>;
  navigate(name: RouteName): void;
}

export function createRouter(): Router {
  const current = signal<Route>(parseRoute(location.hash));
  window.addEventListener('hashchange', () => {
    current.set(parseRoute(location.hash));
  });
  return {
    current,
    navigate: (name: RouteName) => {
      location.hash = name === 'home' ? '/' : `/${name}`;
    },
  };
}
```

- [ ] **Step 4: Run tests; confirm pass**

Run: `npm test -- --run router`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/ui/router.ts src/ui/router.test.ts
git commit -m "feat(ui): add hash router with route signal"
```

---

## Task 17: Toast / ARIA-live announcer

**Files:**
- Create: `src/ui/toast.ts`

- [ ] **Step 1: Write the file**

```ts
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
```

- [ ] **Step 2: Add minimal styles to `src/styles/components.css`**

Append:

```css
.toast-region {
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  z-index: 1000;
  pointer-events: none;
}
.toast {
  background: var(--surface);
  color: var(--ink);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  box-shadow: 0 4px 16px rgb(0 0 0 / 0.1);
  pointer-events: auto;
  animation: toast-in 0.2s ease;
}
.toast--error { border-color: var(--accent); }
@keyframes toast-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
```

- [ ] **Step 3: Commit**

```bash
git add src/ui/toast.ts src/styles/components.css
git commit -m "feat(ui): add ARIA-live toast announcer"
```

---

## Task 18: Bootstrap — `index.html` and `main.ts`

**Files:**
- Replace: `index.html`
- Create: `src/main.ts`

- [ ] **Step 1: Replace `index.html`**

Open the legacy `index.html` and copy any `<header>`, `<main id="app">`, `<div id="modal-root">` mount markup. Replace the file with:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#f3eddf" />
    <title>StudyFlow</title>
    <script>
      // Apply theme before CSS loads to avoid FOUC.
      (function () {
        try {
          var raw = localStorage.getItem('studyflow:v1');
          var theme = 'system';
          if (raw) { var s = JSON.parse(raw); if (s && s.settings && s.settings.theme) theme = s.settings.theme; }
          var resolved = theme;
          if (theme === 'system') {
            resolved = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
          }
          document.documentElement.setAttribute('data-theme', resolved);
        } catch (e) { /* ignore */ }
      })();
    </script>
    <link rel="stylesheet" href="/src/styles/tokens.css" />
    <link rel="stylesheet" href="/src/styles/base.css" />
    <link rel="stylesheet" href="/src/styles/layout.css" />
    <link rel="stylesheet" href="/src/styles/components.css" />
    <link rel="stylesheet" href="/src/styles/animations.css" />
  </head>
  <body>
    <!-- COPY the <header> and shell markup from the legacy index.html here verbatim,
         keeping ids: app-shell, primary-nav, app, modal-root. -->
    <main id="app"></main>
    <div id="modal-root"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

(Vite handles the CSS imports — the `<link>` tags above are correct for dev; in production it inlines/hashes them.)

- [ ] **Step 2: Create `src/main.ts`**

```ts
import { createStore } from '@/domain/store';
import { createRouter } from '@/ui/router';
import { effect } from '@/reactive/signal';
import { renderHome } from '@/ui/screens/home';
import { renderToday } from '@/ui/screens/today';
import { renderSubjects } from '@/ui/screens/subjects';
import { renderCalendar } from '@/ui/screens/calendar';
import type { Route } from '@/ui/router';
import type { Store } from '@/domain/store';

const store = createStore();
const router = createRouter();
const root = document.getElementById('app');
if (!root) throw new Error('#app mount point missing');

let dispose: (() => void) | null = null;

effect(() => {
  const route = router.current();
  if (dispose) { dispose(); dispose = null; }
  dispose = mountRoute(route, store, root);
});

function mountRoute(route: Route, store: Store, host: HTMLElement): () => void {
  switch (route.name) {
    case 'home': return renderHome(host, store, router);
    case 'today': return renderToday(host, store, router);
    case 'subjects': return renderSubjects(host, store, router);
    case 'calendar': return renderCalendar(host, store, router);
  }
}
```

- [ ] **Step 3: Stub the screen modules so imports resolve**

Create each of these with a placeholder export — full implementation follows in Tasks 21-24:

`src/ui/screens/home.ts`:
```ts
import type { Store } from '@/domain/store';
import type { Router } from '@/ui/router';
export function renderHome(host: HTMLElement, _store: Store, _router: Router): () => void {
  host.innerHTML = '<p>Home (placeholder)</p>';
  return () => { host.innerHTML = ''; };
}
```

Repeat for `today.ts`, `subjects.ts`, `calendar.ts` with their respective render function names. (`renderToday`, `renderSubjects`, `renderCalendar`.)

- [ ] **Step 4: Run dev server and confirm it boots**

Run: `npm run dev`
Open `http://localhost:5173/studyFlow/`
Expected: shell renders; home placeholder visible; navigating via `#/today` shows the today placeholder.

- [ ] **Step 5: Commit**

```bash
git add index.html src/main.ts src/ui/screens/*.ts
git commit -m "feat(ui): bootstrap router with placeholder screens"
```

---

## Task 19: Modal widget

**Files:**
- Create: `src/ui/widgets/modal.ts`

- [ ] **Step 1: Write the file**

```ts
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
```

- [ ] **Step 2: Commit**

```bash
git add src/ui/widgets/modal.ts
git commit -m "feat(ui): add modal widget with esc/click-outside dismiss"
```

---

## Task 20: Task row widget

**Files:**
- Create: `src/ui/widgets/task-row.ts`

This widget produces a single task row DOM node and binds checkbox / delete handlers. It's used by the Today, Subjects, and Calendar screens.

- [ ] **Step 1: Write the file**

```ts
import type { Subject, Task } from '@/domain/types';
import { completeTask, uncompleteTask } from '@/domain/tasks';

export interface TaskRowDeps {
  getSubject: (id: string | null) => Subject | undefined;
  onToggle: (next: Task) => void;
  onDelete: (id: string) => void;
}

export function renderTaskRow(task: Task, deps: TaskRowDeps): HTMLElement {
  const row = document.createElement('div');
  row.className = 'task-row' + (task.completedAt !== null ? ' task-row--done' : '');
  row.dataset.taskId = task.id;

  const subject = deps.getSubject(task.subjectId);
  const subjectColor = subject?.color ?? '#888';

  row.innerHTML = `
    <input type="checkbox" class="task-row__check" aria-label="Toggle complete" ${task.completedAt !== null ? 'checked' : ''} />
    <span class="task-row__pin" style="background:${subjectColor}"></span>
    <div class="task-row__body">
      <div class="task-row__title">${escapeHtml(task.title)}</div>
      <div class="task-row__meta">
        ${subject ? `<span class="task-row__subject">${escapeHtml(subject.name)}</span>` : ''}
        ${task.estimatedMinutes ? `<span class="task-row__est">${task.estimatedMinutes} min</span>` : ''}
      </div>
    </div>
    <button class="task-row__delete" aria-label="Delete task">×</button>
  `;

  const check = row.querySelector<HTMLInputElement>('.task-row__check')!;
  check.addEventListener('change', () => {
    deps.onToggle(check.checked ? completeTask(task) : uncompleteTask(task));
  });
  row.querySelector<HTMLButtonElement>('.task-row__delete')!.addEventListener('click', () => {
    deps.onDelete(task.id);
  });

  return row;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[ch]!));
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/ui/widgets/task-row.ts
git commit -m "feat(ui): add task-row widget with toggle and delete"
```

---

## Task 21: Home screen

**Files:**
- Replace: `src/ui/screens/home.ts`

The Home screen mirrors the existing landing page: hero text, "Get started" button navigating to Today, three numbered steps. Reuse the legacy markup verbatim (preserving classes); only the wiring changes.

- [ ] **Step 1: Read legacy `renderHome` (or equivalent) in `script.js`**

Run: `grep -n "renderHome\|landing\|hero" script.js | head -20`
Identify the function that builds home-page HTML and copy its template strings.

- [ ] **Step 2: Implement `src/ui/screens/home.ts`**

```ts
import type { Store } from '@/domain/store';
import type { Router } from '@/ui/router';

export function renderHome(host: HTMLElement, _store: Store, router: Router): () => void {
  host.innerHTML = `
    <section class="landing">
      <!-- COPY the <section class="landing">…</section> markup verbatim from legacy script.js
           renderHome() / landing template. Keep classes and ids the same. -->
    </section>
  `;

  const startBtn = host.querySelector<HTMLButtonElement>('#landing-start');
  startBtn?.addEventListener('click', () => router.navigate('today'));

  return () => { host.innerHTML = ''; };
}
```

- [ ] **Step 3: Verify in dev server**

Run: `npm run dev`
Navigate to `http://localhost:5173/studyFlow/`
Expected: visual parity with the legacy app's home screen; "Get started" navigates to `#/today`.

- [ ] **Step 4: Commit**

```bash
git add src/ui/screens/home.ts
git commit -m "feat(ui): port home screen to module"
```

---

## Task 22: Today screen

**Files:**
- Replace: `src/ui/screens/today.ts`

The Today screen has the most logic: KPI strip, sidebar with filter buttons (today/next7/overdue/all + subjects), task list, "add task" button opening modal. Reuse the layout/markup from legacy `script.js` (`renderToday`, `renderSidebar`, `renderTaskList`).

- [ ] **Step 1: Implement `src/ui/screens/today.ts`**

```ts
import { effect, signal } from '@/reactive/signal';
import type { Store } from '@/domain/store';
import type { Router } from '@/ui/router';
import { filterTasks, type TaskFilter } from '@/domain/tasks';
import { isOverdue, startOfDay, addDays } from '@/domain/dates';
import { subjectsById } from '@/domain/subjects';
import { renderTaskRow } from '@/ui/widgets/task-row';
import { openTaskModal } from './today.modal';

export function renderToday(host: HTMLElement, store: Store, _router: Router): () => void {
  const filter = signal<TaskFilter>({ type: 'today' });

  host.innerHTML = `
    <section class="dashboard">
      <aside class="sidebar" id="sidebar"></aside>
      <div class="dashboard__main">
        <div class="kpis" id="kpis"></div>
        <div class="dashboard__header">
          <h2 id="dashboard-title"></h2>
          <button class="btn btn--primary" id="add-task">+ New task</button>
        </div>
        <div id="task-list"></div>
      </div>
    </section>
  `;

  host.querySelector<HTMLButtonElement>('#add-task')!.addEventListener('click', () => {
    openTaskModal({ store });
  });

  const stop1 = effect(() => renderSidebar(host, store, filter));
  const stop2 = effect(() => renderKpis(host, store));
  const stop3 = effect(() => renderList(host, store, filter()));

  return () => { stop1(); stop2(); stop3(); host.innerHTML = ''; };
}

function renderSidebar(host: HTMLElement, store: Store, filter: ReturnType<typeof signal<TaskFilter>>): void {
  const sidebar = host.querySelector<HTMLElement>('#sidebar');
  if (!sidebar) return;
  const tasks = store.tasks();
  const subjects = store.subjects();
  const today = startOfDay(Date.now());
  const next7End = addDays(today, 7);
  const counts = {
    today: tasks.filter(t => t.dueAt !== null && startOfDay(t.dueAt) === today && t.completedAt === null).length,
    next7: tasks.filter(t => t.dueAt !== null && startOfDay(t.dueAt) >= today && startOfDay(t.dueAt) < next7End && t.completedAt === null).length,
    overdue: tasks.filter(t => t.completedAt === null && isOverdue(t.dueAt)).length,
    all: tasks.filter(t => t.completedAt === null).length,
  };
  const current = filter();

  sidebar.innerHTML = `
    <nav class="sidebar__group" aria-label="Task filters">
      ${btn('today', "Today", counts.today, current)}
      ${btn('next7', 'Next 7 days', counts.next7, current)}
      ${btn('overdue', 'Overdue', counts.overdue, current)}
      ${btn('all', 'All tasks', counts.all, current)}
    </nav>
    <h3 class="sidebar__heading">Subjects</h3>
    <nav class="sidebar__group" aria-label="Subjects">
      ${subjects.map(s => `
        <button class="sidebar__item ${current.type === 'subject' && current.subjectId === s.id ? 'is-active' : ''}"
                data-subject-id="${s.id}">
          <span class="sidebar__pin" style="background:${s.color}"></span>${escapeHtml(s.name)}
        </button>
      `).join('')}
    </nav>
  `;
  sidebar.querySelectorAll<HTMLButtonElement>('button[data-filter]').forEach(b => {
    b.addEventListener('click', () => {
      const t = b.dataset.filter as 'today' | 'next7' | 'overdue' | 'all';
      filter.set({ type: t });
    });
  });
  sidebar.querySelectorAll<HTMLButtonElement>('button[data-subject-id]').forEach(b => {
    b.addEventListener('click', () => {
      filter.set({ type: 'subject', subjectId: b.dataset.subjectId! });
    });
  });
}

function btn(type: 'today' | 'next7' | 'overdue' | 'all', label: string, count: number, current: TaskFilter): string {
  const active = current.type === type ? 'is-active' : '';
  return `<button class="sidebar__item ${active}" data-filter="${type}">${label}<span class="sidebar__count">${count}</span></button>`;
}

function renderKpis(host: HTMLElement, store: Store): void {
  const el = host.querySelector<HTMLElement>('#kpis');
  if (!el) return;
  const tasks = store.tasks();
  const today = startOfDay(Date.now());
  const todayTasks = tasks.filter(t => t.dueAt !== null && startOfDay(t.dueAt) === today);
  const todayDone = todayTasks.filter(t => t.completedAt !== null).length;
  const next7End = addDays(today, 7);
  const weekTasks = tasks.filter(t => t.dueAt !== null && startOfDay(t.dueAt) >= today && startOfDay(t.dueAt) < next7End);
  const weekDone = weekTasks.filter(t => t.completedAt !== null).length;
  el.innerHTML = `
    <div class="kpi"><div class="kpi__label">Today's plan</div><div class="kpi__value">${todayDone} / ${todayTasks.length}</div></div>
    <div class="kpi"><div class="kpi__label">This week</div><div class="kpi__value">${weekDone} / ${weekTasks.length}</div></div>
  `;
}

function renderList(host: HTMLElement, store: Store, filter: TaskFilter): void {
  const list = host.querySelector<HTMLElement>('#task-list');
  const title = host.querySelector<HTMLElement>('#dashboard-title');
  if (!list || !title) return;
  const sb = subjectsById(store.subjects());
  const tasks = filterTasks(store.tasks(), filter);
  title.textContent = titleFor(filter, store);
  if (tasks.length === 0) {
    list.innerHTML = `<div class="empty-state">No tasks here. Press <kbd>+ New task</kbd> to add one.</div>`;
    return;
  }
  list.innerHTML = '';
  for (const task of tasks) {
    list.appendChild(renderTaskRow(task, {
      getSubject: id => (id ? sb[id] : undefined),
      onToggle: next => {
        store.tasks.set(store.tasks().map(t => t.id === next.id ? next : t));
      },
      onDelete: id => {
        store.tasks.set(store.tasks().filter(t => t.id !== id));
      },
    }));
  }
}

function titleFor(filter: TaskFilter, store: Store): string {
  switch (filter.type) {
    case 'today': return 'Today';
    case 'next7': return 'Next 7 days';
    case 'overdue': return 'Overdue';
    case 'all': return 'All tasks';
    case 'subject': {
      const s = store.subjects().find(x => x.id === filter.subjectId);
      return s?.name ?? 'Subject';
    }
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]!));
}
```

- [ ] **Step 2: Implement the task modal helper**

Create `src/ui/screens/today.modal.ts`:

```ts
import { openModal } from '@/ui/widgets/modal';
import type { Store } from '@/domain/store';
import type { Task } from '@/domain/types';
import { parseISODate, toISODate, startOfDay } from '@/domain/dates';

export function openTaskModal(opts: { store: Store }): void {
  const { store } = opts;
  const subjects = store.subjects();
  const node = document.createElement('form');
  node.className = 'task-form';
  node.innerHTML = `
    <h2>New task</h2>
    <label>Title<input name="title" required autofocus /></label>
    <label>Subject
      <select name="subjectId">
        <option value="">— none —</option>
        ${subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
      </select>
    </label>
    <label>Due date<input name="due" type="date" value="${toISODate(Date.now())}" /></label>
    <label>Estimated minutes<input name="est" type="number" min="5" step="5" value="30" /></label>
    <label>Notes<textarea name="notes" rows="3"></textarea></label>
    <div class="task-form__actions">
      <button type="button" class="btn" data-action="cancel">Cancel</button>
      <button type="submit" class="btn btn--primary">Save</button>
    </div>
  `;
  const handle = openModal(node);
  node.querySelector<HTMLButtonElement>('[data-action="cancel"]')!.addEventListener('click', () => handle.close());
  node.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(node);
    const title = (fd.get('title') as string).trim();
    if (!title) return;
    const subjectId = (fd.get('subjectId') as string) || null;
    const dueRaw = fd.get('due') as string;
    const dueAt = dueRaw ? startOfDay(parseISODate(dueRaw)) : null;
    const estRaw = (fd.get('est') as string).trim();
    const est = estRaw ? Number(estRaw) : undefined;
    const notesRaw = (fd.get('notes') as string).trim();

    const task: Task = {
      id: crypto.randomUUID(),
      title,
      subjectId,
      dueAt,
      completedAt: null,
      createdAt: Date.now(),
      ...(est ? { estimatedMinutes: est } : {}),
      ...(notesRaw ? { notes: notesRaw } : {}),
    };
    store.tasks.set([task, ...store.tasks()]);
    handle.close();
  });
}
```

- [ ] **Step 3: Verify in dev**

Run: `npm run dev`
Navigate to `#/today`. Expected: KPIs, sidebar filters, task list. Click "+ New task", fill form, save → row appears, KPI updates, persists across reload.

- [ ] **Step 4: Commit**

```bash
git add src/ui/screens/today.ts src/ui/screens/today.modal.ts
git commit -m "feat(ui): port Today screen with sidebar, KPIs, and task modal"
```

---

## Task 23: Subjects screen

**Files:**
- Replace: `src/ui/screens/subjects.ts`

- [ ] **Step 1: Implement**

```ts
import { effect } from '@/reactive/signal';
import type { Store } from '@/domain/store';
import type { Router } from '@/ui/router';
import type { Subject, Task } from '@/domain/types';
import { openModal } from '@/ui/widgets/modal';
import { SUBJECT_PALETTE } from '@/domain/types';

export function renderSubjects(host: HTMLElement, store: Store, _router: Router): () => void {
  host.innerHTML = `
    <section class="subjects">
      <header class="subjects__header">
        <h2>Subjects</h2>
        <button class="btn btn--primary" id="add-subject">+ New subject</button>
      </header>
      <div id="subject-grid" class="subject-grid"></div>
    </section>
  `;
  host.querySelector<HTMLButtonElement>('#add-subject')!.addEventListener('click', () => openSubjectModal(store));

  const stop = effect(() => renderGrid(host, store));
  return () => { stop(); host.innerHTML = ''; };
}

function renderGrid(host: HTMLElement, store: Store): void {
  const grid = host.querySelector<HTMLElement>('#subject-grid');
  if (!grid) return;
  const subjects = store.subjects();
  const tasks = store.tasks();
  if (subjects.length === 0) {
    grid.innerHTML = `<div class="empty-state">No subjects yet. Add one to start grouping tasks.</div>`;
    return;
  }
  grid.innerHTML = subjects.map(s => renderCard(s, tasks.filter(t => t.subjectId === s.id))).join('');
}

function renderCard(s: Subject, tasks: Task[]): string {
  const total = tasks.length;
  const done = tasks.filter(t => t.completedAt !== null).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return `
    <article class="subject-card" style="--subject-color:${s.color}">
      <header><span class="subject-card__pin"></span><h3>${escapeHtml(s.name)}</h3></header>
      <div class="subject-card__meta">${done} / ${total} tasks done</div>
      <div class="progress"><div class="progress__bar" style="width:${pct}%"></div></div>
    </article>
  `;
}

function openSubjectModal(store: Store): void {
  const form = document.createElement('form');
  form.className = 'subject-form';
  form.innerHTML = `
    <h2>New subject</h2>
    <label>Name<input name="name" required autofocus /></label>
    <fieldset class="color-picker">
      <legend>Color</legend>
      ${SUBJECT_PALETTE.map((c, i) => `
        <label><input type="radio" name="color" value="${c}" ${i === 0 ? 'checked' : ''} /><span style="background:${c}"></span></label>
      `).join('')}
    </fieldset>
    <div class="task-form__actions">
      <button type="button" class="btn" data-action="cancel">Cancel</button>
      <button type="submit" class="btn btn--primary">Save</button>
    </div>
  `;
  const handle = openModal(form);
  form.querySelector<HTMLButtonElement>('[data-action="cancel"]')!.addEventListener('click', () => handle.close());
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const name = (fd.get('name') as string).trim();
    const color = (fd.get('color') as string) ?? SUBJECT_PALETTE[0];
    if (!name) return;
    const subject: Subject = { id: crypto.randomUUID(), name, color, createdAt: Date.now() };
    store.subjects.set([...store.subjects(), subject]);
    handle.close();
  });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]!));
}
```

- [ ] **Step 2: Verify in dev**

Run: `npm run dev` → `#/subjects`
Expected: subject cards render with progress; "+ New subject" opens modal; saving adds a card.

- [ ] **Step 3: Commit**

```bash
git add src/ui/screens/subjects.ts
git commit -m "feat(ui): port Subjects screen with add-subject modal"
```

---

## Task 24: Calendar screen

**Files:**
- Replace: `src/ui/screens/calendar.ts`

The calendar shows a week view: day columns with workload bars and task chips, plus prev/next-week navigation.

- [ ] **Step 1: Implement**

```ts
import { effect, signal } from '@/reactive/signal';
import type { Store } from '@/domain/store';
import type { Router } from '@/ui/router';
import type { Subject, Task } from '@/domain/types';
import { startOfDay, addDays, startOfWeek } from '@/domain/dates';
import { subjectsById } from '@/domain/subjects';

export function renderCalendar(host: HTMLElement, store: Store, _router: Router): () => void {
  const weekStart = signal(startOfWeek(Date.now(), store.settings().weekStartsOn));

  host.innerHTML = `
    <section class="calendar">
      <header class="calendar__header">
        <button class="btn" id="prev-week">‹ Prev</button>
        <h2 id="week-label"></h2>
        <button class="btn" id="next-week">Next ›</button>
      </header>
      <div id="calendar-grid" class="calendar-grid"></div>
    </section>
  `;
  host.querySelector<HTMLButtonElement>('#prev-week')!.addEventListener('click', () => weekStart.set(addDays(weekStart(), -7)));
  host.querySelector<HTMLButtonElement>('#next-week')!.addEventListener('click', () => weekStart.set(addDays(weekStart(), 7)));

  const stop = effect(() => render(host, store, weekStart()));
  return () => { stop(); host.innerHTML = ''; };
}

function render(host: HTMLElement, store: Store, ws: number): void {
  const label = host.querySelector<HTMLElement>('#week-label');
  const grid = host.querySelector<HTMLElement>('#calendar-grid');
  if (!label || !grid) return;
  const days = Array.from({ length: 7 }, (_, i) => addDays(ws, i));
  label.textContent = `${formatDate(days[0]!)} – ${formatDate(days[6]!)}`;

  const sb = subjectsById(store.subjects());
  const tasksByDay = new Map<number, Task[]>();
  for (const t of store.tasks()) {
    if (t.dueAt === null) continue;
    const k = startOfDay(t.dueAt);
    if (!tasksByDay.has(k)) tasksByDay.set(k, []);
    tasksByDay.get(k)!.push(t);
  }
  const maxLoad = Math.max(60, ...days.map(d =>
    (tasksByDay.get(d) ?? [])
      .filter(t => t.completedAt === null)
      .reduce((s, t) => s + (t.estimatedMinutes ?? 0), 0),
  ));

  grid.innerHTML = days.map(d => {
    const tasks = tasksByDay.get(d) ?? [];
    const load = tasks.filter(t => t.completedAt === null).reduce((s, t) => s + (t.estimatedMinutes ?? 0), 0);
    const pct = Math.round((load / maxLoad) * 100);
    return `
      <div class="calendar-day">
        <header class="calendar-day__header">
          <span class="calendar-day__weekday">${weekdayLabel(d)}</span>
          <span class="calendar-day__date">${new Date(d).getDate()}</span>
        </header>
        <div class="calendar-day__load">
          <div class="calendar-day__load-bar" style="width:${pct}%"></div>
          <span>${load} min</span>
        </div>
        <ul class="calendar-day__tasks">
          ${tasks.map(t => `
            <li class="calendar-chip ${t.completedAt !== null ? 'is-done' : ''}" style="--chip-color:${sb[t.subjectId ?? '']?.color ?? '#888'}">
              ${escapeHtml(t.title)}
            </li>
          `).join('')}
        </ul>
      </div>
    `;
  }).join('');
}

function formatDate(t: number): string {
  return new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
function weekdayLabel(t: number): string {
  return new Date(t).toLocaleDateString(undefined, { weekday: 'short' });
}
function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]!));
}
```

- [ ] **Step 2: Verify in dev**

Run: `npm run dev` → `#/calendar`
Expected: 7-day grid with workload bars and task chips; prev/next navigation works.

- [ ] **Step 3: Commit**

```bash
git add src/ui/screens/calendar.ts
git commit -m "feat(ui): port Calendar screen with weekly workload bars"
```

---

## Task 25: Visual parity diff against legacy

**Files:** (no source changes yet — this is a verification task that may produce CSS tweaks)

- [ ] **Step 1: Capture screenshots from new app**

Run: `npm run dev`
Open `http://localhost:5173/studyFlow/`. With the legacy seed-state imported (or with the legacy `studyflow_static_v1` key still in localStorage), capture screenshots of all 4 screens.

- [ ] **Step 2: Compare against `docs/figure-*.png`**

Open the legacy figures (`docs/figure-01-home-landing.png`, etc.) side-by-side with the new screens. Note any differences.

- [ ] **Step 3: Fix CSS regressions in the appropriate split files**

Common candidates: spacing in `.task-row`, sidebar count alignment, calendar chip color CSS variable name, dark-mode-token-typo overrides.

- [ ] **Step 4: Run full check**

Run: `npm run check`
Expected: PASS.

- [ ] **Step 5: Commit (only if CSS changed)**

```bash
git add src/styles/
git commit -m "style: tighten visual parity with legacy screenshots"
```

---

## Task 26: Delete legacy files

**Files:**
- Delete: `script.js`, root `styles.css`

- [ ] **Step 1: Confirm new app works without them**

Open `index.html` and confirm there are no `<script src="script.js">` or `<link href="styles.css">` references (they were removed in Task 18).

Run: `npm run build && npm run preview`
Expected: built site works at `http://localhost:4173/studyFlow/`.

- [ ] **Step 2: Delete and commit**

```bash
git rm script.js styles.css
git commit -m "chore: remove legacy script.js and styles.css"
```

---

## Task 27: GitHub Pages deployment

**Files:**
- Modify: `.github/workflows/ci.yml` (or create separate `deploy.yml`)

- [ ] **Step 1: Add a deploy job to the workflow**

Append to `.github/workflows/ci.yml`:

```yaml
  deploy:
    needs: check
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    permissions:
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with: { path: dist }
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Enable GitHub Pages in repo settings**

In GitHub UI → Settings → Pages → Source: "GitHub Actions". Save.

- [ ] **Step 3: Push and verify**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: deploy to GitHub Pages on push to main"
git push origin main
```

Watch the Actions tab. Once green, visit `https://<your-user>.github.io/studyFlow/` and confirm the live app.

- [ ] **Step 4: Add live URL to README**

Update the README hero with: `**Live demo:** https://<your-user>.github.io/studyFlow/`.

```bash
git add README.md
git commit -m "docs: add live demo link to README"
git push
```

---

## Phase 1 done — definition of done

- [ ] All commits land on `main`.
- [ ] `npm run check` passes locally and in CI.
- [ ] Live URL serves the new app at parity with the legacy version.
- [ ] Legacy `script.js` and root `styles.css` are deleted.
- [ ] At least 25 unit tests pass.
- [ ] No `console.log` or `TODO` left in source.
