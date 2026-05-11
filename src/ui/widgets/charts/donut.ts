import type { Subject, Session } from '@/domain/types';
import { timeOnSubject } from '@/domain/stats';

export function renderDonut(subjects: Subject[], sessions: Session[], from: number, to: number): string {
  const minutes = timeOnSubject(sessions, from, to);
  const entries = subjects
    .map(s => ({ subject: s, value: minutes[s.id] ?? 0 }))
    .filter(e => e.value > 0);
  const total = entries.reduce((s, e) => s + e.value, 0);
  if (total === 0) return `<div class="empty-state">No focus minutes yet.</div>`;

  const r = 60, cx = 90, cy = 90;
  let acc = 0;
  const arcs = entries.map(({ subject, value }) => {
    const a0 = (acc / total) * Math.PI * 2 - Math.PI / 2;
    const a1 = ((acc + value) / total) * Math.PI * 2 - Math.PI / 2;
    acc += value;
    const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
    const large = a1 - a0 > Math.PI ? 1 : 0;
    return `<path d="M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} Z"
                  fill="${subject.color}"><title>${escapeAttr(subject.name)}: ${Math.round(value)} min</title></path>`;
  }).join('');
  const legend = entries.map(({ subject, value }) =>
    `<li><span class="dot" style="background:${subject.color}"></span>${escapeAttr(subject.name)} · ${Math.round(value)} min</li>`
  ).join('');

  return `
    <div class="donut">
      <svg viewBox="0 0 180 180" width="180" height="180" role="img" aria-label="Time on subject">
        ${arcs}
        <circle cx="${cx}" cy="${cy}" r="35" fill="var(--surface)"/>
      </svg>
      <ul class="donut__legend">${legend}</ul>
    </div>
  `;
}

function escapeAttr(s: string): string {
  return s.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]!));
}
