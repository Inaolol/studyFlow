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
