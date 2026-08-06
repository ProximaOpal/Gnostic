import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { ArrowLeftRight, Moon, Sun, Upload, Wallet, Star } from 'lucide-react';
import { Shell } from '@/components/Shell';
import { MoneyMap } from '@/components/MoneyMap';
import { useStore } from '@/context/StoreContext';
import { uid } from '@/lib/store';
import { parseMpesaPdf } from '@/lib/money/parseMpesa';
import { enrichPlaces } from '@/lib/money/geo';
import { analyzeMoney, categoryTotals, spendByDay } from '@/lib/money/psycho';
import { CATEGORY_META, type MoneyTx } from '@/lib/money/types';
import type { Note } from '@/lib/types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const CHART_RANGES = [
  { id: 'day', label: 'Day', days: 1 },
  { id: 'week', label: 'Week', days: 7 },
  { id: 'month', label: 'Month', days: 30 },
  { id: 'quarter', label: 'Quarter', days: 90 },
  { id: 'year', label: 'Year', days: 365 },
  { id: 'all', label: 'All Time', days: 9999 },
] as const;

const TABLE_RANGES = [
  { id: 'week', label: 'WEEK', days: 7 },
  { id: 'month', label: 'MONTH', days: 30 },
  { id: 'quarter', label: 'QUART…', days: 90 },
] as const;

function filterByDays(txs: MoneyTx[], days: number) {
  if (days >= 9000) return txs;
  const cut = new Date();
  cut.setDate(cut.getDate() - days);
  const ck = cut.toISOString().slice(0, 10);
  return txs.filter((t) => t.time.slice(0, 10) >= ck);
}

function pctChange(curr: number, prev: number) {
  if (!prev) return curr ? 100 : 0;
  return ((curr - prev) / prev) * 100;
}

export function MoneyPage() {
  const { user, setMoney, setNotes, theme, setTheme, toast } = useStore();
  const money = user?.money;
  const [busy, setBusy] = useState(false);
  const [geoProgress, setGeoProgress] = useState('');
  const [hoverTx, setHoverTx] = useState<MoneyTx | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const autoImport = useRef(false);

  const txs = money?.txs || [];
  const chartRange = money?.chartRange || 'week';
  const tableRange = money?.tableRange || 'week';
  const chartDays = CHART_RANGES.find((r) => r.id === chartRange)?.days || 7;
  const tableDays = TABLE_RANGES.find((r) => r.id === tableRange)?.days || 7;
  const chartTxs = useMemo(() => filterByDays(txs, chartDays), [txs, chartDays]);
  const tableTxs = useMemo(() => filterByDays(txs, tableDays).slice(0, 40), [txs, tableDays]);
  const series = useMemo(() => spendByDay(chartTxs, chartDays), [chartTxs, chartDays]);
  const cats = useMemo(() => categoryTotals(txs), [txs]);
  const insights = useMemo(() => analyzeMoney(txs), [txs]);
  const balance = txs[0]?.balance ?? 0;
  const paidIn = money?.summary?.paidIn ?? txs.reduce((s, t) => s + t.paidIn, 0);
  const paidOut = money?.summary?.paidOut ?? txs.reduce((s, t) => s + t.withdrawn, 0);
  const weekOut = filterByDays(txs, 7).reduce((s, t) => s + t.withdrawn, 0);
  const prevWeekOut = (() => {
    const now = filterByDays(txs, 14);
    const recent = filterByDays(txs, 7);
    const recentSet = new Set(recent.map((t) => t.id));
    return now.filter((t) => !recentSet.has(t.id)).reduce((s, t) => s + t.withdrawn, 0);
  })();
  const weekPct = pctChange(weekOut, prevWeekOut);

  const moneyNotes = (user?.notes || []).filter((n) => n.tag.toLowerCase().includes('money') || n.tag.toLowerCase().includes('spend'));

  const importPdf = useCallback(async (buf: ArrayBuffer) => {
    setBusy(true);
    setGeoProgress('Parsing statement…');
    try {
      const parsed = await parseMpesaPdf(buf);
      setMoney({
        ...(money || { chartRange: 'week', tableRange: 'week', progressNotes: '', txs: [] }),
        txs: parsed.txs,
        summary: parsed.summary,
        period: parsed.period,
        importedAt: Date.now(),
        geoDone: false,
      });
      toast(`Imported ${parsed.txs.length} transactions`);
      setGeoProgress('Reverse-geocoding places…');
      const enriched = await enrichPlaces(parsed.txs, (done, total) => {
        setGeoProgress(`Geocoding ${done}/${total}…`);
      });
      setMoney((prev) => ({ ...prev, txs: enriched, geoDone: true }));
      setGeoProgress('');
      toast('Places pinned on map');
    } catch (e) {
      console.error(e);
      toast('Could not parse PDF');
      setGeoProgress('');
    } finally {
      setBusy(false);
    }
  }, [money, setMoney, toast]);

  const regeocode = useCallback(async () => {
    if (!txs.length) {
      toast('Import a statement first');
      return;
    }
    setBusy(true);
    setGeoProgress('Business search + time check…');
    try {
      const cleared = txs.map((t) => {
        const { place: _p, ...rest } = t;
        return rest as MoneyTx;
      });
      const enriched = await enrichPlaces(cleared, (done, total) => {
        setGeoProgress(`Geocoding ${done}/${total}…`);
      });
      setMoney((prev) => ({ ...prev, txs: enriched, geoDone: true }));
      toast('Places refreshed with time checks');
    } catch (e) {
      console.error(e);
      toast('Geocoding failed');
    } finally {
      setBusy(false);
      setGeoProgress('');
    }
  }, [txs, setMoney, toast]);

  useEffect(() => {
    if (autoImport.current || (money?.txs?.length || 0) > 0) return;
    autoImport.current = true;
    (async () => {
      try {
        const res = await fetch('/mpesa-statement.pdf');
        if (!res.ok) return;
        const buf = await res.arrayBuffer();
        await importPdf(buf);
      } catch {
        /* optional bundled statement */
      }
    })();
  }, [money?.txs?.length, importPdf]);

  function onFile(f: File | null) {
    if (!f) return;
    f.arrayBuffer().then(importPdf);
  }

  function addSpendNote(tx?: MoneyTx) {
    const n: Note = {
      id: uid('n'),
      title: tx ? `Spend · ${tx.merchant}` : 'Spend reflection',
      body: tx
        ? `${tx.emoji} ${tx.details}\nKES ${tx.withdrawn || tx.paidIn}\n\nWhat need was this serving?\n`
        : 'What is money teaching me this week?\n',
      tag: 'money',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setNotes([n, ...(user?.notes || [])]);
    if (tx) {
      setMoney((prev) => ({
        ...prev,
        txs: prev.txs.map((t) => (t.id === tx.id ? { ...t, noteId: n.id } : t)),
      }));
    }
    toast('Spend note added');
  }

  const chartData = {
    labels: series.map((s) => s.label),
    datasets: [
      {
        label: 'Outflow',
        data: series.map((s) => s.value),
        borderColor: '#06c97a',
        backgroundColor: 'rgba(6,201,122,.12)',
        fill: true,
        tension: 0.35,
        pointRadius: 3,
        pointHoverRadius: 7,
        pointBackgroundColor: '#00f78e',
        borderWidth: 2.5,
      },
    ],
  };

  const leftExtra = (
    <div className="gx-left-extra">
      <div className="money-left-stats">
        <div><b>KES {Math.round(balance).toLocaleString()}</b><span>Balance</span></div>
        <div><b>{txs.length}</b><span>Txns</span></div>
        <div><b>{cats.length}</b><span>Categories</span></div>
      </div>
      <p className="money-left-hint">Pins from merchants · paybills · location-like tills</p>
      <textarea
        className="gx-left-progress"
        placeholder="Progress notes (autosaved)…"
        value={money?.progressNotes || ''}
        onChange={(e) => setMoney((prev) => ({ ...prev, progressNotes: e.target.value }))}
        rows={3}
      />
    </div>
  );

  return (
    <Shell leftExtra={leftExtra} hideGlobalSearch>
      <div className={`money-dash ${theme === 'dark' ? 'is-dark' : 'is-light'}`}>
        <header className="money-top">
          <div className="money-brand">COINTALKER<span>.</span> MONEY</div>
          <nav className="money-nav">
            <span className="on">DASHBOARD</span>
            <span>MARKET</span>
            <span>TRANSACTION LIST</span>
            <span>SOCIAL</span>
          </nav>
          <div className="money-utils">
            <button type="button" className="money-icon-btn" title="Favorites"><Star size={14} /> Favorites</button>
            <button type="button" className="money-icon-btn" title="Wallet"><Wallet size={14} /> Wallet</button>
            <button
              type="button"
              className="money-icon-btn"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title="Theme"
            >
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />} Dark
            </button>
          </div>
        </header>

        <div className="money-upper">
          <aside className="money-aside">
            <div className="money-asset-card">
              <i className="accent" />
              <div className="rows">
                <div className="row">
                  <span>IN</span>
                  <strong>{(paidIn / 1000).toFixed(1)}K</strong>
                </div>
                <div className="row">
                  <span>OUT</span>
                  <strong>{(paidOut / 1000).toFixed(1)}K</strong>
                </div>
              </div>
              <button type="button" className="swap" title="Reflect" onClick={() => addSpendNote()}>
                <ArrowLeftRight size={16} />
              </button>
            </div>

            <div className="money-revenue-card">
              <div className="eth-icon">M</div>
              <div>
                <small>ESTIMATED 7-DAY SPEND</small>
                <strong>
                  {(weekOut).toLocaleString()} KES
                  <em> ({weekPct >= 0 ? '+' : ''}{weekPct.toFixed(1)}%)</em>
                </strong>
              </div>
            </div>

            <input ref={fileRef} type="file" accept="application/pdf" hidden onChange={(e) => onFile(e.target.files?.[0] || null)} />
            <button
              type="button"
              className="money-exchange"
              disabled={busy}
              onClick={() => fileRef.current?.click()}
            >
              <Upload size={16} /> {busy ? (geoProgress || 'WORKING…') : 'IMPORT M-PESA'}
            </button>

            <div className="money-cat-strip">
              {cats.slice(0, 6).map((c) => (
                <div key={c.id} className="money-cat-chip" style={{ ['--c' as string]: c.color }}>
                  <span className="sq">{c.emoji}</span>
                  <b>{c.label}</b>
                  <small>{Math.round(c.total / 1000)}k</small>
                </div>
              ))}
            </div>
          </aside>

          <section className="money-chart-panel">
            <div className="money-chart-filters">
              {CHART_RANGES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className={chartRange === r.id ? 'on' : ''}
                  onClick={() => setMoney((prev) => ({ ...prev, chartRange: r.id }))}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <div className="money-chart-wrap">
              <Line
                data={chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      backgroundColor: theme === 'dark' ? '#1a1c22' : '#17181c',
                      titleFont: { size: 12 },
                      callbacks: {
                        label: (ctx) => `KES ${Number(ctx.raw).toLocaleString()}`,
                      },
                    },
                  },
                  scales: {
                    x: {
                      ticks: { color: theme === 'dark' ? '#9aa0a6' : '#6b7280', maxTicksLimit: 6, font: { size: 10 } },
                      grid: { display: false },
                    },
                    y: {
                      ticks: {
                        color: theme === 'dark' ? '#9aa0a6' : '#6b7280',
                        font: { size: 10 },
                        callback: (v) => `${Number(v) >= 1000 ? `${Math.round(Number(v) / 1000)}K` : v}`,
                      },
                      grid: { color: theme === 'dark' ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.05)' },
                    },
                  },
                }}
              />
              {series.length > 0 && (
                <div className="money-chart-tip">
                  <span className="up">▲</span>
                  <div>
                    <strong>OUT {series[series.length - 1]?.value.toLocaleString()}</strong>
                    <em>{weekPct >= 0 ? '+' : ''}{weekPct.toFixed(2)}%</em>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        <section className="money-map-block">
          <div className="money-section-head">
            <h3>Places</h3>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <span>{txs.filter((t) => t.place).length} geocoded · Photon + Nominatim · time-checked</span>
              <button type="button" className="gx-btn gx-btn-ghost" style={{ padding: '4px 10px', fontSize: 11 }} disabled={busy} onClick={regeocode}>
                Re-pin places
              </button>
            </div>
          </div>
          <MoneyMap txs={txs} fill height={280} />
        </section>

        <section className="money-psych">
          <div className="money-section-head">
            <h3>Financial psychoanalysis</h3>
            <span>Patterns · time · categories</span>
          </div>
          <div className="money-psych-grid">
            {insights.map((ins) => (
              <article key={ins.id} className={`money-psych-card sev-${ins.severity}`}>
                <span className="sq">{ins.emoji}</span>
                <div>
                  <strong>{ins.title}</strong>
                  <p>{ins.body}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="money-tx-block">
          <div className="money-section-head">
            <h3>Transactions</h3>
            <div className="money-table-filters">
              {TABLE_RANGES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className={tableRange === r.id ? 'on' : ''}
                  onClick={() => setMoney((prev) => ({ ...prev, tableRange: r.id }))}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="money-table-wrap">
            <table className="money-table">
              <thead>
                <tr>
                  <th>Txn</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Merchant</th>
                  <th>KES</th>
                  <th>Time</th>
                  <th>Photo</th>
                </tr>
              </thead>
              <tbody>
                {tableTxs.map((t) => (
                  <tr
                    key={t.id}
                    onMouseEnter={() => setHoverTx(t)}
                    onMouseLeave={() => setHoverTx(null)}
                    onClick={() => addSpendNote(t)}
                  >
                    <td>
                      <span className="av">{t.avatar}</span>
                      #{t.receipt.slice(-8)}
                    </td>
                    <td>
                      <span className="sq">{t.emoji}</span> {CATEGORY_META[t.category].label}
                    </td>
                    <td>{t.withdrawn ? `−${t.withdrawn.toLocaleString()}` : `+${t.paidIn.toLocaleString()}`}</td>
                    <td className="merchant">{t.merchant}</td>
                    <td>{t.balance.toLocaleString()}</td>
                    <td>{new Date(t.time).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                    <td>
                      <div className="money-tx-photo" style={{ backgroundImage: `url(${t.photo})` }} />
                    </td>
                  </tr>
                ))}
                {!tableTxs.length && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', opacity: 0.6 }}>Import an M-PESA PDF to populate</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {hoverTx && (
            <div className="money-hover-card">
              <div className="ph" style={{ backgroundImage: `url(${hoverTx.photo})` }} />
              <div>
                <strong>{hoverTx.avatar} {hoverTx.merchant}</strong>
                <p>{hoverTx.details}</p>
                <em>{hoverTx.place ? `📍 ${hoverTx.place.name}` : 'No pin yet'} · click row for spend note</em>
              </div>
            </div>
          )}
        </section>

        {moneyNotes.length > 0 && (
          <section className="money-notes">
            <div className="money-section-head"><h3>Spend reflections</h3></div>
            <div className="money-notes-grid">
              {moneyNotes.slice(0, 6).map((n) => (
                <article key={n.id} className="money-note-card">
                  <strong>{n.title || 'Untitled'}</strong>
                  <p>{(n.body || '').slice(0, 140)}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        {money?.period && (
          <p className="money-period">Statement · {money.period} · {txs.length} rows · localStorage</p>
        )}
      </div>
    </Shell>
  );
}
