import { effect } from '@/reactive/signal';
import type { Store } from '@/domain/store';
import type { Router } from '@/ui/router';
import { kpis } from '@/domain/stats';

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

  return () => { stops.forEach(s => s()); host.innerHTML = ''; };
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
