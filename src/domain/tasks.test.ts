import { describe, it, expect } from 'vitest';
import type { Task } from './types';
import { filterTasks, completeTask, uncompleteTask } from './tasks';

const day = (offset: number): number => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return d.getTime();
};

const t = (overrides: Partial<Task>): Task => ({
  id: Math.random().toString(),
  subjectId: 's1',
  title: 'x',
  dueAt: day(0),
  completedAt: null,
  createdAt: day(-30),
  ...overrides,
});

describe('filterTasks', () => {
  const tasks: Task[] = [
    t({ id: 'a', dueAt: day(0) }),
    t({ id: 'b', dueAt: day(1) }),
    t({ id: 'c', dueAt: day(-1) }),
    t({ id: 'd', dueAt: day(0), completedAt: day(0) }),
    t({ id: 'e', subjectId: 's2', dueAt: day(0) }),
    t({ id: 'f', dueAt: null }),
  ];

  it('today returns tasks due today, including completed', () => {
    const ids = filterTasks(tasks, { type: 'today' }).map(x => x.id);
    expect(ids.sort()).toEqual(['a', 'd', 'e']);
  });

  it('next7 returns uncompleted tasks due in [today, today+7)', () => {
    const ids = filterTasks(tasks, { type: 'next7' }).map(x => x.id);
    expect(ids.sort()).toEqual(['a', 'b', 'e']);
  });

  it('overdue returns uncompleted tasks past due', () => {
    const ids = filterTasks(tasks, { type: 'overdue' }).map(x => x.id);
    expect(ids).toEqual(['c']);
  });

  it('all returns uncompleted tasks regardless of due', () => {
    const ids = filterTasks(tasks, { type: 'all' }).map(x => x.id);
    expect(ids.sort()).toEqual(['a', 'b', 'c', 'e', 'f']);
  });

  it('subject returns tasks for the given subject', () => {
    const ids = filterTasks(tasks, { type: 'subject', subjectId: 's2' }).map(x => x.id);
    expect(ids).toEqual(['e']);
  });
});

describe('completeTask / uncompleteTask', () => {
  it('completeTask sets completedAt to the given time', () => {
    const task = t({ completedAt: null });
    const updated = completeTask(task, 1234);
    expect(updated.completedAt).toBe(1234);
  });

  it('completeTask is idempotent on already-completed tasks', () => {
    const task = t({ completedAt: 100 });
    const updated = completeTask(task, 1234);
    expect(updated.completedAt).toBe(100);
  });

  it('uncompleteTask clears completedAt', () => {
    const task = t({ completedAt: 100 });
    const updated = uncompleteTask(task);
    expect(updated.completedAt).toBeNull();
  });
});
