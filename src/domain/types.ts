export type ID = string;

export interface Subject {
  id: ID;
  name: string;
  color: string;       // hex like '#E34432'
  createdAt: number;
}

export interface Task {
  id: ID;
  subjectId: ID | null;
  title: string;
  notes?: string;
  dueAt: number | null;        // local-midnight epoch ms
  completedAt: number | null;
  estimatedMinutes?: number;
  createdAt: number;
}

export interface Session {
  id: ID;
  taskId: ID | null;
  subjectId: ID | null;
  startedAt: number;
  endedAt: number;
  durationMs: number;
  kind: 'work' | 'short-break' | 'long-break';
  completed: boolean;
}

export type Theme = 'system' | 'light' | 'dark';
export type ReducedMotionPref = 'system' | 'on' | 'off';
export type WeekStart = 0 | 1;

export interface Settings {
  theme: Theme;
  pomodoro: {
    workMin: number;
    shortBreakMin: number;
    longBreakMin: number;
    longEvery: number;
  };
  reducedMotion: ReducedMotionPref;
  weekStartsOn: WeekStart;
}

export interface PersistedState {
  schemaVersion: number;
  subjects: Subject[];
  tasks: Task[];
  sessions: Session[];
  settings: Settings;
}

export const CURRENT_SCHEMA_VERSION = 1;

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  pomodoro: { workMin: 25, shortBreakMin: 5, longBreakMin: 15, longEvery: 4 },
  reducedMotion: 'system',
  weekStartsOn: 1,
};

export const SUBJECT_PALETTE = [
  '#E34432', '#497D7E', '#0F66AE', '#B05A8E',
  '#4C7A45', '#C77A2C', '#6B5BA8', '#D14F70',
] as const;
