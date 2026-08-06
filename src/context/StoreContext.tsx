import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AppState, DiaryEntry, Note, Profile, User } from '@/lib/types';
import type { MoneyState } from '@/lib/money/types';
import { ensureUser, getActiveUser, loadState, saveState, uid, hash, fileToData, loadTheme, saveTheme, emptyMoney } from '@/lib/store';

type Ctx = {
  state: AppState;
  user: User | null;
  theme: 'light' | 'dark';
  refresh: () => void;
  login: (id: string, pass: string) => string | null;
  logout: () => void;
  signup: (name: string, pass: string, avatarFile?: File | null) => Promise<string | null>;
  patchProfile: (p: Partial<Profile>) => void;
  patchEntry: (date: string, patch: Partial<DiaryEntry>) => void;
  setNotes: (notes: Note[]) => void;
  setMoney: (money: MoneyState | ((prev: MoneyState) => MoneyState)) => void;
  setProgressNotes: (text: string) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toast: (msg: string) => void;
  toastMsg: string;
};

const StoreContext = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadState());
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => loadTheme());
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    saveTheme(theme);
  }, [theme]);

  const persist = useCallback((next: AppState) => {
    saveState(next);
    setState({ ...next, users: { ...next.users } });
  }, []);

  const refresh = useCallback(() => setState(loadState()), []);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 1800);
  }, []);

  const setTheme = useCallback((t: 'light' | 'dark') => {
    setThemeState(t);
    const s = loadState();
    const u = getActiveUser(s);
    if (u) {
      u.theme = t;
      persist(s);
    }
  }, [persist]);

  const login = useCallback((id: string, pass: string) => {
    const s = loadState();
    const u = s.users[id];
    if (!u || u.pass !== hash(pass)) return 'Wrong password';
    s.active = id;
    persist(s);
    if (u.theme === 'dark' || u.theme === 'light') setThemeState(u.theme);
    return null;
  }, [persist]);

  const logout = useCallback(() => {
    const s = loadState();
    s.active = null;
    persist(s);
  }, [persist]);

  const signup = useCallback(async (name: string, pass: string, avatarFile?: File | null) => {
    if (!name.trim() || !pass) return 'Name & password required';
    const s = loadState();
    const id = uid();
    let avatar = '';
    if (avatarFile) avatar = await fileToData(avatarFile);
    s.users[id] = {
      id, name: name.trim(), pass: hash(pass), avatar,
      ledger: {}, notes: [], profile: { fullName: name.trim() },
      money: emptyMoney(), theme: 'light', progressNotes: '',
      createdAt: Date.now(),
    };
    s.active = id;
    persist(s);
    setThemeState('light');
    return null;
  }, [persist]);

  const patchProfile = useCallback((p: Partial<Profile>) => {
    const s = loadState();
    const u = getActiveUser(s);
    if (!u) return;
    u.profile = { ...u.profile, ...p };
    persist(s);
  }, [persist]);

  const patchEntry = useCallback((date: string, patch: Partial<DiaryEntry>) => {
    const s = loadState();
    const u = getActiveUser(s);
    if (!u) return;
    u.ledger[date] = { ...(u.ledger[date] || {}), ...patch, updatedAt: Date.now() };
    persist(s);
  }, [persist]);

  const setNotes = useCallback((notes: Note[]) => {
    const s = loadState();
    const u = getActiveUser(s);
    if (!u) return;
    u.notes = notes;
    persist(s);
  }, [persist]);

  const setMoney = useCallback((money: MoneyState | ((prev: MoneyState) => MoneyState)) => {
    const s = loadState();
    const u = getActiveUser(s);
    if (!u) return;
    const prev = u.money || emptyMoney();
    u.money = typeof money === 'function' ? money(prev) : money;
    persist(s);
  }, [persist]);

  const setProgressNotes = useCallback((text: string) => {
    const s = loadState();
    const u = getActiveUser(s);
    if (!u) return;
    u.progressNotes = text;
    persist(s);
  }, [persist]);

  const user = useMemo(() => {
    const u = getActiveUser(state);
    return u ? ensureUser(u) : null;
  }, [state]);

  const value = useMemo(() => ({
    state, user, theme, refresh, login, logout, signup, patchProfile, patchEntry, setNotes,
    setMoney, setProgressNotes, setTheme, toast, toastMsg,
  }), [state, user, theme, refresh, login, logout, signup, patchProfile, patchEntry, setNotes, setMoney, setProgressNotes, setTheme, toast, toastMsg]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore outside provider');
  return ctx;
}
