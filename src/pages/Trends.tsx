import { useMemo, useState } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, RadialLinearScale, Filler, Tooltip, Legend,
} from 'chart.js';
import { Line, Bar, Doughnut, Radar, Scatter } from 'react-chartjs-2';
import { Shell } from '@/components/Shell';
import { ModeToggle } from '@/components/ModeToggle';
import { useStore } from '@/context/StoreContext';
import { dateKey } from '@/lib/store';
import { DEFECTS } from '@/lib/types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, RadialLinearScale, Filler, Tooltip, Legend);

const MINT = '#06c97a';
const NAVY = '#2c3a63';
const AMBER = '#c9a227';
const BLUE = '#0894ce';
const ROSE = '#e85d4c';

type Section = 'overview' | 'practice' | 'defects' | 'body' | 'feed';
type OverviewTab = 'radar' | 'pulse';
type PracticeTab = 'hours' | 'focus';
type DefectsTab = 'mix' | 'trend';
type BodyTab = 'energy' | 'sleep';

export function TrendsPage() {
  const { user } = useStore();
  const [range, setRange] = useState(30);
  const [section, setSection] = useState<Section>('overview');
  const [overviewTab, setOverviewTab] = useState<OverviewTab>('radar');
  const [practiceTab, setPracticeTab] = useState<PracticeTab>('hours');
  const [defectsTab, setDefectsTab] = useState<DefectsTab>('mix');
  const [bodyTab, setBodyTab] = useState<BodyTab>('energy');

  const rows = useMemo(() => {
    const all = Object.entries(user?.ledger || {}).sort((a, b) => a[0].localeCompare(b[0]));
    if (!range) return all;
    const cut = new Date();
    cut.setDate(cut.getDate() - range);
    const ck = dateKey(cut);
    return all.filter(([k]) => k >= ck);
  }, [user, range]);

  const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
  const aware = rows.map(([, r]) => Number(r.aware) || 0);
  const mech = rows.map(([, r]) => Number(r.mech) || 0);
  const conc = rows.map(([, r]) => Number(r.conc) || 0);
  const med = rows.map(([, r]) => Number(r.medMins) || 0);
  const mood = rows.map(([, r]) => Number(r.mood) || 0);
  const sleep = rows.map(([, r]) => Number(r.sleep) || 0);
  const labels = rows.map(([k]) => {
    const d = new Date(k + 'T12:00:00');
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  });
  const defectTotals = DEFECTS.map((d) => rows.reduce((s, [, r]) => s + (Number((r as Record<string, unknown>)[`${d.id}Count`]) || 0), 0));
  const totalDef = rows.map(([, r]) => DEFECTS.reduce((s, d) => s + (Number((r as Record<string, unknown>)[`${d.id}Count`]) || 0), 0));
  const energy = { consciousness: 0, external: 0, emotions: 0, intellect: 0, physical: 0 };
  rows.forEach(([, r]) => { if (r.energy && r.energy in energy) energy[r.energy]++; });
  const conduct = [
    rows.length ? Math.round((rows.filter(([, r]) => (Number(r.divinity) || 0) >= 5).length / rows.length) * 100) : 0,
    rows.length ? Math.round((rows.filter(([, r]) => r.chastity).length / rows.length) * 100) : 0,
    rows.length ? Math.round((rows.filter(([, r]) => r.ateConsciously || r.ateProperly).length / rows.length) * 100) : 0,
  ];
  const pulse = rows.map(([, r]) => Math.round((Number(r.aware) || 0) * 6 + (Number(r.conc) || 0) * 8 + (Number(r.medMins) || 0) * 1.2 + (Number(r.mood) || 0) * 6));
  const youRadar = [
    Math.min(100, (avg(aware) / 16) * 100),
    Math.min(100, (avg(conc) / 10) * 100),
    Math.min(100, (avg(med) / 60) * 100),
    Math.min(100, (avg(mood) / 10) * 100),
  ].map((v) => Math.round(v || 0));
  const baseRadar = [Math.min(100, (avg(mech) / 16) * 100), 35, 20, Math.max(20, 100 - youRadar[3])].map((v) => Math.round(v || 0));

  let streak = 0;
  const d = new Date();
  while (user?.ledger[dateKey(d)]) { streak++; d.setDate(d.getDate() - 1); }

  const common = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#6b7280', boxWidth: 10, font: { size: 10 } } } },
    scales: {
      x: { ticks: { color: '#6b7280', maxTicksLimit: 8, font: { size: 9 } }, grid: { color: 'rgba(0,0,0,.04)' } },
      y: { ticks: { color: '#6b7280', font: { size: 9 } }, grid: { color: 'rgba(0,0,0,.04)' } },
    },
  };

  const recent = [...rows].reverse().slice(0, 5);

  const leftExtra = (
    <div className="gx-left-extra">
      <div className="gx-left-ranges">
        {[
          { id: 7, label: '7d' },
          { id: 30, label: '30d' },
          { id: 90, label: '90d' },
          { id: 365, label: 'Year' },
          { id: 0, label: 'All' },
        ].map((r) => (
          <button key={r.id} type="button" className={range === r.id ? 'on' : ''} onClick={() => setRange(r.id)}>
            {r.label}
          </button>
        ))}
      </div>
      <div className="money-left-stats trends-left-stats">
        <div><b>{rows.length}</b><span>Days</span></div>
        <div><b>{avg(aware).toFixed(1)}h</b><span>Aware</span></div>
        <div><b>{avg(conc).toFixed(1)}</b><span>Focus</span></div>
        <div><b>{Math.round(avg(med))}m</b><span>Med</span></div>
        <div><b>{defectTotals.reduce((a, b) => a + b, 0)}</b><span>Defects</span></div>
        <div><b>{streak}</b><span>Streak</span></div>
        <div><b>{avg(mood).toFixed(1)}</b><span>Mood</span></div>
        <div><b>{avg(sleep).toFixed(1)}h</b><span>Sleep</span></div>
      </div>
    </div>
  );

  return (
    <Shell leftExtra={leftExtra}>
      <div className="gx-page">
        <ModeToggle
          value={section}
          onChange={(id) => setSection(id as Section)}
          options={[
            { id: 'overview', label: 'Overview' },
            { id: 'practice', label: 'Practice' },
            { id: 'defects', label: 'Defects' },
            { id: 'body', label: 'Body' },
            { id: 'feed', label: 'Feed' },
          ]}
        />

        <div className="gx-fill">
          {section === 'overview' && (
            <>
              <ModeToggle
                value={overviewTab}
                onChange={(id) => setOverviewTab(id as OverviewTab)}
                options={[
                  { id: 'radar', label: 'Radar' },
                  { id: 'pulse', label: 'Pulse' },
                ]}
              />
              {overviewTab === 'radar' && (
                <div className="gx-chart-card" style={{ flex: 1, minHeight: 0 }}>
                  <h3>Practice radar</h3>
                  <div className="gx-chart-wrap tall" style={{ height: '100%', maxHeight: 'none' }}>
                    <Radar data={{
                      labels: ['Awareness', 'Focus', 'Meditation', 'Mood'],
                      datasets: [
                        { label: 'Mechanical', data: baseRadar, backgroundColor: 'rgba(201,162,39,.15)', borderColor: AMBER, pointBackgroundColor: AMBER },
                        { label: 'Practice', data: youRadar, backgroundColor: 'rgba(6,201,122,.18)', borderColor: MINT, pointBackgroundColor: MINT },
                      ],
                    }} options={{ ...common, scales: { r: { min: 0, max: 100, ticks: { display: false }, grid: { color: 'rgba(0,0,0,.06)' }, pointLabels: { color: '#6b7280' } } } }} />
                  </div>
                </div>
              )}
              {overviewTab === 'pulse' && (
                <div className="gx-chart-card" style={{ flex: 1, minHeight: 0 }}>
                  <h3>Sadhana pulse</h3>
                  <div className="gx-chart-wrap pulse" style={{ height: '100%', maxHeight: 'none' }}>
                    <Line data={{
                      labels,
                      datasets: [{ label: 'Pulse', data: pulse.length ? pulse : [0], borderColor: BLUE, backgroundColor: 'rgba(8,148,206,.15)', fill: true, tension: 0.42, pointRadius: 0, borderWidth: 3 }],
                    }} options={common} />
                  </div>
                </div>
              )}
            </>
          )}

          {section === 'practice' && (
            <>
              <ModeToggle
                value={practiceTab}
                onChange={(id) => setPracticeTab(id as PracticeTab)}
                options={[
                  { id: 'hours', label: 'Hours' },
                  { id: 'focus', label: 'Focus' },
                ]}
              />
              {practiceTab === 'hours' && (
                <div className="gx-chart-grid" style={{ gridTemplateRows: '1fr' }}>
                  <div className="gx-chart-card span2">
                    <h3>Conscious vs mechanical</h3>
                    <div className="gx-chart-wrap tall">
                      <Bar data={{
                        labels,
                        datasets: [
                          { label: 'Conscious', data: aware, backgroundColor: 'rgba(8,148,206,.7)', stack: 's' },
                          { label: 'Mechanical', data: mech, backgroundColor: 'rgba(232,93,76,.55)', stack: 's' },
                        ],
                      }} options={{ ...common, scales: { ...common.scales, x: { ...common.scales.x, stacked: true }, y: { ...common.scales.y, stacked: true, max: 24 } } }} />
                    </div>
                  </div>
                  <div className="gx-chart-card">
                    <h3>Aware vs mechanical avg</h3>
                    <div className="gx-chart-wrap">
                      <Doughnut data={{ labels: ['Aware', 'Mechanical'], datasets: [{ data: [avg(aware), avg(mech)], backgroundColor: [BLUE, ROSE], borderWidth: 0 }] }} options={{ ...common, scales: undefined }} />
                    </div>
                  </div>
                </div>
              )}
              {practiceTab === 'focus' && (
                <div className="gx-chart-grid">
                  <div className="gx-chart-card">
                    <h3>Concentration</h3>
                    <div className="gx-chart-wrap">
                      <Line data={{ labels, datasets: [{ label: 'Conc', data: conc, borderColor: BLUE, tension: 0.4, fill: true, backgroundColor: 'rgba(8,148,206,.1)', pointRadius: 2 }] }} options={{ ...common, scales: { ...common.scales, y: { ...common.scales.y, min: 0, max: 10 } } }} />
                    </div>
                  </div>
                  <div className="gx-chart-card">
                    <h3>Meditation minutes</h3>
                    <div className="gx-chart-wrap">
                      <Bar data={{ labels, datasets: [{ label: 'Min', data: med, backgroundColor: 'rgba(201,162,39,.7)' }] }} options={common} />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {section === 'defects' && (
            <>
              <ModeToggle
                value={defectsTab}
                onChange={(id) => setDefectsTab(id as DefectsTab)}
                options={[
                  { id: 'mix', label: 'Mix' },
                  { id: 'trend', label: 'Trends' },
                ]}
              />
              {defectsTab === 'mix' && (
                <div className="gx-chart-grid">
                  <div className="gx-chart-card">
                    <h3>Defect breakdown</h3>
                    <div className="gx-chart-wrap">
                      <Doughnut data={{ labels: DEFECTS.map((d) => d.title), datasets: [{ data: defectTotals, backgroundColor: [ROSE, AMBER, MINT, BLUE, NAVY], borderWidth: 0 }] }} options={{ ...common, scales: undefined }} />
                    </div>
                  </div>
                  <div className="gx-chart-card">
                    <h3>Egoic triggers / day</h3>
                    <div className="gx-chart-wrap">
                      <Line data={{ labels, datasets: [{ label: 'Triggers', data: totalDef, borderColor: ROSE, fill: true, backgroundColor: 'rgba(232,93,76,.12)', tension: 0.4, pointRadius: 2 }] }} options={common} />
                    </div>
                  </div>
                </div>
              )}
              {defectsTab === 'trend' && (
                <div className="gx-chart-card" style={{ flex: 1, minHeight: 0 }}>
                  <h3>Individual defect trends</h3>
                  <div className="gx-chart-wrap tall" style={{ height: '100%', maxHeight: 'none' }}>
                    <Line data={{
                      labels,
                      datasets: DEFECTS.map((d, i) => ({
                        label: d.title,
                        data: rows.map(([, r]) => Number((r as Record<string, unknown>)[`${d.id}Count`]) || 0),
                        borderColor: [ROSE, AMBER, MINT, BLUE, NAVY][i],
                        tension: 0.3, pointRadius: 1, borderWidth: 1.5,
                      })),
                    }} options={common} />
                  </div>
                </div>
              )}
            </>
          )}

          {section === 'body' && (
            <>
              <ModeToggle
                value={bodyTab}
                onChange={(id) => setBodyTab(id as BodyTab)}
                options={[
                  { id: 'energy', label: 'Energy' },
                  { id: 'sleep', label: 'Sleep / Mood' },
                ]}
              />
              {bodyTab === 'energy' && (
                <div className="gx-chart-grid">
                  <div className="gx-chart-card">
                    <h3>Energy investment</h3>
                    <div className="gx-chart-wrap">
                      <Doughnut data={{ labels: Object.keys(energy), datasets: [{ data: Object.values(energy), backgroundColor: [BLUE, AMBER, ROSE, NAVY, MINT], borderWidth: 0 }] }} options={{ ...common, scales: undefined }} />
                    </div>
                  </div>
                  <div className="gx-chart-card">
                    <h3>Conduct adherence %</h3>
                    <div className="gx-chart-wrap">
                      <Bar data={{ labels: ['Divinity', 'Chastity', 'Eating'], datasets: [{ data: conduct, backgroundColor: [BLUE, AMBER, MINT] }] }} options={{ ...common, scales: { ...common.scales, y: { ...common.scales.y, min: 0, max: 100 } } }} />
                    </div>
                  </div>
                </div>
              )}
              {bodyTab === 'sleep' && (
                <div className="gx-chart-grid">
                  <div className="gx-chart-card">
                    <h3>Sleep vs awareness</h3>
                    <div className="gx-chart-wrap">
                      <Scatter data={{ datasets: [{ label: 'Sleep→Aware', data: rows.map(([, r]) => ({ x: Number(r.sleep) || 0, y: Number(r.aware) || 0 })), backgroundColor: BLUE }] }} options={common} />
                    </div>
                  </div>
                  <div className="gx-chart-card">
                    <h3>Mood trend</h3>
                    <div className="gx-chart-wrap">
                      <Line data={{ labels, datasets: [{ label: 'Mood', data: mood, borderColor: MINT, tension: 0.4, fill: true, backgroundColor: 'rgba(6,201,122,.12)', pointRadius: 2 }] }} options={{ ...common, scales: { ...common.scales, y: { ...common.scales.y, min: 0, max: 10 } } }} />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {section === 'feed' && (
            <div className="gx-feed">
              <h3 style={{ fontFamily: 'Poppins', margin: '0 0 4px', fontSize: 14, flexShrink: 0 }}>Latest activity</h3>
              {recent.length === 0 && <div className="gx-card" style={{ color: 'var(--ink-soft)' }}>No entries yet</div>}
              {recent.map(([k, r]) => (
                <div key={k} className="gx-card" style={{ flexShrink: 0, padding: 10 }}>
                  <strong style={{ fontSize: 13 }}>{k}</strong>
                  <p style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                    Aware {r.aware || 0}h · Focus {r.conc || 0} · {(r.virtue || r.study || r.tomorrow || r.energy || 'Logged').toString().slice(0, 60)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
