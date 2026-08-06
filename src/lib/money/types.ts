export type MoneyCategory =
  | 'food'
  | 'transport'
  | 'data'
  | 'bills'
  | 'transfer'
  | 'cash'
  | 'loan'
  | 'shopping'
  | 'salary'
  | 'fees'
  | 'other';

export type MoneyPlace = {
  name: string;
  lat: number;
  lng: number;
  source: 'pin' | 'location' | 'nominatim' | 'photon' | 'biased' | 'manual';
};

export type MoneyTx = {
  id: string;
  receipt: string;
  time: string; // ISO-ish from statement
  details: string;
  status: string;
  paidIn: number;
  withdrawn: number;
  balance: number;
  category: MoneyCategory;
  merchant: string;
  place?: MoneyPlace;
  photo?: string;
  emoji: string;
  avatar: string;
  noteId?: string;
};

export type MoneyInsight = {
  id: string;
  title: string;
  body: string;
  severity: 'calm' | 'watch' | 'alert';
  emoji: string;
};

export type MoneyState = {
  txs: MoneyTx[];
  importedAt?: number;
  period?: string;
  summary?: {
    paidIn: number;
    paidOut: number;
    byType: Record<string, { in: number; out: number }>;
  };
  dark?: boolean;
  chartRange: 'day' | 'week' | 'month' | 'quarter' | 'year' | 'all';
  tableRange: 'week' | 'month' | 'quarter';
  progressNotes: string;
  geoDone?: boolean;
};

export const CATEGORY_META: Record<MoneyCategory, { label: string; emoji: string; color: string; photo: string }> = {
  food: {
    label: 'Food',
    emoji: '🟩',
    color: '#06c97a',
    photo: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=60',
  },
  transport: {
    label: 'Transport',
    emoji: '🟦',
    color: '#0894ce',
    photo: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=400&q=60',
  },
  data: {
    label: 'Data',
    emoji: '🟪',
    color: '#7c5cff',
    photo: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=400&q=60',
  },
  bills: {
    label: 'Bills',
    emoji: '🟨',
    color: '#c9a227',
    photo: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=400&q=60',
  },
  transfer: {
    label: 'Transfer',
    emoji: '🟧',
    color: '#e89a3c',
    photo: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=400&q=60',
  },
  cash: {
    label: 'Cash',
    emoji: '⬛',
    color: '#3a3f4b',
    photo: 'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?auto=format&fit=crop&w=400&q=60',
  },
  loan: {
    label: 'Loan',
    emoji: '🟥',
    color: '#e85d4c',
    photo: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=400&q=60',
  },
  shopping: {
    label: 'Shopping',
    emoji: '🟫',
    color: '#8b6914',
    photo: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=400&q=60',
  },
  salary: {
    label: 'Income',
    emoji: '💚',
    color: '#00f78e',
    photo: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=400&q=60',
  },
  fees: {
    label: 'Fees',
    emoji: '⬜',
    color: '#9aa0a6',
    photo: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=400&q=60',
  },
  other: {
    label: 'Other',
    emoji: '▫️',
    color: '#6b7280',
    photo: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=400&q=60',
  },
};

export const CARTOON_AVATARS = [
  '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵',
  '🐔', '🐧', '🐦', '🦄', '🐙', '🦋', '🐝', '🐢', '🦉', '🐲',
];
