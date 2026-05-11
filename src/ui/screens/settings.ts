import { effect } from '@/reactive/signal';
import type { Store } from '@/domain/store';
import type { Router } from '@/ui/router';
import type { Settings } from '@/domain/types';

export function renderSettings(host: HTMLElement, store: Store, _router: Router): () => void {
  host.innerHTML = `
    <section class="screen-settings">
      <h2>Settings</h2>
      <form class="settings-form" id="settings-form">
        <fieldset>
          <legend>Theme</legend>
          <label><input type="radio" name="theme" value="system"> System</label>
          <label><input type="radio" name="theme" value="light"> Light</label>
          <label><input type="radio" name="theme" value="dark"> Dark</label>
        </fieldset>
        <fieldset>
          <legend>Reduced motion</legend>
          <label><input type="radio" name="reducedMotion" value="system"> System</label>
          <label><input type="radio" name="reducedMotion" value="on"> On</label>
          <label><input type="radio" name="reducedMotion" value="off"> Off</label>
        </fieldset>
        <fieldset>
          <legend>Pomodoro durations (minutes)</legend>
          <label>Work <input type="number" name="workMin" min="1" max="120"></label>
          <label>Short break <input type="number" name="shortBreakMin" min="1" max="60"></label>
          <label>Long break <input type="number" name="longBreakMin" min="1" max="120"></label>
          <label>Long break every <input type="number" name="longEvery" min="2" max="12"> work blocks</label>
        </fieldset>
        <fieldset>
          <legend>Week starts on</legend>
          <label><input type="radio" name="weekStartsOn" value="0"> Sunday</label>
          <label><input type="radio" name="weekStartsOn" value="1"> Monday</label>
        </fieldset>
      </form>
    </section>
  `;

  const form = host.querySelector<HTMLFormElement>('#settings-form')!;
  const stop = effect(() => fillForm(form, store.settings()));

  form.addEventListener('change', () => {
    const next = readForm(form, store.settings());
    store.settings.set(next);
  });

  return () => { stop(); host.innerHTML = ''; };
}

function fillForm(form: HTMLFormElement, s: Settings): void {
  setRadio(form, 'theme', s.theme);
  setRadio(form, 'reducedMotion', s.reducedMotion);
  setRadio(form, 'weekStartsOn', String(s.weekStartsOn));
  setNum(form, 'workMin', s.pomodoro.workMin);
  setNum(form, 'shortBreakMin', s.pomodoro.shortBreakMin);
  setNum(form, 'longBreakMin', s.pomodoro.longBreakMin);
  setNum(form, 'longEvery', s.pomodoro.longEvery);
}

function readForm(form: HTMLFormElement, prev: Settings): Settings {
  const data = new FormData(form);
  return {
    theme: (data.get('theme') as Settings['theme']) ?? prev.theme,
    reducedMotion: (data.get('reducedMotion') as Settings['reducedMotion']) ?? prev.reducedMotion,
    weekStartsOn: Number(data.get('weekStartsOn')) === 0 ? 0 : 1,
    pomodoro: {
      workMin: clampInt(data.get('workMin'), 1, 120, prev.pomodoro.workMin),
      shortBreakMin: clampInt(data.get('shortBreakMin'), 1, 60, prev.pomodoro.shortBreakMin),
      longBreakMin: clampInt(data.get('longBreakMin'), 1, 120, prev.pomodoro.longBreakMin),
      longEvery: clampInt(data.get('longEvery'), 2, 12, prev.pomodoro.longEvery),
    },
  };
}

function setRadio(form: HTMLFormElement, name: string, value: string): void {
  const el = form.querySelector<HTMLInputElement>(`input[name="${name}"][value="${value}"]`);
  if (el) el.checked = true;
}
function setNum(form: HTMLFormElement, name: string, value: number): void {
  const el = form.querySelector<HTMLInputElement>(`input[name="${name}"]`);
  if (el) el.value = String(value);
}
function clampInt(raw: FormDataEntryValue | null, min: number, max: number, fallback: number): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(n)));
}
