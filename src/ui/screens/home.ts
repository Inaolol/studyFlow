import type { Store } from '@/domain/store';
import type { Router } from '@/ui/router';

function fmtDate(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function renderStep(num: string, title: string, text: string, visual: string, id: string): string {
  return `
    <div class="step-row" id="${id}">
      <div class="step-num">${num}</div>
      <div class="step-text">
        <h3>${title}</h3>
        <p>${text}</p>
      </div>
      <div class="step-visual">${visual}</div>
    </div>
  `;
}

const PILL_VISUAL = `
  <div class="v-pills">
    <span class="pill tag tag-coral">Calculus</span>
    <span class="pill tag tag-teal">Biology</span>
    <span class="pill tag tag-blue">History</span>
    <span class="pill tag tag-mauve">Literature</span>
    <span class="pill tag tag-green">Spanish</span>
    <span class="pill tag tag-amber">Studio Art</span>
  </div>
`;

const INPUT_VISUAL = `
  <div class="v-input">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
    <span class="v-input__typed">Read Chapter 4 for History, due Friday</span>
    <span class="v-input__caret"></span>
  </div>
`;

const PROGRESS_VISUAL = `
  <div class="v-progress">
    <div class="v-progress__row"><span class="v-progress__ckb"></span><span class="v-progress__lbl">Lab writeup &mdash; enzymes</span></div>
    <div class="v-progress__row"><span class="v-progress__ckb"></span><span class="v-progress__lbl">Read Hamlet, Act II</span></div>
    <div class="v-progress__row"><span class="v-progress__ckb"></span><span class="v-progress__lbl">Practice quiz &mdash; derivatives</span></div>
  </div>
`;

function buildHTML(): string {
  const todayLabel = fmtDate(new Date());

  const previewTasks = [
    { title: 'Read Ch. 12 &mdash; Mitochondrial DNA', tagClass: 'tag-teal', subject: 'Biology' },
    { title: 'Outline essay &mdash; Treaty of Versailles', tagClass: 'tag-blue', subject: 'History' },
    { title: 'Vocabulary &mdash; 20 new verbs', tagClass: 'tag-green', subject: 'Spanish' },
    { title: 'Problem set 7 &mdash; integration by parts', tagClass: 'tag-coral', subject: 'Calculus' },
  ];

  const previewRows = previewTasks.map(({ title, tagClass, subject }, i) => `
    <div class="ck-row" data-row="${i + 1}">
      <span class="ck-box">
        <svg width="11" height="7" viewBox="0 0 11 7" fill="none" aria-hidden="true">
          <path d="M1 3.5 4 6.5 10 0.5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </span>
      <span class="ck-title">${title}</span>
      <span class="tag ${tagClass}">${subject}</span>
    </div>
  `).join('');

  return `
    <section class="home-view">
      <section class="hero">
        <div class="blob blob-1" aria-hidden="true"></div>
        <div class="blob blob-2" aria-hidden="true"></div>
        <div class="blob blob-3" aria-hidden="true"></div>
        <div class="hero-inner">
          <div class="hero-eyebrow"><span class="live-dot" aria-hidden="true"></span>Built for students</div>
          <h1 class="hero-title">
            <span class="word w1">Plan.</span>
            <span class="word w2">Study.</span>
            <span class="word w3">Breathe.</span>
          </h1>
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
        <div class="check-card" id="check-card">
          <div class="ck-head">
            <div>
              <div class="ck-day">${todayLabel}</div>
              <h3>Today</h3>
            </div>
            <div class="ck-pct" id="ck-pct">0% done</div>
          </div>
          ${previewRows}
        </div>
      </section>

      <section class="rotator-section">
        <h2>
          <span class="static">A planner that feels</span>
          <span class="rotator" id="rotator">
            <span class="rotator-track" id="rotator-track">
              <span class="rotator-word">simple.</span>
              <span class="rotator-word">calm.</span>
              <span class="rotator-word">yours.</span>
              <span class="rotator-word">ready.</span>
              <span class="rotator-word">simple.</span>
            </span>
          </span>
        </h2>
      </section>

      <section class="how" id="how">
        <div class="how-inner">
          <h2 class="how-title">From <em>scattered</em> to&nbsp;sorted.</h2>
          ${renderStep('01', 'Add your subjects.', 'Each course gets a color. Your week becomes scannable at a glance.', PILL_VISUAL, 'step1')}
          ${renderStep('02', 'Drop in a task.', "Title, subject, due date. That's it. Done in seconds.", INPUT_VISUAL, 'step2')}
          ${renderStep('03', 'Check things off.', 'Quiet feedback. Honest progress. No streaks-and-confetti theater.', PROGRESS_VISUAL, 'step3')}
        </div>
      </section>

      <section class="cta">
        <h2>Your <em>calmer</em><br>semester starts now.</h2>
        <p>Free. No setup. Open and go.</p>
        <button class="btn btn-primary btn-lg" data-action="go-today" type="button">Start planning</button>
      </section>

      <footer class="footer">
        <div class="row gap-3">
          <span class="logo-mark" style="width:20px;height:20px" aria-hidden="true"></span>
          <span>&copy; 2026 StudyFlow</span>
        </div>
      </footer>
    </section>
  `;
}

function setupCheckCardAnimation(host: HTMLElement): IntersectionObserver | null {
  const card = host.querySelector<HTMLElement>('#check-card');
  const pct = host.querySelector<HTMLElement>('#ck-pct');
  if (!card || !pct) return null;

  const rows = Array.from(card.querySelectorAll<HTMLElement>('.ck-row'));
  const total = rows.length;

  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      observer.disconnect();
      let done = 0;
      rows.forEach((row, i) => {
        window.setTimeout(() => {
          row.classList.add('done');
          row.querySelector('.ck-box')?.classList.add('checked');
          done++;
          pct.textContent = Math.round((done / total) * 100) + '% done';
        }, 600 + i * 550);
      });
    }
  }, { threshold: 0.4 });
  observer.observe(card);
  return observer;
}

function setupStepReveal(host: HTMLElement): IntersectionObserver | null {
  const steps = host.querySelectorAll<HTMLElement>('.step-row');
  if (steps.length === 0) return null;
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('in');
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.35 });
  steps.forEach(s => observer.observe(s));
  return observer;
}

function setupRotator(host: HTMLElement): number | null {
  const track = host.querySelector<HTMLElement>('#rotator-track');
  if (!track) return null;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return null;

  const words = track.children.length - 1;
  let idx = 0;
  const lineHeight = 1.05;

  const interval = window.setInterval(() => {
    idx++;
    track.style.transform = `translateY(-${idx * lineHeight}em)`;
    if (idx === words) {
      window.setTimeout(() => {
        track.style.transition = 'none';
        idx = 0;
        track.style.transform = 'translateY(0em)';
        // force reflow before re-enabling transition
        void track.offsetHeight;
        track.style.transition = '';
      }, 700);
    }
  }, 2200);
  return interval;
}

export function renderHome(host: HTMLElement, _store: Store, router: Router): () => void {
  host.innerHTML = buildHTML();
  document.body.classList.add('home-active');

  function handleClick(e: Event): void {
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

  const checkObserver = setupCheckCardAnimation(host);
  const stepObserver = setupStepReveal(host);
  const rotatorInterval = setupRotator(host);

  return () => {
    host.removeEventListener('click', handleClick);
    checkObserver?.disconnect();
    stepObserver?.disconnect();
    if (rotatorInterval !== null) window.clearInterval(rotatorInterval);
    document.body.classList.remove('home-active');
    host.innerHTML = '';
  };
}
