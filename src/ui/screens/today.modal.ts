import { openModal } from '@/ui/widgets/modal';
import type { Store } from '@/domain/store';
import type { Task } from '@/domain/types';
import { parseISODate, toISODate, startOfDay } from '@/domain/dates';

export function openTaskModal(opts: { store: Store }): void {
  const { store } = opts;
  const subjects = store.subjects();
  const node = document.createElement('form');
  node.className = 'task-form';
  node.innerHTML = `
    <h2>New task</h2>
    <label>Title<input name="title" required autofocus /></label>
    <label>Subject
      <select name="subjectId">
        <option value="">— none —</option>
        ${subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
      </select>
    </label>
    <label>Due date<input name="due" type="date" value="${toISODate(Date.now())}" /></label>
    <label>Estimated minutes<input name="est" type="number" min="5" step="5" value="30" /></label>
    <label>Notes<textarea name="notes" rows="3"></textarea></label>
    <div class="task-form__actions">
      <button type="button" class="btn" data-action="cancel">Cancel</button>
      <button type="submit" class="btn btn--primary">Save</button>
    </div>
  `;
  const handle = openModal(node);
  node.querySelector<HTMLButtonElement>('[data-action="cancel"]')!.addEventListener('click', () => handle.close());
  node.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(node);
    const title = (fd.get('title') as string).trim();
    if (!title) return;
    const subjectId = (fd.get('subjectId') as string) || null;
    const dueRaw = fd.get('due') as string;
    const dueAt = dueRaw ? startOfDay(parseISODate(dueRaw)) : null;
    const estRaw = (fd.get('est') as string).trim();
    const est = estRaw ? Number(estRaw) : undefined;
    const notesRaw = (fd.get('notes') as string).trim();

    const task: Task = {
      id: crypto.randomUUID(),
      title,
      subjectId,
      dueAt,
      completedAt: null,
      createdAt: Date.now(),
      ...(est ? { estimatedMinutes: est } : {}),
      ...(notesRaw ? { notes: notesRaw } : {}),
    };
    store.tasks.set([task, ...store.tasks()]);
    handle.close();
  });
}
