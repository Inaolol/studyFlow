import type { Subject, Task } from '@/domain/types';
import { completeTask, uncompleteTask } from '@/domain/tasks';

export interface TaskRowDeps {
  getSubject: (id: string | null) => Subject | undefined;
  onToggle: (next: Task) => void;
  onDelete: (id: string) => void;
  onStart?: (task: Task) => void;
}

export function renderTaskRow(task: Task, deps: TaskRowDeps): HTMLElement {
  const row = document.createElement('div');
  row.className = 'task-row' + (task.completedAt !== null ? ' task-row--done' : '');
  row.dataset.taskId = task.id;

  const subject = deps.getSubject(task.subjectId);
  const subjectColor = subject?.color ?? '#888';

  row.innerHTML = `
    <input type="checkbox" class="task-row__check" aria-label="Toggle complete" ${task.completedAt !== null ? 'checked' : ''} />
    <span class="task-row__pin" style="background:${subjectColor}"></span>
    <div class="task-row__body">
      <div class="task-row__title">${escapeHtml(task.title)}</div>
      <div class="task-row__meta">
        ${subject ? `<span class="task-row__subject">${escapeHtml(subject.name)}</span>` : ''}
        ${task.estimatedMinutes ? `<span class="task-row__est">${task.estimatedMinutes} min</span>` : ''}
      </div>
    </div>
    ${deps.onStart && task.completedAt === null
      ? `<button class="task-row__start" aria-label="Start pomodoro for ${escapeHtml(task.title)}">▶</button>`
      : ''}
    <button class="task-row__delete" aria-label="Delete ${escapeHtml(task.title)}">×</button>
  `;

  const check = row.querySelector<HTMLInputElement>('.task-row__check')!;
  check.addEventListener('change', () => {
    deps.onToggle(check.checked ? completeTask(task) : uncompleteTask(task));
  });
  const startBtn = row.querySelector<HTMLButtonElement>('.task-row__start');
  if (startBtn) startBtn.addEventListener('click', () => deps.onStart!(task));
  row.querySelector<HTMLButtonElement>('.task-row__delete')!.addEventListener('click', () => {
    deps.onDelete(task.id);
  });

  return row;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[ch]!));
}
