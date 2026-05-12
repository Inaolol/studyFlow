import { effect, signal } from '@/reactive/signal';
import type { Store } from '@/domain/store';
import type { Router } from '@/ui/router';
import type { Subject, Task } from '@/domain/types';
import { startOfDay, addDays, startOfWeek } from '@/domain/dates';
import { subjectsById } from '@/domain/subjects';

export function renderCalendar(host: HTMLElement, store: Store, _router: Router): () => void {
  const weekStart = signal(startOfWeek(Date.now(), store.settings().weekStartsOn));

  host.innerHTML = `<main class="main calendar-main"></main>`;

  function onPrev(): void { weekStart.set(addDays(weekStart(), -7)); }
  function onNext(): void { weekStart.set(addDays(weekStart(), 7)); }
  function onToday(): void { weekStart.set(startOfWeek(Date.now(), store.settings().weekStartsOn)); }

  const stop = effect(() => render(host, store, weekStart(), { onPrev, onNext, onToday }));
  return () => { stop(); host.innerHTML = ''; };
}

interface CalendarHandlers {
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

function render(host: HTMLElement, store: Store, ws: number, h: CalendarHandlers): void {
  const main = host.querySelector<HTMLElement>('.calendar-main');
  if (!main) return;

  const days = Array.from({ length: 7 }, (_, i) => ({
    key: addDays(ws, i),
    date: new Date(addDays(ws, i)),
  }));

  const sb = subjectsById(store.subjects());
  const tasksByDay = new Map<number, Task[]>();
  for (const t of store.tasks()) {
    if (t.dueAt === null) continue;
    const k = startOfDay(t.dueAt);
    if (!tasksByDay.has(k)) tasksByDay.set(k, []);
    tasksByDay.get(k)!.push(t);
  }

  const todayKey = startOfDay(Date.now());
  const loads = days.map(d =>
    (tasksByDay.get(d.key) ?? [])
      .filter(t => t.completedAt === null)
      .reduce((s, t) => s + (t.estimatedMinutes ?? 0), 0),
  );
  const maxLoad = Math.max(60, ...loads);

  const first = days[0]!.date;
  const last = days[6]!.date;
  const monthLabel = first.getMonth() === last.getMonth()
    ? `${first.toLocaleDateString('en-US', { month: 'long' })} ${first.getDate()}–${last.getDate()}, ${first.getFullYear()}`
    : `${first.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} – ${last.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}, ${first.getFullYear()}`;

  main.innerHTML = `
    <div class="page-head">
      <div>
        <h1>This week</h1>
        <div class="range">${escapeHtml(monthLabel)}</div>
      </div>
      <div class="week-nav">
        <button class="nav-btn" id="prev-week" type="button" aria-label="Previous week">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <button class="btn btn-secondary btn-sm" id="this-week" type="button">Today</button>
        <button class="nav-btn" id="next-week" type="button" aria-label="Next week">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
        </button>
      </div>
    </div>

    <div class="workload-section">
      <h3>Workload across the week</h3>
      <div class="workload-sub">Estimated time per day. Spot the heavy days early.</div>
      <div class="wl-bars">
        ${days.map((d, i) => {
          const load = loads[i]!;
          const pct = (load / maxLoad) * 100;
          const cls = load > 120 ? 'heavy' : load > 60 ? 'medium' : 'light';
          const hours = load ? Math.round((load / 60) * 10) / 10 + 'h' : '—';
          return `
            <div class="wl-bar">
              <div class="bar-value">${hours}</div>
              <div class="bar-track">
                <div class="bar-fill ${cls}" style="height:${load ? Math.max(pct, 4) : 0}%"></div>
              </div>
              <div class="bar-label">${d.date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <div class="legend">
      ${store.subjects().map(s => `
        <div class="legend-item">
          <span class="subj-dot" style="background:${s.color};width:12px;height:12px"></span>
          <span>${escapeHtml(s.name)}</span>
        </div>
      `).join('')}
    </div>

    <div class="week-grid">
      ${days.map(d => dayCell(d.key, d.date, tasksByDay.get(d.key) ?? [], sb, todayKey)).join('')}
    </div>
  `;

  main.querySelector<HTMLButtonElement>('#prev-week')?.addEventListener('click', h.onPrev);
  main.querySelector<HTMLButtonElement>('#next-week')?.addEventListener('click', h.onNext);
  main.querySelector<HTMLButtonElement>('#this-week')?.addEventListener('click', h.onToday);

  main.querySelectorAll<HTMLElement>('.day-task').forEach(el => {
    const id = el.dataset['taskId'];
    if (!id) return;
    el.addEventListener('click', () => {
      const next = store.tasks().map(t =>
        t.id === id ? { ...t, completedAt: t.completedAt === null ? Date.now() : null } : t,
      );
      store.tasks.set(next);
    });
  });
}

function dayCell(
  key: number,
  date: Date,
  tasks: Task[],
  sb: Record<string, Subject>,
  todayKey: number,
): string {
  const isToday = key === todayKey;
  const isPast = key < todayKey;
  const open = tasks.filter(t => t.completedAt === null);
  const totalMin = open.reduce((s, t) => s + (t.estimatedMinutes ?? 0), 0);
  const hours = totalMin ? Math.round((totalMin / 60) * 10) / 10 + 'h' : '—';
  const ordered = [...tasks].sort((a, b) => (a.completedAt === b.completedAt) ? 0 : a.completedAt !== null ? 1 : -1);

  return `
    <div class="day${isToday ? ' today' : ''}${isPast && !isToday ? ' past' : ''}">
      <div class="day-head">
        <div>
          <div class="dow">${date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
          <div class="dom">${date.getDate()}</div>
        </div>
        <div class="load">${hours}</div>
      </div>
      <div style="flex:1;display:flex;flex-direction:column;min-height:0">
        ${ordered.map(t => {
          const subj = t.subjectId ? sb[t.subjectId] : undefined;
          const color = subj?.color ?? '#888';
          return `
            <div class="day-task${t.completedAt !== null ? ' done' : ''}"
                 data-task-id="${t.id}"
                 style="--task-color:${color}">
              ${subj ? `<div class="dt-subj">${escapeHtml(subj.name)}</div>` : ''}
              <div class="dt-title">${escapeHtml(t.title)}</div>
              <div class="dt-meta">
                ${t.estimatedMinutes ? `<span>${t.estimatedMinutes}m</span>` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]!));
}
