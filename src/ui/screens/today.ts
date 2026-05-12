import { effect, signal } from '@/reactive/signal';
import type { Store } from '@/domain/store';
import type { Router } from '@/ui/router';
import { filterTasks, type TaskFilter, completeTask, uncompleteTask } from '@/domain/tasks';
import { isOverdue, startOfDay, addDays } from '@/domain/dates';
import { subjectsById } from '@/domain/subjects';
import type { Subject, Task } from '@/domain/types';
import { openTaskModal } from './today.modal';
import { toast } from '@/ui/toast';

const SECTION_BLURB: Record<string, string> = {
  next7: "Heads up — what's coming.",
  overdue: 'Past due — bring these home.',
  all: 'Everything in your plan.',
};

export function renderToday(host: HTMLElement, store: Store, _router: Router): () => void {
  const filter = signal<TaskFilter>({ type: 'today' });
  const query = signal<string>('');

  host.innerHTML = `
    <section class="app-layout">
      <aside class="sidebar" id="sidebar"></aside>
      <main class="main" id="main"></main>
    </section>
  `;

  const stopMain = effect(() => renderMain(host, store, filter, query));
  const stopSidebar = effect(() => renderSidebar(host, store, filter));

  return () => {
    stopMain();
    stopSidebar();
    host.innerHTML = '';
  };
}

function renderSidebar(
  host: HTMLElement,
  store: Store,
  filter: ReturnType<typeof signal<TaskFilter>>,
): void {
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
  };
  const subjectOpen = new Map<string, number>();
  for (const s of subjects) {
    subjectOpen.set(
      s.id,
      tasks.filter(t => t.subjectId === s.id && t.completedAt === null).length,
    );
  }

  const todayTasks = tasks.filter(t => t.dueAt !== null && startOfDay(t.dueAt) === today);
  const todayDone = todayTasks.filter(t => t.completedAt !== null).length;
  const todayPct = todayTasks.length ? Math.round((todayDone / todayTasks.length) * 100) : 0;

  const current = filter();
  const active = (t: TaskFilter['type']): string => (current.type === t ? ' active' : '');

  sidebar.innerHTML = `
    <div class="sb-section-title">Views</div>
    <button class="sb-link${active('today')}" data-filter="today" type="button">
      ${iconClock()}
      <span>Today</span>
      <span class="count">${counts.today}</span>
    </button>
    <button class="sb-link${active('next7')}" data-filter="next7" type="button">
      ${iconCalendar()}
      <span>Next 7 days</span>
      <span class="count">${counts.next7}</span>
    </button>
    <button class="sb-link${active('overdue')}" data-filter="overdue" type="button">
      ${iconAlert()}
      <span>Overdue</span>
      <span class="count"${counts.overdue ? ' style="color:var(--accent)"' : ''}>${counts.overdue}</span>
    </button>
    <button class="sb-link${active('all')}" data-filter="all" type="button">
      ${iconList()}
      <span>All tasks</span>
    </button>

    <div class="sb-section-title">Subjects</div>
    ${subjects.map(s => `
      <button class="sb-link${current.type === 'subject' && current.subjectId === s.id ? ' active' : ''}"
              data-subject-id="${s.id}" type="button">
        <span class="subj-dot" style="background:${s.color}"></span>
        <span>${escapeHtml(s.name)}</span>
        <span class="count">${subjectOpen.get(s.id) ?? 0}</span>
      </button>
    `).join('')}
    <a href="#subjects" class="sb-link sb-link--muted">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
      <span>Manage subjects</span>
    </a>

    <div class="sb-section-title">This week</div>
    <div class="sb-progress">
      <div class="label">Today's progress</div>
      <div class="pct">${todayPct}%</div>
      <div class="bar"><div style="width:${todayPct}%"></div></div>
      <div class="sb-streak">🔥 <strong>7-day streak</strong></div>
    </div>
  `;

  sidebar.querySelectorAll<HTMLButtonElement>('button[data-filter]').forEach(b => {
    b.addEventListener('click', () => {
      const t = b.dataset['filter'] as 'today' | 'next7' | 'overdue' | 'all';
      filter.set({ type: t });
    });
  });
  sidebar.querySelectorAll<HTMLButtonElement>('button[data-subject-id]').forEach(b => {
    b.addEventListener('click', () => {
      filter.set({ type: 'subject', subjectId: b.dataset['subjectId']! });
    });
  });
}

function renderMain(
  host: HTMLElement,
  store: Store,
  filter: ReturnType<typeof signal<TaskFilter>>,
  query: ReturnType<typeof signal<string>>,
): void {
  const main = host.querySelector<HTMLElement>('#main');
  if (!main) return;

  const subjects = store.subjects();
  const sb = subjectsById(subjects);
  const current = filter();
  const today = startOfDay(Date.now());
  const next7End = addDays(today, 7);

  let filtered = filterTasks(store.tasks(), current);
  const q = query();
  if (q.trim() !== '') {
    const needle = q.toLowerCase();
    filtered = filtered.filter(t =>
      t.title.toLowerCase().includes(needle) ||
      (t.notes ?? '').toLowerCase().includes(needle),
    );
  }
  filtered = [...filtered].sort((a, b) => {
    const aDone = a.completedAt !== null;
    const bDone = b.completedAt !== null;
    if (aDone !== bDone) return aDone ? 1 : -1;
    const aDue = a.dueAt ?? Infinity;
    const bDue = b.dueAt ?? Infinity;
    return aDue - bDue;
  });

  const { title, subtitle } = titleFor(current, subjects, today);

  const todayTasks = store.tasks().filter(t => t.dueAt !== null && startOfDay(t.dueAt) === today);
  const todayDone = todayTasks.filter(t => t.completedAt !== null).length;
  const todayPct = todayTasks.length ? (todayDone / todayTasks.length) * 100 : 0;
  const remainingMin = todayTasks
    .filter(t => t.completedAt === null)
    .reduce((s, t) => s + (t.estimatedMinutes ?? 0), 0);
  const weekTasks = store.tasks().filter(t =>
    t.dueAt !== null && startOfDay(t.dueAt) >= today && startOfDay(t.dueAt) < next7End,
  );
  const weekDone = weekTasks.filter(t => t.completedAt !== null).length;

  const isToday = current.type === 'today';

  main.innerHTML = `
    <div class="page-head">
      <div>
        <h1>${escapeHtml(title)}</h1>
        <div class="date">${escapeHtml(subtitle)}</div>
      </div>
    </div>

    ${isToday ? renderTodayStats(todayDone, todayTasks.length, todayPct, remainingMin, weekDone, weekTasks.length) : ''}

    <div class="section-h">
      <h3>
        ${isToday ? 'Tasks for today' : 'Tasks'}
        <span class="count">${filtered.length}</span>
      </h3>
      <div class="row gap-3">
        <input id="task-search" type="search" class="task-search" placeholder="Search" aria-label="Search tasks" value="${escapeAttr(q)}" />
        <button class="btn btn-ghost btn-sm" id="add-task" type="button">
          ${iconPlus()}
          <span>Add</span>
        </button>
      </div>
    </div>

    ${filtered.length === 0
      ? renderEmpty()
      : isToday
        ? renderFlatList(filtered, sb)
        : renderGroupedList(filtered, sb)
    }
  `;

  if (isToday) {
    const qa = main.querySelector<HTMLElement>('#quick-add');
    qa?.addEventListener('click', () => openTaskModal({ store }));
  }

  main.querySelector<HTMLButtonElement>('#add-task')?.addEventListener('click', () => openTaskModal({ store }));

  const search = main.querySelector<HTMLInputElement>('#task-search');
  if (search) {
    search.addEventListener('input', () => query.set(search.value));
  }

  main.querySelectorAll<HTMLElement>('.task').forEach(row => {
    const id = row.dataset['taskId'];
    if (!id) return;
    const main = row.querySelector<HTMLElement>('.task-main');
    main?.addEventListener('click', () => toggleTask(store, id));
    row.querySelector<HTMLButtonElement>('.task-delete')?.addEventListener('click', () => {
      store.tasks.set(store.tasks().filter(t => t.id !== id));
    });
    row.querySelector<HTMLButtonElement>('.task-start')?.addEventListener('click', () => {
      const task = store.tasks().find(t => t.id === id);
      if (!task) return;
      if (store.active() !== null) {
        toast('A pomodoro is already running.');
        return;
      }
      const settings = store.settings();
      store.active.set({
        taskId: task.id,
        subjectId: task.subjectId,
        kind: 'work',
        startedAt: Date.now(),
        plannedDurationMs: settings.pomodoro.workMin * 60_000,
        cycleIndex: 0,
        paused: false, pausedAt: null, accumulatedPauseMs: 0,
      });
    });
  });
}

function toggleTask(store: Store, id: string): void {
  store.tasks.set(store.tasks().map(t =>
    t.id === id ? (t.completedAt !== null ? uncompleteTask(t) : completeTask(t)) : t,
  ));
}

function renderTodayStats(
  done: number, total: number, pct: number, remainingMin: number, weekDone: number, weekTotal: number,
): string {
  const hours = Math.floor(remainingMin / 60);
  const mins = remainingMin % 60;
  return `
    <div class="quick-add" id="quick-add">
      <span class="qa-icon">${iconPlus()}</span>
      <input readOnly placeholder="Add a task — try 'Read Chapter 4 for History, due tomorrow'" />
      <span class="small muted">N</span>
    </div>
    <div class="stat-row">
      <div class="stat-card highlight">
        <div class="stat-label">Today's plan</div>
        <div class="ring-wrap">
          ${progressRing(pct)}
          <div>
            <div class="stat-value" style="font-size:24px">${done} / ${total}</div>
            <div class="stat-sub">tasks done</div>
          </div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Time on tap</div>
        <div class="stat-value">${hours}h${mins ? ' ' + mins + 'm' : ''}</div>
        <div class="stat-sub">remaining today</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">This week</div>
        <div class="stat-value">${weekDone}<span style="color:var(--neutral-gray);font-size:22px"> / ${weekTotal}</span></div>
        <div class="stat-sub">tasks completed</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Streak</div>
        <div class="stat-value">7<span style="font-size:22px;color:var(--neutral-gray)"> days</span></div>
        <div class="stat-sub">don't break the chain</div>
      </div>
    </div>
  `;
}

function progressRing(pct: number): string {
  const size = 60, stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" class="ring" aria-hidden="true">
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="${stroke}"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--accent-tint)" stroke-width="${stroke}"
              stroke-dasharray="${c}" stroke-dashoffset="${offset}"
              transform="rotate(-90 ${size / 2} ${size / 2})"
              stroke-linecap="round"/>
      <text x="${size / 2}" y="${size / 2}" text-anchor="middle" dy="0.35em"
            fill="white" font-size="14" font-weight="600" font-family="var(--font-body)">${Math.round(pct)}%</text>
    </svg>
  `;
}

function renderFlatList(tasks: Task[], sb: Record<string, Subject>): string {
  return `<div class="task-list">${tasks.map(t => taskRow(t, sb)).join('')}</div>`;
}

function renderGroupedList(tasks: Task[], sb: Record<string, Subject>): string {
  const groups = new Map<number, Task[]>();
  for (const t of tasks) {
    const key = t.dueAt !== null ? startOfDay(t.dueAt) : 0;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(t);
  }
  const ordered = Array.from(groups.entries()).sort((a, b) => a[0] - b[0]);
  const today = startOfDay(Date.now());
  return ordered.map(([key, items]) => {
    const label = key === 0
      ? 'No due date'
      : new Date(key).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    const suffix = key === 0
      ? ''
      : key === today
        ? ' · today'
        : key === addDays(today, 1)
          ? ' · tomorrow'
          : key < today
            ? ` · ${Math.round((today - key) / 86400000)}d overdue`
            : '';
    return `
      <div style="margin-bottom:24px">
        <div class="group-label">${escapeHtml(label)}${suffix}</div>
        <div class="task-list">${items.map(t => taskRow(t, sb)).join('')}</div>
      </div>
    `;
  }).join('');
}

function taskRow(t: Task, sb: Record<string, Subject>): string {
  const subject = t.subjectId ? sb[t.subjectId] : undefined;
  const done = t.completedAt !== null;
  return `
    <div class="task${done ? ' done' : ''}" data-task-id="${t.id}">
      <div class="priority-flag${done ? ' low' : ''}"></div>
      <button class="task-main" type="button">
        <span class="check${done ? ' checked' : ''}" aria-hidden="true"></span>
        <span class="task-body">
          <span class="task-title">${escapeHtml(t.title)}</span>
          <span class="task-meta">
            ${t.estimatedMinutes ? `<span class="meta-est">${iconClock(11)} ${t.estimatedMinutes}m</span>` : ''}
            ${t.dueAt !== null ? `<span>·</span><span>Due ${shortDate(t.dueAt)}</span>` : ''}
            ${t.notes ? `<span>·</span><span style="font-style:italic">has notes</span>` : ''}
          </span>
        </span>
      </button>
      ${subject ? `
        <span class="task-subj-tag" style="color:${subject.color};background:color-mix(in srgb, ${subject.color} 8%, transparent)">
          <span class="subj-dot" style="background:${subject.color}"></span>
          ${escapeHtml(subject.name)}
        </span>
      ` : '<span></span>'}
      <div class="task-actions">
        ${!done ? `<button class="icon-btn task-start" type="button" aria-label="Start pomodoro">${iconPlay()}</button>` : ''}
        <button class="icon-btn task-delete" type="button" aria-label="Delete">${iconTrash()}</button>
      </div>
    </div>
  `;
}

function renderEmpty(): string {
  return `
    <div class="task-list">
      <div class="empty">
        <div style="font-size:32px;margin-bottom:12px">🌤️</div>
        <div style="color:var(--charcoal);font-weight:600;margin-bottom:4px">Nothing here.</div>
        <div>Add a task to start planning, or pick a different view.</div>
      </div>
    </div>
  `;
}

function titleFor(filter: TaskFilter, subjects: Subject[], today: number): { title: string; subtitle: string } {
  switch (filter.type) {
    case 'today': return {
      title: 'Today',
      subtitle: new Date(today).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
    };
    case 'next7': return { title: 'Next 7 days', subtitle: SECTION_BLURB['next7']! };
    case 'overdue': return { title: 'Overdue', subtitle: SECTION_BLURB['overdue']! };
    case 'all': return { title: 'All tasks', subtitle: SECTION_BLURB['all']! };
    case 'subject': {
      const s = subjects.find(x => x.id === filter.subjectId);
      return { title: s?.name ?? 'Subject', subtitle: 'Filtered by subject.' };
    }
  }
}

function shortDate(epoch: number): string {
  return new Date(epoch).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]!));
}

function escapeAttr(s: string): string {
  return escapeHtml(s);
}

function iconClock(size = 16): string {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>`;
}
function iconCalendar(): string {
  return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>`;
}
function iconAlert(): string {
  return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/></svg>`;
}
function iconList(): string {
  return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18"/></svg>`;
}
function iconPlus(): string {
  return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>`;
}
function iconPlay(): string {
  return `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>`;
}
function iconTrash(): string {
  return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>`;
}
