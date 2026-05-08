# StudyFlow Portfolio Evolution — Design

**Date:** 2026-05-08
**Status:** Approved (pre-implementation)
**Goal:** Evolve StudyFlow from a polished vanilla-JS static site into a portfolio-grade frontend project — without rewriting it as React. Keep the existing visual design intact while strengthening architecture, type safety, testability, and feature depth.

## Context

Today the project is:
- ~866-line `script.js`, ~1709-line `styles.css`, 49-line `index.html` at the repo root.
- Vanilla HTML/CSS/JS, hash routing, localStorage persistence.
- Strong visual design; functional but shallow product surface.
- No types, no tests, no build step, no CI, no deployment.

Constraint: stay frontend-only for now. Native mobile/desktop and any backend (auth, cloud sync) are explicitly out of scope. The architecture must not preclude those later, but they are not in this design.

## Decisions

| Decision               | Choice                                          |
| ---------------------- | ----------------------------------------------- |
| Migration posture      | Evolutionary (not a React rewrite)              |
| Build tool             | Vite 5                                          |
| Language               | TypeScript 5, `strict: true`                    |
| Rendering architecture | Hand-rolled signal-based reactive lib (~80 LOC) |
| Test strategy          | Pragmatic — Vitest unit + 1 Playwright E2E      |
| Pomodoro integration   | Task-bound timer feeding Session records        |
| Stats scope            | Rich dashboard (KPIs + 5 charts + leaderboard)  |
| Sequencing             | Foundation → Features → Polish, three phases    |
| Data migration         | Versioned migrations from legacy localStorage   |
| Deploy target          | GitHub Pages via Actions                        |

## Architecture

Three runtime layers:

1. **Reactive core** (`src/reactive/`) — `signal`, `computed`, `effect`. Module-scoped `currentEffect` stack tracks dependencies; `set()` queues subscribers in a microtask, batched and deduped. ~80 LOC. The portfolio talking point.
2. **Domain** (`src/domain/`) — pure TS, no DOM. Tasks, subjects, sessions, stats, dates, filters, JSON/iCal IO, migrations. 90% of unit tests live here.
3. **UI** (`src/ui/`) — render functions per screen and per widget. Each screen exports `mount(root): () => void` (returning a dispose). Effects subscribed inside mount own their DOM region. Router calls dispose on navigation.

The Store is built from signals — no separate pub/sub. Persistence is one effect that serializes the store and writes localStorage, debounced 200ms. Migrations run once at boot before signals are initialized.

Routing stays hash-based (`#/today`, `#/stats`, …) — typed and modular.

The Pomodoro widget lives at the app shell level (not inside a screen) so it survives navigation.

### Limitation by design

No fine-grained DOM diffing. Each effect owns a DOM region and re-creates innerHTML (or patches a small subset) on change. Acceptable at this scale; documented in the README case study.

## File layout

```
studyflow/
├── index.html                      # mount points only; no inline JS except theme bootstrap
├── public/
│   ├── manifest.webmanifest
│   └── icons/                      # 192, 512, maskable
├── src/
│   ├── main.ts                     # bootstrap: load store, mount router, mount pomodoro
│   ├── reactive/
│   │   ├── signal.ts
│   │   └── signal.test.ts
│   ├── domain/
│   │   ├── types.ts
│   │   ├── store.ts
│   │   ├── migrations.ts
│   │   ├── tasks.ts
│   │   ├── subjects.ts
│   │   ├── sessions.ts
│   │   ├── stats.ts
│   │   ├── dates.ts
│   │   ├── ical.ts
│   │   ├── io.ts
│   │   └── *.test.ts
│   ├── ui/
│   │   ├── router.ts
│   │   ├── shortcuts.ts
│   │   ├── toast.ts                # ARIA-live announcer
│   │   ├── screens/
│   │   │   ├── home.ts
│   │   │   ├── today.ts
│   │   │   ├── subjects.ts
│   │   │   ├── calendar.ts
│   │   │   ├── stats.ts
│   │   │   └── settings.ts
│   │   └── widgets/
│   │       ├── task-row.ts
│   │       ├── modal.ts
│   │       ├── pomodoro.ts
│   │       └── charts/             # heatmap, bars, donut, line, histogram
│   ├── styles/
│   │   ├── tokens.css              # design tokens incl. dark-mode vars
│   │   ├── base.css
│   │   ├── layout.css
│   │   ├── components.css
│   │   └── animations.css
│   └── pwa/
│       └── sw.ts                   # via vite-plugin-pwa
├── tests/e2e/
│   └── happy-path.spec.ts
├── docs/
│   ├── superpowers/specs/
│   ├── adr/
│   └── (existing screenshots)
├── vite.config.ts
├── tsconfig.json
├── playwright.config.ts
├── .github/workflows/ci.yml
└── package.json
```

Old root-level `script.js` and `styles.css` are deleted at the end of Phase 1.

## Reactive core

```ts
// Conceptual API.
function signal<T>(initial: T): {
  (): T;                    // read; tracks current effect
  set(next: T): void;       // write; queues subscribers
};

function computed<T>(fn: () => T): () => T;   // memoized, auto-tracks
function effect(fn: () => void | (() => void)): () => void;  // returns dispose
```

- Read inside an effect → effect is added to the signal's subscriber set.
- `set()` queues subscribers in a microtask; multiple writes in one tick → one re-run per effect.
- `computed` is an effect with a cached value; recomputes lazily on read after invalidation.
- `effect` may return a cleanup; cleanup runs before the next re-run and on dispose.

Tested in isolation: tracking, batching, dispose, no-leak after dispose, computed memoization, nested effects. ~8 unit tests.

## Data model

```ts
type ID = string;  // crypto.randomUUID()

interface Subject {
  id: ID;
  name: string;
  color: string;          // hex from a fixed palette
  createdAt: number;
}

interface Task {
  id: ID;
  subjectId: ID | null;
  title: string;
  notes?: string;
  dueAt: number | null;   // local-midnight epoch ms
  completedAt: number | null;
  estimatedMinutes?: number;
  createdAt: number;
}

interface Session {
  id: ID;
  taskId: ID | null;       // nullable: task may be deleted later
  subjectId: ID | null;    // denormalized so stats survive deletion
  startedAt: number;
  endedAt: number;
  durationMs: number;      // actual
  kind: 'work' | 'short-break' | 'long-break';
  completed: boolean;      // false if aborted
}

interface Settings {
  theme: 'system' | 'light' | 'dark';
  pomodoro: { workMin: number; shortBreakMin: number; longBreakMin: number; longEvery: number };
  reducedMotion: 'system' | 'on' | 'off';
  weekStartsOn: 0 | 1;
}

interface PersistedState {
  schemaVersion: number;   // current: 1
  subjects: Subject[];
  tasks: Task[];
  sessions: Session[];
  settings: Settings;
}
```

Sessions are first-class records, not derived from a running timer. Stats compute from sessions + tasks, never from runtime state — so they survive reloads, deletions, and time-zone changes.

## Storage and migrations

Single localStorage key: `studyflow:v1`, JSON-encoded `PersistedState`.

```ts
// migrations.ts
const migrations: Record<number, (raw: unknown) => unknown> = {
  // 0 → 1: import legacy script.js shape
  0: (legacy) => ({ schemaVersion: 1, subjects: ..., tasks: ..., sessions: [], settings: defaults }),
};

function loadAndMigrate(): PersistedState {
  // 1. read raw JSON; if absent, return defaults
  // 2. detect schemaVersion; legacy data without it = version 0
  // 3. apply migrations[v] sequentially up to current
  // 4. validate shape with a hand-rolled checker (no Zod — keep deps minimal)
  // 5. on validation failure: write studyflow:backup-<timestamp>, start fresh
}
```

Each migration is pure and unit-tested with a frozen fixture of the real legacy localStorage shape.

## Features

### Pomodoro (task-bound)
- Click ▶ on a task → docked timer at viewport bottom.
- Defaults 25 / 5 / 15-every-4, configurable in Settings.
- Drift-proof: store `startedAt` + planned duration; render uses `Date.now() - startedAt` so backgrounded tabs stay accurate.
- On completion: append Session, advance phase, soft chime (toggle in Settings), Notification API if permission granted.
- Pause / resume / abort supported.
- Tab close mid-session → on next load, offer "finish or discard?".
- Lives at app shell level so navigation doesn't dismount it.

### Stats / rich dashboard (`/stats`)
- KPIs: current streak, longest streak, completion rate (last 30d), total focus minutes (last 30d).
- 365-day heatmap colored by daily focus minutes.
- Bar: tasks completed per day, last 30 days.
- Donut: time-on-subject, last 30 days.
- Line: weekly focus minutes, last 12 weeks.
- Hour-of-day histogram.
- Subject leaderboard: completion rate + focus minutes.
- Charts: uPlot for line/bar/heatmap; hand-rolled SVG donut + histogram. All computation in `domain/stats.ts`, fully unit-tested with fabricated fixtures.

### Dark mode
- Settings: `system` / `light` / `dark`. Applied via `data-theme` on `<html>`.
- Tokens in `tokens.css` under `:root` and `[data-theme="dark"]`.
- `system` listens to `prefers-color-scheme`.
- No FOUC: resolved theme applied via tiny inline script in `index.html` before CSS loads.

### Keyboard shortcuts
`n` new task · `/` focus search · `g t/s/c/d/?` go to today/subjects/calendar/dashboard/help · `j/k` move list selection · `x` toggle complete · `?` shortcut overlay. Disabled in inputs. Documented in help overlay.

### PWA + offline
Via `vite-plugin-pwa`. App shell + assets precached. Manifest with name, icons (192/512/maskable), theme color, standalone display. Offline-capable from second visit.

### Import / export
- Export JSON: `studyflow-export-YYYY-MM-DD.json` containing full `PersistedState`.
- Import JSON: validate, run migrations forward, backup current data first, then replace.
- Export iCal: `.ics` of all uncompleted tasks with `dueAt`, one VTODO each. Subscribable in Apple/Google Calendar.

### Search
Single input on Today, substring match on title/notes, case-insensitive, bound to `/`.

### Empty / loading / error states
Every list has a designed empty state. Error toasts via `toast.ts` (ARIA-live polite) for: import-validation failure, localStorage quota exceeded, notification permission denied.

### Out of scope (v1)
Auth, cloud sync, sharing, recurring tasks, drag-and-drop reordering, timer customization beyond the four numeric settings, mobile native packaging, multi-language.

## Testing

### Unit (Vitest)
- `reactive/signal.test.ts` — track, batch, computed memoization, dispose, no-leak, nested. ~8 tests.
- `domain/dates.test.ts` — overdue at local midnight, week start (Sun/Mon), DST. ~4 tests.
- `domain/migrations.test.ts` — legacy → v1 fixture, validation rejection, backup-on-corruption. ~3 tests.
- `domain/tasks.test.ts` — filters (today/next-7/overdue/all/by-subject), complete idempotency. ~4 tests.
- `domain/stats.test.ts` — streaks, completion rate, time-on-subject, heatmap aggregation. ~4 tests.
- `domain/io.test.ts` — JSON round-trip, malformed rejection. ~2 tests.

Total target: ~25 tests. jsdom env where DOM-touching, node env elsewhere.

### E2E (Playwright)
Single happy-path spec against `vite preview`:
1. Open → land on Home.
2. `g t` → press `n`, fill modal, save.
3. New task appears; `x` to complete; KPI updates.
4. ▶ on another task; advance `page.clock` past 25 min; verify Session recorded and stats KPI moved.
5. `g d` → heatmap shows today.
6. Reload → all persists.

Headless Chromium only. Multi-browser is YAGNI.

### Not tested
- Pixel snapshots (brittle).
- Service worker (trusted dep).
- iCal external compatibility — manual one-time check, documented in README.
- Accessibility — manual axe-devtools + keyboard pass before "done," documented in README. No automated a11y tests in CI.

### CI
GitHub Actions on push: install → typecheck → unit → build → Playwright. Target <2 min. Status badge in README.

## Tooling

- **Vite 5** — dev server, HMR, build. Config holds path alias `@/* → src/*`, base `/studyFlow/`, PWA plugin.
- **TypeScript 5** — `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`.
- **Vitest** — jsdom for DOM-touching, node otherwise.
- **Playwright** — single Chromium project.
- **vite-plugin-pwa** — manifest + service worker.
- **uPlot** — only runtime UI dep.
- **ESLint** with `@typescript-eslint` + stylistic rules; no Prettier. Single `lint` script with `--fix`.
- **`tsc --noEmit`** as a separate `typecheck` script (Vite doesn't typecheck during build).
- **Husky + lint-staged** — pre-commit lint + typecheck on staged files.

No CSS framework, no preprocessor, no state lib, no router lib, no UI framework. No Docker, no monorepo.

### npm scripts
```
dev         vite
build       tsc --noEmit && vite build
preview     vite preview
test        vitest
test:e2e    playwright test
typecheck   tsc --noEmit
lint        eslint src tests
check       npm run typecheck && npm run lint && npm run test
```

### Deployment
GitHub Pages via the same Actions workflow on push to `main`. `vite.config.ts` `base` set to `/studyFlow/`. Live URL added to README.

## README rewrite

The README is itself a portfolio artifact:
- Hero: live demo link + one screenshot.
- "What & why" — three sentences.
- **Case study**: problem framing → architectural decisions (signals lib, Store-as-effect persistence, sessions as first-class records) → tradeoffs → what's next.
- Feature list with screenshots/GIFs.
- Tech stack table with one-line rationale per choice.
- Local development.
- Lighthouse scores screenshot.
- Accessibility statement.

## Phased sequencing

Each phase ends with a working app and a green CI run. Phase 1 alone already beats the current state.

### Phase 1 — Foundation (~1 week)
1. Scaffold Vite + TS + ESLint + Vitest + Playwright + GitHub Actions.
2. Build `reactive/signal.ts` + tests (everything depends on it).
3. `domain/types.ts`, `store.ts`, `migrations.ts` with legacy importer + tests.
4. Port `dates.ts`, `tasks.ts`, `subjects.ts`, `sessions.ts` (stub), `io.ts` from existing logic, with tests.
5. Split `styles.css` into 5 token-driven files; introduce dark-mode tokens (no toggle UI yet).
6. Build `ui/router.ts` and screens for Home/Today/Subjects/Calendar — visual parity with current app.
7. Delete root `script.js` and root `styles.css`.
8. Deploy to GitHub Pages.

**Done = parity refactor on the live URL.**

### Phase 2 — Features (~1 week)
1. Pomodoro widget + Session recording.
2. Settings screen + dark-mode toggle + reduced-motion + Pomodoro durations + week start.
3. Keyboard shortcuts + help overlay + search.
4. Stats screen — KPIs first, then heatmap, bars, donut, line, histogram, leaderboard.
5. uPlot integration; hand-rolled SVG donut + histogram.
6. Toast/ARIA-live announcer; empty/error-state polish.
7. Playwright happy-path covering Pomodoro + stats.
8. Deploy.

**Done = feature-complete app.**

### Phase 3 — Polish (~3–4 days)
1. PWA manifest, icons, service worker, offline test.
2. JSON import/export UI in Settings.
3. iCal export.
4. A11y manual pass (axe-devtools, keyboard-only, screen reader smoke); fix what's found.
5. Lighthouse pass; capture screenshot.
6. README rewrite with case study, screenshots/GIFs, badge, demo link.
7. Final deploy.

**Done = portfolio-ready.**

Total: ~2.5 weeks of focused work.

## Risks and mitigations

- **Reactive lib correctness** — handwritten primitives can leak or miss updates. Mitigation: tests first, dispose path covered, batching covered.
- **CSS regressions during split** — tokenizing 1709 lines is error-prone. Mitigation: keep parity screenshots in `docs/`, visual diff manually per screen at end of Phase 1.
- **Pomodoro across tab close** — recovering an interrupted session is subtle. Mitigation: store start/plan in store; on boot, if a Session has `endedAt === 0`, prompt user.
- **GitHub Pages base path** — easy to break asset URLs. Mitigation: set `base` early; verify on first deploy.
- **Scope creep on stats** — heatmap/charts can absorb unbounded time. Mitigation: ship KPIs first, then charts in priority order; cut histogram or leaderboard if Phase 2 runs long.
