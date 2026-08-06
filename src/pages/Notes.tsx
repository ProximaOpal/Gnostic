import { useEffect, useMemo, useState } from 'react';
import { Shell } from '@/components/Shell';
import { ModeToggle } from '@/components/ModeToggle';
import { useStore } from '@/context/StoreContext';
import { uid } from '@/lib/store';
import type { Note } from '@/lib/types';

export function NotesPage() {
  const { user, setNotes, toast } = useStore();
  const [q, setQ] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pane, setPane] = useState<'list' | 'editor'>('list');
  const notes = user?.notes || [];

  const filtered = useMemo(() => {
    const list = [...notes].sort((a, b) => b.updatedAt - a.updatedAt);
    if (!q.trim()) return list;
    const s = q.toLowerCase();
    return list.filter((n) => `${n.title} ${n.body} ${n.tag}`.toLowerCase().includes(s));
  }, [notes, q]);

  const visible = filtered.slice(0, 8);
  const active = notes.find((n) => n.id === activeId) || null;

  function create() {
    const n: Note = { id: uid('n'), title: '', body: '', tag: '', createdAt: Date.now(), updatedAt: Date.now() };
    setNotes([n, ...notes]);
    setActiveId(n.id);
    setPane('editor');
  }

  function patch(partial: Partial<Note>) {
    if (!active) return;
    setNotes(notes.map((n) => n.id === active.id ? { ...n, ...partial, updatedAt: Date.now() } : n));
  }

  function remove() {
    if (!active || !confirm('Delete this note?')) return;
    setNotes(notes.filter((n) => n.id !== active.id));
    setActiveId(null);
    setPane('list');
    toast('Note deleted');
  }

  useEffect(() => {
    if (activeId && !notes.some((n) => n.id === activeId)) setActiveId(null);
  }, [notes, activeId]);

  return (
    <Shell onSearch={setQ} searchPlaceholder="Search notes…">
      <div className="gx-page">
        <div className="gx-page-head" style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div>
            <h2>Notes</h2>
            <p className="sub">Freeform observations — autosaved.</p>
          </div>
          <button type="button" className="gx-btn gx-btn-primary" onClick={create}>New note</button>
        </div>
        <div className="notes-mobile-toggle" style={{ flexShrink: 0 }}>
          <ModeToggle
            value={pane}
            onChange={(id) => setPane(id as 'list' | 'editor')}
            options={[
              { id: 'list', label: 'List' },
              { id: 'editor', label: 'Editor' },
            ]}
          />
        </div>
        <div className={`gx-notes-layout is-${pane}`}>
          <div className="gx-note-list">
            {visible.length === 0 && <div className="gx-card" style={{ textAlign: 'center', color: 'var(--ink-soft)' }}>No notes yet</div>}
            {visible.map((n) => (
              <button
                key={n.id}
                type="button"
                className={`gx-note-item ${n.id === activeId ? 'on' : ''}`}
                onClick={() => { setActiveId(n.id); setPane('editor'); }}
              >
                <div>
                  <strong style={{ display: 'block', fontSize: 13 }}>{n.title || 'Untitled'}</strong>
                  <span style={{ fontSize: 11, color: 'var(--ink-soft)' }}>{(n.body || n.tag || 'Empty').slice(0, 60)}</span>
                </div>
                <time style={{ fontSize: 10, color: 'var(--ink-soft)' }}>
                  {new Date(n.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </time>
              </button>
            ))}
            {filtered.length > visible.length && (
              <p style={{ fontSize: 11, color: 'var(--ink-soft)', padding: '4px 2px' }}>
                +{filtered.length - visible.length} more — refine search
              </p>
            )}
          </div>
          <div className="gx-note-editor">
            {!active ? (
              <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--ink-soft)', fontSize: 13 }}>Select a note or write a new one.</div>
            ) : (
              <>
                <input className="title" value={active.title} placeholder="Title" onChange={(e) => patch({ title: e.target.value })} />
                <textarea className="body" value={active.body} placeholder="Observations, insights, teachings…" onChange={(e) => patch({ body: e.target.value })} />
                <div className="gx-field" style={{ marginTop: 6, flexShrink: 0 }}>
                  <label>Tag</label>
                  <input value={active.tag} placeholder="dream · study · insight · money…" onChange={(e) => patch({ tag: e.target.value })} />
                </div>
                <div className="gx-btn-row" style={{ marginTop: 6, flexShrink: 0 }}>
                  <span className="gx-pill">Autosave</span>
                  <button type="button" className="gx-btn gx-btn-ghost" onClick={remove}>Delete</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Shell>
  );
}
