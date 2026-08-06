import type { MoneyInsight, MoneyTx } from './types';
import { CATEGORY_META } from './types';

function hourOf(tx: MoneyTx) {
  const h = Number(tx.time.slice(11, 13));
  return Number.isFinite(h) ? h : 12;
}

function dayKey(tx: MoneyTx) {
  return tx.time.slice(0, 10);
}

export function analyzeMoney(txs: MoneyTx[]): MoneyInsight[] {
  if (!txs.length) {
    return [{ id: 'empty', title: 'No ledger yet', body: 'Import your M-PESA statement to begin financial psychoanalysis.', severity: 'calm', emoji: '🟪' }];
  }

  const out = txs.filter((t) => t.withdrawn > 0);
  const inn = txs.filter((t) => t.paidIn > 0);
  const spent = out.reduce((s, t) => s + t.withdrawn, 0);
  const earned = inn.reduce((s, t) => s + t.paidIn, 0);
  const byCat: Record<string, number> = {};
  out.forEach((t) => { byCat[t.category] = (byCat[t.category] || 0) + t.withdrawn; });
  const topCat = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0];

  const night = out.filter((t) => { const h = hourOf(t); return h >= 22 || h < 5; });
  const nightSpend = night.reduce((s, t) => s + t.withdrawn, 0);
  const fees = out.filter((t) => t.category === 'fees').reduce((s, t) => s + t.withdrawn, 0);
  const loans = txs.filter((t) => t.category === 'loan');
  const loanOut = loans.filter((t) => t.withdrawn > 0).reduce((s, t) => s + t.withdrawn, 0);
  const dataSpend = byCat.data || 0;
  const foodSpend = byCat.food || 0;
  const transferSpend = byCat.transfer || 0;

  const byDay: Record<string, number> = {};
  out.forEach((t) => { const k = dayKey(t); byDay[k] = (byDay[k] || 0) + t.withdrawn; });
  const days = Object.values(byDay);
  const avgDay = days.length ? days.reduce((a, b) => a + b, 0) / days.length : 0;
  const spikeDay = Object.entries(byDay).sort((a, b) => b[1] - a[1])[0];

  const insights: MoneyInsight[] = [];

  insights.push({
    id: 'flow',
    title: 'Cash flow pulse',
    body: `Paid in KES ${earned.toLocaleString()} · paid out KES ${spent.toLocaleString()}. Net ${earned - spent >= 0 ? 'surplus' : 'deficit'} of KES ${Math.abs(earned - spent).toLocaleString()}.`,
    severity: earned >= spent ? 'calm' : 'watch',
    emoji: earned >= spent ? '🟩' : '🟧',
  });

  if (topCat) {
    const meta = CATEGORY_META[topCat[0] as keyof typeof CATEGORY_META];
    insights.push({
      id: 'topcat',
      title: `${meta?.label || topCat[0]} dominates outflow`,
      body: `${meta?.emoji || '▫️'} KES ${topCat[1].toLocaleString()} (${Math.round((topCat[1] / Math.max(spent, 1)) * 100)}% of spend). Ask: did this serve need, habit, or avoidance?`,
      severity: topCat[1] / Math.max(spent, 1) > 0.35 ? 'watch' : 'calm',
      emoji: meta?.emoji || '▫️',
    });
  }

  if (night.length > 5) {
    insights.push({
      id: 'night',
      title: 'Night-owl leakage',
      body: `${night.length} transactions after 22:00 / before 05:00 totaling KES ${nightSpend.toLocaleString()}. Late spend often tracks fatigue, loneliness, or urgency — notice the feeling before the till.`,
      severity: nightSpend > avgDay * 3 ? 'alert' : 'watch',
      emoji: '🟪',
    });
  }

  if (fees > 500) {
    insights.push({
      id: 'fees',
      title: 'Fee friction tax',
      body: `Transfer / withdrawal / paybill charges sum to KES ${fees.toLocaleString()}. Batching sends and preferring till/paybill where free cuts unconscious drip.`,
      severity: 'watch',
      emoji: '⬜',
    });
  }

  if (loans.length > 3 || loanOut > 1000) {
    insights.push({
      id: 'fuliza',
      title: 'Credit shadow (Fuliza / OD)',
      body: `${loans.length} loan-related lines · KES ${loanOut.toLocaleString()} linked to overdraw patterns. Psychologically: future-self borrowing to soothe present scarcity. Name the trigger before the next float.`,
      severity: 'alert',
      emoji: '🟥',
    });
  }

  if (dataSpend > 0) {
    insights.push({
      id: 'data',
      title: 'Attention fuel (data)',
      body: `KES ${dataSpend.toLocaleString()} on data/airtime plans. Digital bandwidth is psychic bandwidth — track whether top-ups follow boredom or purpose.`,
      severity: 'calm',
      emoji: '🟪',
    });
  }

  if (foodSpend > 0) {
    insights.push({
      id: 'food',
      title: 'Nourishment vs reward',
      body: `Food/merchant food-like spend ≈ KES ${foodSpend.toLocaleString()}. Journal one line after each meal buy: hunger, reward, or social glue?`,
      severity: foodSpend / Math.max(spent, 1) > 0.25 ? 'watch' : 'calm',
      emoji: '🟩',
    });
  }

  if (transferSpend / Math.max(spent, 1) > 0.4) {
    insights.push({
      id: 'social',
      title: 'Relational money',
      body: `Transfers are ${Math.round((transferSpend / Math.max(spent, 1)) * 100)}% of outflow (KES ${transferSpend.toLocaleString()}). Money as care, obligation, or identity — which role most often?`,
      severity: 'calm',
      emoji: '🟧',
    });
  }

  if (spikeDay && spikeDay[1] > avgDay * 2.5) {
    insights.push({
      id: 'spike',
      title: `Spike day ${spikeDay[0]}`,
      body: `KES ${spikeDay[1].toLocaleString()} vs ~KES ${Math.round(avgDay).toLocaleString()} daily average. Replay the day's mood, company, and unmet need.`,
      severity: 'watch',
      emoji: '🟨',
    });
  }

  const weekend = out.filter((t) => {
    const d = new Date(t.time);
    const day = d.getDay();
    return day === 0 || day === 6;
  });
  const weekendSpend = weekend.reduce((s, t) => s + t.withdrawn, 0);
  if (weekendSpend > spent * 0.35) {
    insights.push({
      id: 'weekend',
      title: 'Weekend gravity',
      body: `Weekends absorb KES ${weekendSpend.toLocaleString()} (${Math.round((weekendSpend / Math.max(spent, 1)) * 100)}%). Rest rituals vs compensatory spending — choose deliberately.`,
      severity: 'watch',
      emoji: '🟦',
    });
  }

  insights.push({
    id: 'practice',
    title: 'Ledger sadhana',
    body: 'Tie each category to a spiritual defect or virtue for a week (e.g. data→distraction, transfers→generosity, Fuliza→impatience). One sentence in Notes after each top merchant.',
    severity: 'calm',
    emoji: '💚',
  });

  return insights.slice(0, 8);
}

export function spendByDay(txs: MoneyTx[], days = 14): { label: string; value: number; in: number }[] {
  const map = new Map<string, { out: number; inn: number }>();
  const cut = new Date();
  cut.setDate(cut.getDate() - days);
  txs.forEach((t) => {
    const k = dayKey(t);
    if (new Date(k) < cut && days < 400) return;
    const row = map.get(k) || { out: 0, inn: 0 };
    row.out += t.withdrawn;
    row.inn += t.paidIn;
    map.set(k, row);
  });
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([k, v]) => ({
      label: new Date(k + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      value: Math.round(v.out),
      in: Math.round(v.inn),
    }));
}

export function categoryTotals(txs: MoneyTx[]) {
  const map: Record<string, number> = {};
  txs.forEach((t) => {
    if (t.withdrawn <= 0) return;
    map[t.category] = (map[t.category] || 0) + t.withdrawn;
  });
  return Object.entries(map)
    .map(([id, total]) => ({ id, total, ...CATEGORY_META[id as keyof typeof CATEGORY_META] }))
    .sort((a, b) => b.total - a.total);
}
