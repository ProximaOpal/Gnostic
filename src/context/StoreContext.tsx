import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { AppState, DiaryEntry, Note, Profile, User } from '@/lib/types';
import { ensureUser, getActiveUser, loadState, saveState, uid, hash, fileToData } from '@/lib/store';

type Ctx = {
  state: AppState;
  user: User | null;
  refresh: () => void;
  login: (id: string, pass: string) => string | null;
  logout: () => void;
  signup: (name: string, pass: string, avatarFile?: File | null) => Promise<string | null>;
  patchProfile: (p: Partial<Profile>) => void;
  patchEntry: (date: string, patch: Partial<DiaryEntry>) => void;
  setNotes: (notes: Note[]) => void;
  toast: (msg: string) => void;
  toastMsg: string;
};

const StoreContext = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadState());
  const [toastMsg, setToastMsg] = useState('');

  const persist = useCallback((next: AppState) => {
    saveState(next);
    setState({ ...next, users: { ...next.users } });
  }, []);

  const refresh = useCallback(() => setState(loadState()), []);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 1800);
  }, []);

  const login = useCallback((id: string, pass: string) => {
    const s = loadState();
    const u = s.users[id];
    if (!u || u.pass !== hash(pass)) return 'Wrong password';
    s.active = id;
    persist(s);
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
      ledger: {}, notes: [], profile: { fullName: name.trim() }, createdAt: Date.now(),
    };
    s.active = id;
    persist(s);
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

  const user = useMemo(() => {
    const u = getActiveUser(state);
    return u ? ensureUser(u) : null;
  }, [state]);

  const value = useMemo(() => ({
    state, user, refresh, login, logout, signup, patchProfile, patchEntry, setNotes, toast, toastMsg,
  }), [state, user, refresh, login, logout, signup, patchProfile, patchEntry, setNotes, toast, toastMsg]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore outside provider');
  return ctx;
}
