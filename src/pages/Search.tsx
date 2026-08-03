import { useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { Shell } from '@/components/Shell';
import { useStore } from '@/context/StoreContext';
import { IMAGES } from '@/lib/types';

const GUIDES = [
  { id: 'morning', title: 'Morning', img: IMAGES.dawn, q: 'sleep dreams practice' },
  { id: 'day', title: 'Day review', img: IMAGES.day, q: 'divinity study tongue service chastity diet mood mantra defect' },
  { id: 'night', title: 'Before bed', img: IMAGES.night, q: 'concentration meditation retrospect virtue obstacle' },
  { id: 'summary', title: 'Summary', img: IMAGES.sum, q: 'aware mechanical energy tomorrow' },
];

export function SearchPage() {
  const { user } = useStore();
  const [, setLoc] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const [q, setQ] = useState(params.get('q') || '');

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return { guides: GUIDES, entries: [] as { date: string; snip: string }[], notes: [] as { id: string; title: string; snip: string }[], psyche: false };
    const guides = GUIDES.filter((g) => g.title.toLowerCase().includes(s) || g.q.includes(s) || 'glorian spiritual diary sivananda'.includes(s));
    const entries: { date: string; snip: string }[] = [];
    Object.entries(user?.ledger || {}).forEach(([date, row]) => {
      const blob = JSON.stringify(row).toLowerCase();
      if (blob.includes(s) || date.includes(s)) {
        const vals = Object.values(row).filter((v) => typeof v === 'string' && v).join(' · ');
        entries.push({ date, snip: vals.slice(0, 120) || 'Logged day' });
      }
    });
    entries.sort((a, b) => b.date.localeCompare(a.date));
    const notes = (user?.notes || [])
      .filter((n) => `${n.title} ${n.body} ${n.tag}`.toLowerCase().includes(s))
      .map((n) => ({ id: n.id, title: n.title || 'Untitled', snip: (n.body || '').slice(0, 100) }));
    const psyche = 'numerology chaldean tarot planet astrology psyche'.includes(s) || JSON.stringify(user?.profile || {}).toLowerCase().includes(s);
    return { guides, entries, notes, psyche };
  }, [q, user]);

  return (
    <Shell onSearch={setQ}>
      <h2>Glorian Search</h2>
      <p className="sub">Search guidance, diary entries, notes, and psyche profile.</p>
      <div className="gx-search" style={{ maxWidth: '100%', marginBottom: 16 }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask anything about your practice…" />
      </div>

      {!q && (
        <div className="gx-card" style={{ marginBottom: 16 }}>
          <img src={IMAGES.notes} alt="" style={{ borderRadius: 12, aspectRatio: '16/9', objectFit: 'cover', width: '100%', marginBottom: 12 }} />
          <strong>Spiritual Diary</strong>
          <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 6 }}>
            A Daily Record of Observed Facts · Glorian · 24 Dec 2017. Follow Sivananda’s example — observe yourself objectively each day.
          </p>
        </div>
      )}

      <div className="gx-card-grid" style={{ marginBottom: 16 }}>
        {results.guides.map((g) => (
          <button key={g.id} className="gx-photo-card" onClick={() => setLoc('/diary')}>
            <div className="ph" style={{ backgroundImage: `url(${g.img})` }} />
            <div className="body"><strong>{g.title}</strong><span>Open diary phase</span></div>
          </button>
        ))}
      </div>

      {results.psyche && (
        <button className="gx-card" style={{ width: '100%', textAlign: 'left', marginBottom: 10 }} onClick={() => setLoc('/psyche')}>
          <strong>Psyche intelligence</strong>
          <p style={{ fontSize: 13, color: 'var(--ink-soft)' }}>Numerology, planets, tarot, self-portrait</p>
        </button>
      )}

      {results.notes.map((n) => (
        <button key={n.id} className="gx-card" style={{ width: '100%', textAlign: 'left', marginBottom: 8 }} onClick={() => setLoc('/notes')}>
          <strong>{n.title}</strong>
          <p style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{n.snip}</p>
        </button>
      ))}

      {results.entries.map((e) => (
        <button key={e.date} className="gx-card" style={{ width: '100%', textAlign: 'left', marginBottom: 8 }} onClick={() => setLoc('/diary')}>
          <strong>{e.date}</strong>
          <p style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{e.snip}</p>
        </button>
      ))}
    </Shell>
  );
}
