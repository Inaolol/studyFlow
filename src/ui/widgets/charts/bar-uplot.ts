import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';
import { dailyCompletedCounts } from '@/domain/stats';
import { startOfDay, addDays } from '@/domain/dates';
import type { Task } from '@/domain/types';

export function mountTasksPerDayBar(host: HTMLElement, tasks: Task[], now: number): () => void {
  const today = startOfDay(now);
  const start = addDays(today, -29);
  const points = dailyCompletedCounts(tasks, start, 30);
  const xs = points.map(p => p.day / 1000);
  const ys = points.map(p => p.count);
  host.innerHTML = '';
  host.setAttribute('role', 'img');
  host.setAttribute('aria-label', 'Tasks completed per day, last 30 days');

  const barsBuilder = (uPlot as unknown as { paths: { bars?: (opts: { size?: [number] }) => unknown } }).paths?.bars;
  const opts: ConstructorParameters<typeof uPlot>[0] = {
    width: host.clientWidth || 480,
    height: 180,
    series: [
      {},
      {
        label: 'Tasks',
        stroke: '#e34432',
        fill: 'rgba(227,68,50,0.25)',
        ...(barsBuilder ? { paths: barsBuilder({ size: [0.6] }) as never } : {}),
      },
    ],
    axes: [{}, { label: 'Tasks' }],
    scales: { x: { time: true } },
  };

  const u = new uPlot(opts, [xs, ys] as never, host);
  return () => u.destroy();
}
