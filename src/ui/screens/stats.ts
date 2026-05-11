import { effect } from '@/reactive/signal';
import type { Store } from '@/domain/store';
import type { Router } from '@/ui/router';
import { kpis, subjectLeaderboard } from '@/domain/stats';
import { renderHeatmap } from '@/ui/widgets/charts/heatmap';
import { mountTasksPerDayBar } from '@/ui/widgets/charts/bar-uplot';
import { renderDonut } from '@/ui/widgets/charts/donut';
import { mountWeeklyFocusLine } from '@/ui/widgets/charts/line-uplot';
import { renderHourHistogram } from '@/ui/widgets/charts/histogram';
import { startOfDay, addDays } from '@/domain/dates';

export function renderStats(host: HTMLElement, store: Store, _router: Router): () => void {
  host.innerHTML = `
    <section class="screen-stats">
      <h2>Stats</h2>
      <div class="stats-kpis" id="stats-kpis"></div>
      <div class="stats-grid" id="stats-grid"></div>
    </section>
  `;

  const stops: Array<() => void> = [];
  stops.push(effect(() => renderKpis(host, store)));

  const isEmpty = (): boolean => store.sessions().length === 0 && store.tasks().length === 0;

  stops.push(effect(() => {
    const grid = host.querySelector<HTMLElement>('#stats-grid');
    if (!grid) return;
    grid.classList.toggle('is-empty', isEmpty());
    if (isEmpty()) {
      grid.innerHTML = `<div class="card stats-empty">
      <p class="empty-state">No data yet. Add a task or start a pomodoro to see your stats grow.</p>
    </div>`;
    }
  }));

  stops.push(effect(() => {
    const grid = host.querySelector<HTMLElement>('#stats-grid');
    if (!grid || grid.classList.contains('is-empty')) return;
    const card = ensureCard(grid, 'heatmap', '365-day focus');
    card.querySelector<HTMLElement>('.card__body')!.innerHTML = renderHeatmap(store.sessions(), Date.now());
  }));
  stops.push(effect(() => {
    const grid = host.querySelector<HTMLElement>('#stats-grid');
    if (!grid || grid.classList.contains('is-empty')) return;
    const card = ensureCard(grid, 'bar', 'Tasks completed · last 30 days');
    const body = card.querySelector<HTMLElement>('.card__body')!;
    return mountTasksPerDayBar(body, store.tasks(), Date.now());
  }));
  stops.push(effect(() => {
    const grid = host.querySelector<HTMLElement>('#stats-grid');
    if (!grid || grid.classList.contains('is-empty')) return;
    const card = ensureCard(grid, 'line', 'Weekly focus · last 12 weeks');
    return mountWeeklyFocusLine(card.querySelector<HTMLElement>('.card__body')!, store.sessions(), store.settings().weekStartsOn, Date.now());
  }));
  stops.push(effect(() => {
    const grid = host.querySelector<HTMLElement>('#stats-grid');
    if (!grid || grid.classList.contains('is-empty')) return;
    const card = ensureCard(grid, 'donut', 'Time on subject · last 30 days');
    const today = startOfDay(Date.now());
    card.querySelector<HTMLElement>('.card__body')!.innerHTML =
      renderDonut(store.subjects(), store.sessions(), addDays(today, -29), addDays(today, 1));
  }));
  stops.push(effect(() => {
    const grid = host.querySelector<HTMLElement>('#stats-grid');
    if (!grid || grid.classList.contains('is-empty')) return;
    const card = ensureCard(grid, 'histogram', 'Focus by hour');
    card.querySelector<HTMLElement>('.card__body')!.innerHTML = renderHourHistogram(store.sessions());
  }));

  stops.push(effect(() => {
    const grid = host.querySelector<HTMLElement>('#stats-grid');
    if (!grid || grid.classList.contains('is-empty')) return;
    const card = ensureCard(grid, 'leaderboard', 'Subject leaderboard');
    const today = startOfDay(Date.now());
    const rows = subjectLeaderboard(store.subjects(), store.tasks(), store.sessions(), addDays(today, -29), addDays(today, 1));
    card.querySelector<HTMLElement>('.card__body')!.innerHTML = rows.length === 0
      ? `<div class="empty-state">Add subjects and complete some sessions to populate.</div>`
      : `<ol class="leaderboard">${rows.map(r => `
          <li>
            <span class="dot" style="background:${r.subject.color}"></span>
            <span class="lb__name">${escapeHtml(r.subject.name)}</span>
            <span class="lb__focus">${Math.round(r.focusMinutes)} min</span>
            <span class="lb__rate">${Math.round(r.completionRate * 100)}% done</span>
          </li>`).join('')}</ol>`;
  }));

  return () => { stops.forEach(s => s()); host.innerHTML = ''; };
}

function ensureCard(grid: HTMLElement, id: string, title: string): HTMLElement {
  let card = grid.querySelector<HTMLElement>(`[data-card="${id}"]`);
  if (!card) {
    card = document.createElement('div');
    card.className = 'card';
    card.setAttribute('data-card', id);
    card.innerHTML = `<h3>${title}</h3><div class="card__body"></div>`;
    grid.appendChild(card);
  }
  return card;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]!));
}

function renderKpis(host: HTMLElement, store: Store): void {
  const el = host.querySelector<HTMLElement>('#stats-kpis');
  if (!el) return;
  const k = kpis(store.tasks(), store.sessions(), Date.now());
  el.innerHTML = `
    <div class="kpi"><div class="kpi__label">Current streak</div><div class="kpi__value">${k.currentStreak} d</div></div>
    <div class="kpi"><div class="kpi__label">Longest streak</div><div class="kpi__value">${k.longestStreak} d</div></div>
    <div class="kpi"><div class="kpi__label">Completion (30d)</div><div class="kpi__value">${Math.round(k.completionRate30d * 100)}%</div></div>
    <div class="kpi"><div class="kpi__label">Focus (30d)</div><div class="kpi__value">${Math.round(k.focusMinutes30d)} min</div></div>
  `;
}
