import { dailyFocusMinutes } from '@/domain/stats';
import { startOfDay, addDays } from '@/domain/dates';
import type { Session } from '@/domain/types';

const CELL = 11;
const GAP = 2;
const ROWS = 7;

export function renderHeatmap(sessions: Session[], now: number): string {
  const today = startOfDay(now);
  const start = addDays(today, -364);
  const points = dailyFocusMinutes(sessions, start, 365);
  const max = Math.max(1, ...points.map(p => p.minutes));
  const cols = Math.ceil(365 / ROWS);
  const w = cols * (CELL + GAP);
  const h = ROWS * (CELL + GAP);

  const cells = points.map((p, i) => {
    const col = Math.floor(i / ROWS);
    const row = i % ROWS;
    const x = col * (CELL + GAP);
    const y = row * (CELL + GAP);
    const intensity = p.minutes === 0 ? 0 : Math.min(1, p.minutes / max);
    const fill = intensity === 0 ? 'var(--heatmap-empty)' : `rgba(220, 80, 50, ${0.25 + 0.75 * intensity})`;
    const date = new Date(p.day).toISOString().slice(0, 10);
    return `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" fill="${fill}" rx="2">
              <title>${date}: ${Math.round(p.minutes)} min</title></rect>`;
  }).join('');

  return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="Focus heatmap">${cells}</svg>`;
}
