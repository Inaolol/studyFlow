import { effect } from '@/reactive/signal';
import type { Store } from '@/domain/store';
import type { Router } from '@/ui/router';
import { kpis } from '@/domain/stats';
import { renderHeatmap } from '@/ui/widgets/charts/heatmap';

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
  stops.push(effect(() => {
    const grid = host.querySelector<HTMLElement>('#stats-grid');
    if (!grid) return;
    const card = ensureCard(grid, 'heatmap', '365-day focus');
    card.querySelector<HTMLElement>('.card__body')!.innerHTML = renderHeatmap(store.sessions(), Date.now());
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
