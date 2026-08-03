import { useEffect, useMemo, useState } from 'react';
import { Shell } from '@/components/Shell';
import { useStore } from '@/context/StoreContext';
import { uid } from '@/lib/store';
import type { Note } from '@/lib/types';

export function NotesPage() {
  const { user, setNotes, toast } = useStore();
  const [q, setQ] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const notes = user?.notes || [];

  const filtered = useMemo(() => {
    const list = [...notes].sort((a, b) => b.updatedAt - a.updatedAt);
    if (!q.trim()) return list;
    const s = q.toLowerCase();
    return list.filter((n) => `${n.title} ${n.body} ${n.tag}`.toLowerCase().includes(s));
  }, [notes, q]);

  const active = notes.find((n) => n.id === activeId) || null;

  function create() {
    const n: Note = { id: uid('n'), title: '', body: '', tag: '', createdAt: Date.now(), updatedAt: Date.now() };
    setNotes([n, ...notes]);
    setActiveId(n.id);
  }

  function patch(partial: Partial<Note>) {
    if (!active) return;
    setNotes(notes.map((n) => n.id === active.id ? { ...n, ...partial, updatedAt: Date.now() } : n));
  }

  function remove() {
    if (!active || !confirm('Delete this note?')) return;
    setNotes(notes.filter((n) => n.id !== active.id));
    setActiveId(null);
    toast('Note deleted');
  }

  useEffect(() => {
    if (activeId && !notes.some((n) => n.id === activeId)) setActiveId(null);
  }, [notes, activeId]);

  return (
    <Shell>
      <h2>Notes</h2>
      <p className="sub">Freeform spiritual observations — autosaved to your ledger.</p>
      <div className="gx-btn-row" style={{ marginBottom: 12 }}>
        <button className="gx-btn gx-btn-primary" onClick={create}>New note</button>
      </div>
      <div className="gx-search" style={{ maxWidth: '100%', marginBottom: 14 }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search notes…" />
      </div>
      <div className="gx-notes-layout">
        <div>
          {filtered.length === 0 && <div className="gx-card" style={{ textAlign: 'center', color: 'var(--ink-soft)' }}>No notes yet</div>}
          {filtered.map((n) => (
            <button key={n.id} className={`gx-note-item ${n.id === activeId ? 'on' : ''}`} onClick={() => setActiveId(n.id)}>
              <div>
                <strong style={{ display: 'block', fontSize: 14 }}>{n.title || 'Untitled'}</strong>
                <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{(n.body || n.tag || 'Empty').slice(0, 80)}</span>
              </div>
              <time style={{ fontSize: 11, color: 'var(--ink-soft)' }}>
                {new Date(n.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </time>
            </button>
          ))}
        </div>
        <div className="gx-note-editor">
          {!active ? (
            <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--ink-soft)' }}>Select a note or write a new one.</div>
          ) : (
            <>
              <input className="title" value={active.title} placeholder="Title" onChange={(e) => patch({ title: e.target.value })} />
              <textarea className="body" value={active.body} placeholder="Observations, insights, teachings…" onChange={(e) => patch({ body: e.target.value })} />
              <div className="gx-field" style={{ marginTop: 8 }}>
                <label>Tag</label>
                <input value={active.tag} placeholder="dream · study · insight…" onChange={(e) => patch({ tag: e.target.value })} />
              </div>
              <div className="gx-btn-row" style={{ marginTop: 8 }}>
                <span className="gx-pill">Autosave</span>
                <button className="gx-btn gx-btn-ghost" onClick={remove}>Delete</button>
              </div>
            </>
          )}
        </div>
      </div>
    </Shell>
  );
}
