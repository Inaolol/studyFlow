import { effect, signal } from '@/reactive/signal';
import type { Store } from '@/domain/store';
import type { Router } from '@/ui/router';
import type { Task } from '@/domain/types';
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
