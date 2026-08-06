import { Link } from 'wouter';
import { Shell } from '@/components/Shell';
import { useStore } from '@/context/StoreContext';
import { IMAGES } from '@/lib/types';
import { getDailyTarot, getDayRuler, calcNumerology } from '@/lib/cosmic';

const CARDS = [
  { href: '/diary', title: 'Diary', sub: 'Morning · Day · Night · Summary', img: IMAGES.dawn },
  { href: '/notes', title: 'Notes', sub: 'Freeform observations', img: IMAGES.notes },
  { href: '/psyche', title: 'Psyche', sub: 'Numbers · planets · tarot', img: IMAGES.cosmos },
  { href: '/money', title: 'Money', sub: 'M-PESA · map · spend', img: IMAGES.money },
  { href: '/search', title: 'Search', sub: 'Glorian + ledger', img: IMAGES.sum },
  { href: '/trends', title: 'Trends', sub: 'Analytics & charts', img: IMAGES.day },
  { href: '/you', title: 'You', sub: 'Profile & export', img: IMAGES.night },
];

export function HomePage() {
  const { user } = useStore();
  const tarot = getDailyTarot(user?.profile.dob, user?.profile.fullName || user?.name);
  const ruler = getDayRuler();
  const num = calcNumerology(user?.profile.dob, user?.profile.fullName || user?.name);

  return (
    <Shell>
      <div className="gx-page">
        <h2>Welcome back</h2>
        <p className="sub">A whip for goading the mind towards God — your daily spiritual ledger.</p>

        <div className="gx-btn-row" style={{ marginBottom: 10, flexShrink: 0 }}>
          <span className="gx-pill">{tarot.primary.emoji} {tarot.primary.name}</span>
          <span className="gx-pill">{ruler.emoji} {ruler.name} day</span>
          {num.personalDay ? <span className="gx-pill">Personal day {num.personalDay}</span> : null}
        </div>

        <div className="gx-fill">
          <div className="gx-card-grid" style={{ flex: 1, minHeight: 0, alignContent: 'stretch', gridAutoRows: 'minmax(0, 1fr)' }}>
            {CARDS.map((c) => (
              <Link key={c.href} href={c.href} className="gx-photo-card" style={{ minHeight: 0 }}>
                <div className="ph" style={{ backgroundImage: `url(${c.img})` }} />
                <div className="body" style={{ minHeight: 0 }}>
                  <strong>{c.title}</strong>
                  <span>{c.sub}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <blockquote className="gx-quote">
          “The diary is a whip for goading the mind towards God… It is your Guru.”
          <cite>— Swami Sivananda · via Glorian</cite>
        </blockquote>
      </div>
    </Shell>
  );
}
