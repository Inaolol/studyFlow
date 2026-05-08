import type { Store } from '@/domain/store';
import type { Router } from '@/ui/router';

function fmtDate(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function renderStep(num: string, title: string, text: string, visual: string): string {
  return `
    <div class="step-row">
      <div class="step-num">${num}</div>
      <div class="step-text">
        <h3>${title}</h3>
        <p>${text}</p>
      </div>
      <div class="step-visual">${visual}</div>
    </div>
  `;
}

function renderSubjectPills(): string {
  return `
    <div class="v-pills">
      <span class="tag tag-coral">Calculus</span>
      <span class="tag tag-teal">Biology</span>
      <span class="tag tag-blue">History</span>
      <span class="tag" style="color:var(--mauve);background:rgba(176,90,142,.08)">Literature</span>
      <span class="tag tag-green">Spanish</span>
    </div>
  `;
}

function renderMiniProgress(): string {
  return `
    <div class="v-progress">
      <div class="row completed"><span class="check checked"></span><span>Lab writeup - enzymes</span></div>
      <div class="row completed"><span class="check checked"></span><span>Read Hamlet, Act II</span></div>
      <div class="row completed"><span class="check checked"></span><span>Practice quiz - derivatives</span></div>
    </div>
  `;
}

function buildHTML(): string {
  const todayLabel = fmtDate(new Date());

  const checkedTasks = [
    { title: 'Read Ch. 12 - Mitochondrial DNA', tagClass: 'tag-teal', subject: 'Biology' },
    { title: 'Outline essay - Treaty of Versailles', tagClass: 'tag-blue', subject: 'History' },
    { title: 'Vocabulary - 20 new verbs', tagClass: 'tag-green', subject: 'Spanish' },
  ];

  const checkedRows = checkedTasks.map(({ title, tagClass, subject }) => `
    <div class="ck-row done">
      <span class="ck-box checked"></span>
      <span class="ck-title">${title}</span>
      <span class="tag ${tagClass}">${subject}</span>
    </div>
  `).join('');

  return `
    <section class="home-view">
      <section class="hero">
        <div class="blob blob-1"></div>
        <div class="blob blob-2"></div>
        <div class="blob blob-3"></div>
        <div class="hero-inner">
          <div class="hero-eyebrow"><span class="live-dot"></span>Built for students</div>
          <h1><span class="hero-line">Plan. Study.</span><span class="hero-line accent-word">Breathe.</span></h1>
          <p>One simple place for every assignment, deadline, and quiet win.</p>
          <div class="hero-ctas">
            <button class="btn btn-primary btn-lg" data-action="go-today" type="button">Start planning</button>
            <button class="btn btn-secondary btn-lg" data-scroll-target="how" type="button">See how</button>
          </div>
        </div>
        <button class="scroll-cue" data-scroll-target="task-preview" type="button" aria-label="Scroll to task preview">
          <span>Scroll</span>
          <span class="line"></span>
        </button>
      </section>

      <section class="check-section" id="task-preview" aria-label="Task completion preview">
        <div class="check-card">
          <div class="ck-head">
            <div>
              <div class="ck-day">${todayLabel}</div>
              <h3>Today</h3>
            </div>
            <div class="ck-pct">75% done</div>
          </div>
          ${checkedRows}
          <div class="ck-row">
            <span class="ck-box"></span>
            <span class="ck-title">Problem set 7 - integration by parts</span>
            <span class="tag tag-coral">Calculus</span>
          </div>
        </div>
      </section>

      <section class="rotator-section">
        <h2><span class="static">A planner that feels</span><span class="rotator-word">simple, calm, and ready.</span></h2>
      </section>

      <section class="how" id="how">
        <div class="how-inner">
          <h2>From <em>scattered</em> to sorted.</h2>
          ${renderStep('01', 'Add your subjects.', 'Each course gets a color. Your week becomes scannable at a glance.', renderSubjectPills())}
          ${renderStep('02', 'Drop in a task.', 'Title, subject, due date, priority, and estimate. Done in seconds.', `<div class="v-input">+ <span>Read Chapter 4 for History, due Friday</span></div>`)}
          ${renderStep('03', 'Check things off.', 'Progress updates across the dashboard, subjects, and calendar views.', renderMiniProgress())}
        </div>
      </section>

      <section class="cta">
        <h2>Your <em>calmer</em><br>semester starts now.</h2>
        <p>Free. No setup. Open and go.</p>
        <button class="btn btn-primary btn-lg" data-action="go-today" type="button">Start planning</button>
      </section>

      <footer class="footer">
        <div class="row gap-3"><span class="logo-mark" style="width:20px;height:20px"></span><span>StudyFlow - 2026</span></div>
      </footer>
    </section>
  `;
}

export function renderHome(host: HTMLElement, _store: Store, router: Router): () => void {
  host.innerHTML = buildHTML();

  function handleClick(e: Event) {
    const target = e.target as HTMLElement;
    const btn = target.closest<HTMLElement>('[data-action],[data-scroll-target]');
    if (!btn) return;

    const action = btn.dataset['action'];
    const scrollTarget = btn.dataset['scrollTarget'];

    if (action === 'go-today') {
      router.navigate('today');
    } else if (scrollTarget) {
      document.getElementById(scrollTarget)?.scrollIntoView({ behavior: 'smooth' });
    }
  }

  host.addEventListener('click', handleClick);

  return () => {
    host.removeEventListener('click', handleClick);
    host.innerHTML = '';
  };
}
