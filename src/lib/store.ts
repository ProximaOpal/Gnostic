import type { AppState, DiaryEntry, Note, Profile, User } from './types';
import type { MoneyState } from './money/types';

const STORE = 'gnostic_v1';
const THEME_KEY = 'gnostic_theme';

export function loadTheme(): 'light' | 'dark' {
  try {
    const t = localStorage.getItem(THEME_KEY);
    return t === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function saveTheme(theme: 'light' | 'dark') {
  localStorage.setItem(THEME_KEY, theme);
  document.documentElement.setAttribute('data-theme', theme);
}

export function emptyMoney(): MoneyState {
  return {
    txs: [],
    chartRange: 'week',
    tableRange: 'week',
    progressNotes: '',
    dark: false,
  };
}

export function dateKey(d: Date | string = new Date()) {
  const x = d instanceof Date ? d : new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
}

export function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i) | 0;
  return 'h' + h;
}

export function uid(prefix = 'u') {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function loadState(): AppState {
  try {
    return JSON.parse(localStorage.getItem(STORE) || '') || { users: {}, active: null };
  } catch {
    return { users: {}, active: null };
  }
}

export function saveState(state: AppState) {
  localStorage.setItem(STORE, JSON.stringify(state));
}

export function ensureUser(u: User): User {
  if (!u.profile) u.profile = {};
  if (!u.ledger) u.ledger = {};
  if (!Array.isArray(u.notes)) u.notes = [];
  if (!Array.isArray(u.photos)) u.photos = [];
  if (!u.money) u.money = emptyMoney();
  if (!u.money.txs) u.money.txs = [];
  if (!u.money.chartRange) u.money.chartRange = 'week';
  if (!u.money.tableRange) u.money.tableRange = 'week';
  if (u.money.progressNotes == null) u.money.progressNotes = '';
  if (u.progressNotes == null) u.progressNotes = '';
  if (!u.theme) u.theme = 'light';
  return u;
}

export function getActiveUser(state: AppState): User | null {
  if (!state.active || !state.users[state.active]) return null;
  return ensureUser(state.users[state.active]);
}

export function getEntry(user: User, key: string): DiaryEntry {
  if (!user.ledger[key]) user.ledger[key] = {};
  return user.ledger[key];
}

export function fileToData(f: File): Promise<string> {
  return new Promise((res) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result || ''));
    r.readAsDataURL(f);
  });
}

export type StoreApi = {
  state: AppState;
  refresh: () => void;
  setActive: (id: string | null) => void;
  upsertUser: (u: User) => void;
  patchProfile: (p: Partial<Profile>) => void;
  patchEntry: (date: string, patch: Partial<DiaryEntry>) => void;
  setNotes: (notes: Note[]) => void;
};
