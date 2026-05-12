import { effect } from '@/reactive/signal';
import { snapshot, replaceStore, type Store } from '@/domain/store';
import type { Router } from '@/ui/router';
import type { Settings } from '@/domain/types';
import { exportJSON, parseImport } from '@/domain/io';
import { exportICal } from '@/domain/ical';
import { toast } from '@/ui/toast';
import { NEW_KEY } from '@/domain/migrations';

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
        <fieldset>
          <legend>Data</legend>
          <p class="settings-hint" id="data-hint">
            Export a full backup of your tasks, sessions, and subjects.
            Importing replaces all current data — a backup is saved automatically.
          </p>
          <div class="settings-data-actions">
            <button type="button" id="btn-export-json">Export JSON</button>
            <label for="import-file" class="btn btn-secondary">Import JSON</label>
            <input
              type="file"
              id="import-file"
              accept=".json"
              aria-describedby="import-warning"
              class="sr-only"
            >
            <p id="import-warning" class="settings-hint">
              Warning: importing replaces all current data. Your existing data is backed up to localStorage first.
            </p>
            <button type="button" id="btn-export-ical">Export iCal (.ics)</button>
          </div>
        </fieldset>
      </form>
    </section>
  `;

  const form = host.querySelector<HTMLFormElement>('#settings-form')!;
  const stop = effect(() => fillForm(form, store.settings()));

  form.addEventListener('change', (e) => {
    const target = e.target as HTMLElement;
    if (target.id === 'import-file') return;
    const next = readForm(form, store.settings());
    store.settings.set(next);
  });

  host.querySelector('#btn-export-json')!.addEventListener('click', () => {
    const state = snapshot(store);
    triggerDownload(exportJSON(state), `studyflow-export-${isoDate()}.json`, 'application/json');
  });

  const fileInput = host.querySelector<HTMLInputElement>('#import-file')!;
  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const result = parseImport(text);
      if (!result.ok) {
        toast(`Import failed: ${result.reason}`, 'error');
        fileInput.value = '';
        return;
      }
      const current = localStorage.getItem(NEW_KEY) ?? '';
      if (current) localStorage.setItem(`studyflow:backup-${Date.now()}`, current);
      replaceStore(store, result.state);
      toast('Data imported successfully');
      fileInput.value = '';
    };
    reader.onerror = () => {
      toast('Failed to read file', 'error');
      fileInput.value = '';
    };
    reader.readAsText(file);
  });

  host.querySelector('#btn-export-ical')!.addEventListener('click', () => {
    triggerDownload(exportICal(store.tasks()), `studyflow-${isoDate()}.ics`, 'text/calendar');
  });

  return () => { stop(); host.innerHTML = ''; };
}

function triggerDownload(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function isoDate(): string {
  return new Date().toISOString().slice(0, 10);
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
