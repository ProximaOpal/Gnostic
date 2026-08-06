import { useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { Shell } from '@/components/Shell';
import { ModeToggle } from '@/components/ModeToggle';
import { useStore } from '@/context/StoreContext';

type ResultTab = 'guides' | 'ledger';

export function SearchPage() {
  const { user } = useStore();
  const [, setLoc] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const [q, setQ] = useState(params.get('q') || '');
  const [tab, setTab] = useState<ResultTab>('guides');

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    const entries: { date: string; snip: string }[] = [];
    Object.entries(user?.ledger || {}).forEach(([date, row]) => {
      const blob = JSON.stringify(row).toLowerCase();
      if (!s || blob.includes(s) || date.includes(s)) {
        const vals = Object.values(row).filter((v) => typeof v === 'string' && v).join(' · ');
        entries.push({ date, snip: vals.slice(0, 120) || 'Logged day' });
      }
    });
    entries.sort((a, b) => b.date.localeCompare(a.date));
    const notes = (user?.notes || [])
      .filter((n) => !s || `${n.title} ${n.body} ${n.tag}`.toLowerCase().includes(s))
      .map((n) => ({ id: n.id, title: n.title || 'Untitled', snip: (n.body || '').slice(0, 100) }));
    const psyche = !s || 'numerology chaldean tarot planet astrology psyche'.includes(s) || JSON.stringify(user?.profile || {}).toLowerCase().includes(s);
    const money = !s || 'money mpesa spend cash transfer'.includes(s) || (user?.money?.txs?.length || 0) > 0;
    return { entries, notes, psyche, money };
  }, [q, user]);

  const entrySlice = results.entries.slice(0, 6);
  const noteSlice = results.notes.slice(0, 4);

  const leftExtra = (
    <div className="gx-left-extra">
      <div className="gx-left-search">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ask anything about your practice…"
        />
      </div>
      <p style={{ fontSize: 11, color: 'rgba(255,255,255,.55)', marginTop: 8 }}>
        Glorian Search — guidance, diary, notes, psyche, money.
      </p>
    </div>
  );

  return (
    <Shell leftExtra={leftExtra} hideGlobalSearch>
      <div className="gx-page">
        <ModeToggle
          value={tab}
          onChange={(id) => setTab(id as ResultTab)}
          options={[
            { id: 'guides', label: 'Guides' },
            { id: 'ledger', label: 'Ledger' },
          ]}
        />

        <div className="gx-fill">
          {tab === 'guides' && (
            <div className="gx-card" style={{ padding: 14 }}>
              <strong style={{ fontSize: 14 }}>Spiritual Diary</strong>
              <p style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 6, lineHeight: 1.5 }}>
                A Daily Record of Observed Facts · Glorian · Follow Sivananda — observe yourself each day.
                Use the left panel to ask the ledger. Open Diary for Morning · Day · Night · Summary.
              </p>
              <div className="gx-btn-row" style={{ marginTop: 12 }}>
                <button type="button" className="gx-btn gx-btn-primary" onClick={() => setLoc('/diary')}>Open diary</button>
                <button type="button" className="gx-btn gx-btn-ghost" onClick={() => setLoc('/money')}>Money ledger</button>
              </div>
            </div>
          )}

          {tab === 'ledger' && (
            <div className="gx-feed">
              {results.psyche && (
                <button type="button" className="gx-card" style={{ width: '100%', textAlign: 'left' }} onClick={() => setLoc('/psyche')}>
                  <strong style={{ fontSize: 13 }}>Psyche intelligence</strong>
                  <p style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Numerology, planets, tarot, self-portrait</p>
                </button>
              )}
              {results.money && (
                <button type="button" className="gx-card" style={{ width: '100%', textAlign: 'left' }} onClick={() => setLoc('/money')}>
                  <strong style={{ fontSize: 13 }}>Money · M-PESA</strong>
                  <p style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{user?.money?.txs?.length || 0} transactions · map & psychoanalysis</p>
                </button>
              )}
              {noteSlice.map((n) => (
                <button key={n.id} type="button" className="gx-card" style={{ width: '100%', textAlign: 'left' }} onClick={() => setLoc('/notes')}>
                  <strong style={{ fontSize: 13 }}>{n.title}</strong>
                  <p style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{n.snip}</p>
                </button>
              ))}
              {entrySlice.map((e) => (
                <button key={e.date} type="button" className="gx-card" style={{ width: '100%', textAlign: 'left' }} onClick={() => setLoc('/diary')}>
                  <strong style={{ fontSize: 13 }}>{e.date}</strong>
                  <p style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{e.snip}</p>
                </button>
              ))}
              {!results.psyche && noteSlice.length === 0 && entrySlice.length === 0 && (
                <div className="gx-card" style={{ color: 'var(--ink-soft)', fontSize: 13 }}>
                  {q ? 'No ledger matches.' : 'Type a query in the left panel.'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
