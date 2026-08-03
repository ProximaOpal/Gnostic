import type { CSSProperties, ReactNode } from 'react';
import { Search } from 'lucide-react';
import { useLocation } from 'wouter';
import { PanelNav, MobileNav } from './PanelNav';
import { useStore } from '@/context/StoreContext';
import { IMAGES } from '@/lib/types';
import { getDailyTarot, getDayRuler, calcNumerology } from '@/lib/cosmic';

const META: Record<string, { title: string; sub: string; photo: string; headline: ReactNode; chips: string[] }> = {
  '/': {
    title: 'Home',
    sub: 'Your daily spiritual command center',
    photo: IMAGES.hero,
    headline: <>Observe the <em>self</em></>,
    chips: ['#DIARY', '#SADHANA', '#GLORIAN'],
  },
  '/diary': {
    title: 'Diary',
    sub: 'Morning · Day · Night · Summary',
    photo: IMAGES.dawn,
    headline: <>Daily record of <em>facts</em></>,
    chips: ['#MORNING', '#REVIEW', '#RETROSPECT'],
  },
  '/notes': {
    title: 'Notes',
    sub: 'Freeform spiritual observations',
    photo: IMAGES.notes,
    headline: <>Write what <em>arises</em></>,
    chips: ['#INSIGHT', '#DREAM', '#STUDY'],
  },
  '/psyche': {
    title: 'Psyche',
    sub: 'Chaldean · planets · tarot · profile',
    photo: IMAGES.cosmos,
    headline: <>Map your <em>inner</em> cosmos</>,
    chips: ['#NUMBERS', '#TAROT', '#PLANETS'],
  },
  '/search': {
    title: 'Search',
    sub: 'Glorian guidance + your ledger',
    photo: IMAGES.sum,
    headline: <>Ask the <em>ledger</em></>,
    chips: ['#GLORIAN', '#PATTERNS'],
  },
  '/trends': {
    title: 'Trends',
    sub: 'Sadhana analytics & charts',
    photo: IMAGES.day,
    headline: <>See the <em>pulse</em></>,
    chips: ['#AWARE', '#DEFECTS', '#CHARTS'],
  },
  '/you': {
    title: 'You',
    sub: 'Profile, export, logout',
    photo: IMAGES.night,
    headline: <>Your <em>practice</em></>,
    chips: ['#PROFILE', '#EXPORT'],
  },
};

export function Shell({ children, onSearch }: { children: ReactNode; onSearch?: (q: string) => void }) {
  const [loc, setLoc] = useLocation();
  const { user } = useStore();
  const key = Object.keys(META).find((k) => (k === '/' ? loc === '/' : loc.startsWith(k))) || '/';
  const meta = META[key];
  const num = calcNumerology(user?.profile.dob, user?.profile.fullName || user?.name);
  const tarot = getDailyTarot(user?.profile.dob, user?.profile.fullName || user?.name);
  const ruler = getDayRuler();
  const days = Object.keys(user?.ledger || {}).length;
  const progress = Math.min(100, days * 5 + (user?.profile.dob ? 20 : 0));

  return (
    <div className="gx-shell">
      <aside className="gx-left">
        <div className="gx-left-bg" />
        <div className="gx-left-photo" style={{ backgroundImage: `url(${meta.photo})` }} />
        <div className="gx-brand">Gnostic<span>.</span></div>
        <PanelNav />
        <div className="gx-progress"><i style={{ ['--p' as string]: `${progress}%` } as CSSProperties} /></div>
        <div className="gx-chips">
          {meta.chips.map((c) => <span key={c} className="gx-chip">{c}</span>)}
          <span className="gx-chip">{tarot.primary.emoji} {tarot.primary.name}</span>
          <span className="gx-chip">{ruler.emoji} {ruler.name}</span>
          {num.personalDay ? <span className="gx-chip">PD {num.personalDay}</span> : null}
        </div>
        <h1>{meta.headline}</h1>
        <p className="byline">{meta.sub}</p>
        <div className="gx-left-foot">
          {user ? `${user.name} · ${days} days logged` : 'Spiritual diary protocol'}
        </div>
      </aside>

      <main className="gx-right">
        <div className="gx-right-head">
          <div className="gx-search">
            <Search size={16} color="rgba(23,24,28,.38)" />
            <input
              placeholder="Search diary, notes, Glorian…"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const q = (e.target as HTMLInputElement).value;
                  if (onSearch) onSearch(q);
                  else setLoc(`/search?q=${encodeURIComponent(q)}`);
                }
              }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>Hi, {user?.name}</span>
            <div className="gx-avatar" style={{ width: 36, height: 36, margin: 0 }}>
              {user?.avatar ? <img src={user.avatar} alt="" /> : (user?.name?.[0] || 'G')}
            </div>
          </div>
        </div>
        <div className="gx-section-label">{meta.title}</div>
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
