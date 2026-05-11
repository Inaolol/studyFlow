import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';
import { weeklyFocusMinutes } from '@/domain/stats';
import type { Session, WeekStart } from '@/domain/types';

export function mountWeeklyFocusLine(host: HTMLElement, sessions: Session[], weekStartsOn: WeekStart, now: number): () => void {
  const points = weeklyFocusMinutes(sessions, weekStartsOn, 12, now);
  const xs = points.map(p => p.day / 1000);
  const ys = points.map(p => Math.round(p.minutes));
  host.innerHTML = '';
  const u = new uPlot({
    width: host.clientWidth || 480,
    height: 180,
    series: [
      {},
      { label: 'Minutes', stroke: '#0F66AE', width: 2, points: { show: true } },
    ],
    axes: [{}, { label: 'Min' }],
    scales: { x: { time: true } },
  }, [xs, ys] as never, host);
  return () => u.destroy();
}
