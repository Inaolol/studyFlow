import { effect } from '@/reactive/signal';
import type { Store } from '@/domain/store';
import type { Router } from '@/ui/router';
import type { Subject, Task } from '@/domain/types';
import { SUBJECT_PALETTE } from '@/domain/types';
import { openModal } from '@/ui/widgets/modal';

export function renderSubjects(host: HTMLElement, store: Store, _router: Router): () => void {
  host.innerHTML = `<main class="main subjects-main"></main>`;
  const stop = effect(() => render(host, store));
  return () => { stop(); host.innerHTML = ''; };
}

function render(host: HTMLElement, store: Store): void {
  const main = host.querySelector<HTMLElement>('.subjects-main');
  if (!main) return;

  const subjects = store.subjects();
  const tasks = store.tasks();
  const tasksBySubject = new Map<string, Task[]>();
  for (const s of subjects) tasksBySubject.set(s.id, []);
  for (const t of tasks) {
    if (t.subjectId !== null && tasksBySubject.has(t.subjectId)) {
      tasksBySubject.get(t.subjectId)!.push(t);
    }
  }

  const totalOpen = tasks.filter(t => t.completedAt === null).length;
  const totalMin = tasks
    .filter(t => t.completedAt === null)
    .reduce((s, t) => s + (t.estimatedMinutes ?? 0), 0);

  main.innerHTML = `
    <div class="page-head">
      <div>
        <h1>Subjects</h1>
        <div class="sub">${subjects.length} courses · ${totalOpen} open · ${Math.floor(totalMin / 60)}h of work ahead</div>
      </div>
      <button class="btn btn-primary" id="add-subject" type="button">
        ${iconPlus()} New subject
      </button>
    </div>

    <div class="subj-grid">
      ${subjects.map(s => subjectCard(s, tasksBySubject.get(s.id) ?? [])).join('')}
      <button class="add-subj-card" id="add-subject-card" type="button">
        <span class="plus">${iconPlus(18)}</span>
        <span style="font-weight:600;font-size:14px">Add a subject</span>
        <span style="font-size:12px">Group tasks by class</span>
      </button>
    </div>
  `;

  const openAddSubject = (): void => openSubjectModal(store);
  main.querySelector<HTMLButtonElement>('#add-subject')?.addEventListener('click', openAddSubject);
  main.querySelector<HTMLButtonElement>('#add-subject-card')?.addEventListener('click', openAddSubject);
}

function subjectCard(s: Subject, tasks: Task[]): string {
  const total = tasks.length;
  const done = tasks.filter(t => t.completedAt !== null).length;
  const pct = total === 0 ? 0 : (done / total) * 100;
  const upcoming = tasks
    .filter(t => t.completedAt === null && t.dueAt !== null)
    .sort((a, b) => (a.dueAt ?? 0) - (b.dueAt ?? 0))[0];
  const totalMin = tasks
    .filter(t => t.completedAt === null)
    .reduce((sum, t) => sum + (t.estimatedMinutes ?? 0), 0);

  return `
    <article class="subj-card" style="--subject-color:${s.color}">
      <div class="top-bar"></div>
      <div class="code">${escapeHtml(s.id.slice(0, 6).toUpperCase())}</div>
      <h3>${escapeHtml(s.name)}</h3>

      <div class="subj-stats">
        <div class="subj-stat"><div class="v">${total - done}</div><div class="l">Open</div></div>
        <div class="subj-stat"><div class="v">${done}</div><div class="l">Done</div></div>
        <div class="subj-stat"><div class="v">${Math.floor(totalMin / 60)}h</div><div class="l">Left</div></div>
      </div>

      <div class="progress-bar"><div style="width:${pct}%"></div></div>
      <div class="progress-text">
        <span>${Math.round(pct)}% complete</span>
        <span>${done} / ${total}</span>
      </div>

      <div class="next-task">
        <div class="lab">Next up</div>
        ${upcoming
          ? `<div class="nt-title">${escapeHtml(upcoming.title)}</div>
             <div class="nt-due">Due ${shortDate(upcoming.dueAt!)}${upcoming.estimatedMinutes ? ' · ' + upcoming.estimatedMinutes + 'm' : ''}</div>`
          : `<div class="nt-title" style="color:var(--neutral-gray)">All caught up.</div>`
        }
      </div>
    </article>
  `;
}

function openSubjectModal(store: Store): void {
  const form = document.createElement('form');
  form.className = 'subject-form';
  form.innerHTML = `
    <div class="modal-head">
      <h2 style="font-size:24px;margin:0">New subject</h2>
    </div>
    <div class="form-field">
      <label>Subject name</label>
      <input type="text" name="name" required autofocus placeholder="e.g. Organic Chemistry" />
    </div>
    <div class="form-field">
      <label>Color</label>
      <div class="color-pick">
        ${SUBJECT_PALETTE.map((c, i) => `
          <button type="button" data-color="${c}" class="${i === 0 ? 'selected' : ''}" style="background:${c}" aria-label="Color ${c}"></button>
        `).join('')}
      </div>
    </div>
    <div class="row gap-3" style="justify-content:flex-end;margin-top:8px">
      <button type="button" class="btn btn-secondary" data-action="cancel">Cancel</button>
      <button type="submit" class="btn btn-primary">Add subject</button>
    </div>
  `;
  const handle = openModal(form);

  let color: string = SUBJECT_PALETTE[0];
  form.querySelectorAll<HTMLButtonElement>('[data-color]').forEach(btn => {
    btn.addEventListener('click', () => {
      color = btn.dataset['color'] as string;
      form.querySelectorAll<HTMLButtonElement>('[data-color]').forEach(b => b.classList.toggle('selected', b === btn));
    });
  });

  form.querySelector<HTMLButtonElement>('[data-action="cancel"]')!.addEventListener('click', () => handle.close());
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const name = (fd.get('name') as string).trim();
    if (!name) return;
    const subject: Subject = { id: crypto.randomUUID(), name, color, createdAt: Date.now() };
    store.subjects.set([...store.subjects(), subject]);
    handle.close();
  });
}

function iconPlus(size = 14): string {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>`;
}

function shortDate(epoch: number): string {
  return new Date(epoch).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]!));
}
