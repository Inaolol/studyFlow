import { hourOfDayHistogram } from '@/domain/stats';
import type { Session } from '@/domain/types';

export function renderHourHistogram(sessions: Session[]): string {
  const data = hourOfDayHistogram(sessions);
  const max = Math.max(1, ...data);
  const W = 480, H = 160, PAD = 24, BAR = (W - PAD * 2) / 24 - 2;
  const bars = data.map((m, i) => {
    const h = (m / max) * (H - PAD * 2);
    const x = PAD + i * ((W - PAD * 2) / 24);
    const y = H - PAD - h;
    return `<rect x="${x}" y="${y}" width="${BAR}" height="${h}" fill="rgba(73,125,126,0.85)">
              <title>${i}:00 · ${Math.round(m)} min</title></rect>`;
  }).join('');
  const labels = [0, 6, 12, 18].map(hh =>
    `<text x="${PAD + hh * ((W - PAD * 2) / 24)}" y="${H - 6}" font-size="10" fill="currentColor" opacity="0.6">${hh}:00</text>`
  ).join('');
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" role="img" aria-label="Hour-of-day histogram">${bars}${labels}</svg>`;
}
