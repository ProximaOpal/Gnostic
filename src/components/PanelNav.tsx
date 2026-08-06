import { Link, useLocation } from 'wouter';
import {
  Home, BookOpen, NotebookPen, Sparkles, Wallet, Camera, Search, ChartLine, UserRound,
} from 'lucide-react';

export const NAV = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/diary', label: 'Diary', icon: BookOpen },
  { href: '/notes', label: 'Notes', icon: NotebookPen },
  { href: '/psyche', label: 'Psyche', icon: Sparkles },
  { href: '/money', label: 'Money', icon: Wallet },
  { href: '/photos', label: 'Photos', icon: Camera },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/trends', label: 'Trends', icon: ChartLine },
  { href: '/you', label: 'You', icon: UserRound },
] as const;

export function PanelNav() {
  const [loc] = useLocation();
  return (
    <div className="gx-pnav">
      {NAV.map(({ href, label, icon: Icon }) => {
        const on = href === '/' ? loc === '/' : loc.startsWith(href);
        return (
          <Link key={href} href={href} title={label} className={on ? 'on' : ''}>
            <Icon size={13} />
          </Link>
        );
      })}
    </div>
  );
}

export function MobileNav() {
  const [loc] = useLocation();
  return (
    <nav className="gx-mnav">
      {NAV.map(({ href, label, icon: Icon }) => {
        const on = href === '/' ? loc === '/' : loc.startsWith(href);
        return (
          <Link key={href} href={href} className={on ? 'on' : ''}>
            <Icon size={16} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
