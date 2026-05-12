import type { Task } from './types';

export function exportICal(tasks: Task[]): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//StudyFlow//StudyFlow//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  for (const task of tasks) {
    if (task.completedAt !== null || task.dueAt === null) continue;
    lines.push(...vtodoLines(task));
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}

function vtodoLines(task: Task): string[] {
  const dtstamp = utcStamp(new Date());
  const due = dateValue(new Date(task.dueAt!));
  const result: string[] = [
    'BEGIN:VTODO',
    ...fold(`UID:${task.id}@studyflow`),
    ...fold(`DTSTAMP:${dtstamp}`),
    ...fold(`SUMMARY:${escapeText(task.title)}`),
    ...fold(`DUE;VALUE=DATE:${due}`),
  ];
  if (task.notes) result.push(...fold(`DESCRIPTION:${escapeText(task.notes)}`));
  result.push('END:VTODO');
  return result;
}

function utcStamp(d: Date): string {
  return d.toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z';
}

function dateValue(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

function escapeText(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

function fold(line: string): string[] {
  if (line.length <= 75) return [line];
  const parts: string[] = [line.slice(0, 75)];
  let i = 75;
  while (i < line.length) {
    parts.push(' ' + line.slice(i, i + 74));
    i += 74;
  }
  return parts;
}
