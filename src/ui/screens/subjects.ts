import { effect } from '@/reactive/signal';
import type { Store } from '@/domain/store';
import type { Router } from '@/ui/router';
import type { Subject, Task } from '@/domain/types';
import { openModal } from '@/ui/widgets/modal';
import { SUBJECT_PALETTE } from '@/domain/types';

export function renderSubjects(host: HTMLElement, store: Store, _router: Router): () => void {
  host.innerHTML = `
    <section class="subjects">
      <header class="subjects__header">
        <h2>Subjects</h2>
        <button class="btn btn--primary" id="add-subject">+ New subject</button>
      </header>
      <div id="subject-grid" class="subject-grid"></div>
    </section>
  `;
  host.querySelector<HTMLButtonElement>('#add-subject')!.addEventListener('click', () => openSubjectModal(store));

  const stop = effect(() => renderGrid(host, store));
  return () => { stop(); host.innerHTML = ''; };
}

function renderGrid(host: HTMLElement, store: Store): void {
  const grid = host.querySelector<HTMLElement>('#subject-grid');
  if (!grid) return;
  const subjects = store.subjects();
  const tasks = store.tasks();
  if (subjects.length === 0) {
    grid.innerHTML = `<div class="empty-state">No subjects yet. Add one to start grouping tasks.</div>`;
    return;
  }
  grid.innerHTML = subjects.map(s => renderCard(s, tasks.filter(t => t.subjectId === s.id))).join('');
}

function renderCard(s: Subject, tasks: Task[]): string {
  const total = tasks.length;
  const done = tasks.filter(t => t.completedAt !== null).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return `
    <article class="subject-card" style="--subject-color:${s.color}">
      <header><span class="subject-card__pin"></span><h3>${escapeHtml(s.name)}</h3></header>
      <div class="subject-card__meta">${done} / ${total} tasks done</div>
      <div class="progress"><div class="progress__bar" style="width:${pct}%"></div></div>
    </article>
  `;
}

function openSubjectModal(store: Store): void {
  const form = document.createElement('form');
  form.className = 'subject-form';
  form.innerHTML = `
    <h2>New subject</h2>
    <label>Name<input name="name" required autofocus /></label>
    <fieldset class="color-picker">
      <legend>Color</legend>
      ${SUBJECT_PALETTE.map((c, i) => `
        <label><input type="radio" name="color" value="${c}" ${i === 0 ? 'checked' : ''} /><span style="background:${c}"></span></label>
      `).join('')}
    </fieldset>
    <div class="task-form__actions">
      <button type="button" class="btn" data-action="cancel">Cancel</button>
      <button type="submit" class="btn btn--primary">Save</button>
    </div>
  `;
  const handle = openModal(form);
  form.querySelector<HTMLButtonElement>('[data-action="cancel"]')!.addEventListener('click', () => handle.close());
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const name = (fd.get('name') as string).trim();
    const color = (fd.get('color') as string) ?? SUBJECT_PALETTE[0];
    if (!name) return;
    const subject: Subject = { id: crypto.randomUUID(), name, color, createdAt: Date.now() };
    store.subjects.set([...store.subjects(), subject]);
    handle.close();
  });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]!));
}
