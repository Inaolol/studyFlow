import type { Task, ID } from './types';
import { startOfDay, addDays, isOverdue } from './dates';

export type TaskFilter =
  | { type: 'today' }
  | { type: 'next7' }
  | { type: 'overdue' }
  | { type: 'all' }
  | { type: 'subject'; subjectId: ID };

export function filterTasks(tasks: Task[], filter: TaskFilter, now: number = Date.now()): Task[] {
  const today = startOfDay(now);
  const weekEnd = addDays(today, 7);

  switch (filter.type) {
    case 'today':
      return tasks.filter(t => t.dueAt !== null && startOfDay(t.dueAt) === today);
    case 'next7':
      return tasks.filter(t =>
        t.completedAt === null &&
        t.dueAt !== null &&
        startOfDay(t.dueAt) >= today &&
        startOfDay(t.dueAt) < weekEnd,
      );
    case 'overdue':
      return tasks.filter(t => t.completedAt === null && isOverdue(t.dueAt, now));
    case 'all':
      return tasks.filter(t => t.completedAt === null);
    case 'subject':
      return tasks.filter(t => t.subjectId === filter.subjectId);
  }
}

export function completeTask(task: Task, now: number = Date.now()): Task {
  if (task.completedAt !== null) return task;
  return { ...task, completedAt: now };
}

export function uncompleteTask(task: Task): Task {
  if (task.completedAt === null) return task;
  return { ...task, completedAt: null };
}
