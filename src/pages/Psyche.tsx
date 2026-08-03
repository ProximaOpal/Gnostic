import { useState } from 'react';
import { Shell } from '@/components/Shell';
import { useStore } from '@/context/StoreContext';
import {
  calcNumerology, getAge, getDailyTarot, getDayRuler, getPlanetaryHour,
  LIFE_STAGES, NUM_MEANINGS, PLANETS, PSYCH_TYPES, TAROT,
} from '@/lib/cosmic';
import { DEFECTS } from '@/lib/types';

const BEHAVIOURS = ['Perfectionism','Procrastination','People-pleasing','Avoidance','Rumination','Spiritual bypassing','Self-sabotage','Comparison','Isolation','Overwork'];

export function PsychePage() {
  const { user, patchProfile, toast } = useStore();
  const p = user?.profile || {};
  const [edit, setEdit] = useState(!p.dob);
  const name = p.fullName || user?.name || '';
  const num = calcNumerology(p.dob, name);
  const age = getAge(p.dob);
  const tarot = getDailyTarot(p.dob, name);
  const ruler = getDayRuler();
  const hour = getPlanetaryHour();
  const stage = age != null ? LIFE_STAGES.find((s) => age >= s.years[0] && age < s.years[1]) : null;

  const entries = Object.values(user?.ledger || {});

  return (
    <Shell>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h2>Psyche</h2>
          <p className="sub">Personal intelligence — Chaldean, planets, tarot, self-portrait.</p>
        </div>
        <button className="gx-btn gx-btn-primary" onClick={() => setEdit((e) => !e)}>{edit ? 'Done' : 'Edit profile'}</button>
      </div>

      {edit && (
        <div className="gx-card" style={{ marginBottom: 16 }}>
          <div className="gx-grid2">
            <div className="gx-field"><label>Full birth name</label><input value={p.fullName || ''} onChange={(e) => patchProfile({ fullName: e.target.value })} /></div>
            <div className="gx-field"><label>Date of birth</label><input type="date" value={p.dob || ''} onChange={(e) => patchProfile({ dob: e.target.value })} /></div>
            <div className="gx-field"><label>Time of birth</label><input value={p.tob || ''} onChange={(e) => patchProfile({ tob: e.target.value })} /></div>
            <div className="gx-field"><label>Place of birth</label><input value={p.pob || ''} onChange={(e) => patchProfile({ pob: e.target.value })} /></div>
          </div>
          <p style={{ fontSize: 12, color: 'var(--ink-soft)', margin: '8px 0' }}>Dominant centre</p>
          <div className="gx-tabs">
            {Object.keys(PSYCH_TYPES).map((t) => (
              <button key={t} className={`gx-tab ${p.type === t ? 'on' : ''}`} onClick={() => patchProfile({ type: t })}>{t}</button>
            ))}
          </div>
          {p.type && <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 10 }}>{PSYCH_TYPES[p.type]}</p>}
          <div className="gx-field"><label>Chief defect</label><textarea value={p.chiefDefect || ''} onChange={(e) => patchProfile({ chiefDefect: e.target.value })} /></div>
          <div className="gx-tabs">
            {DEFECTS.map((d) => {
              const on = (p.selectedDefects || []).includes(d.id);
              return (
                <button key={d.id} className={`gx-tab ${on ? 'on' : ''}`} onClick={() => {
                  const cur = new Set(p.selectedDefects || []);
                  on ? cur.delete(d.id) : cur.add(d.id);
                  patchProfile({ selectedDefects: [...cur] });
                }}>{d.title}</button>
              );
            })}
          </div>
          <div className="gx-tabs" style={{ marginTop: 8 }}>
            {BEHAVIOURS.map((b) => {
              const on = (p.selectedBehaviours || []).includes(b);
              return (
                <button key={b} className={`gx-tab ${on ? 'on' : ''}`} onClick={() => {
                  const cur = new Set(p.selectedBehaviours || []);
                  on ? cur.delete(b) : cur.add(b);
                  patchProfile({ selectedBehaviours: [...cur] });
                }}>{b}</button>
              );
            })}
          </div>
          <div className="gx-grid2" style={{ marginTop: 10 }}>
            <div className="gx-field"><label>Sun</label><input value={p.sun || ''} onChange={(e) => patchProfile({ sun: e.target.value })} /></div>
            <div className="gx-field"><label>Moon</label><input value={p.moon || ''} onChange={(e) => patchProfile({ moon: e.target.value })} /></div>
            <div className="gx-field"><label>Rising</label><input value={p.asc || ''} onChange={(e) => patchProfile({ asc: e.target.value })} /></div>
            <div className="gx-field"><label>Teachers</label><input value={p.teachers || ''} onChange={(e) => patchProfile({ teachers: e.target.value })} /></div>
          </div>
          <div className="gx-field"><label>Shadow</label><textarea value={p.shadow || ''} onChange={(e) => patchProfile({ shadow: e.target.value })} /></div>
          <div className="gx-field"><label>Limiting belief</label><input value={p.belief || ''} onChange={(e) => patchProfile({ belief: e.target.value })} /></div>
          <div className="gx-field"><label>Annual aim</label><input value={p.goal || ''} onChange={(e) => patchProfile({ goal: e.target.value })} /></div>
          <button className="gx-btn gx-btn-primary" onClick={() => { setEdit(false); toast('Profile saved'); }}>Save profile</button>
        </div>
      )}

      <h3 style={{ fontFamily: 'Poppins', marginBottom: 10 }}>Chaldean</h3>
      <div className="gx-stats">
        {([
          ['Life Path', num.lifePath],
          ['Destiny', num.destiny],
          ['Soul Urge', num.soul],
          ['Personal Year', num.personalYear],
          ['Personal Month', num.personalMonth],
          ['Personal Day', num.personalDay],
        ] as const).map(([lbl, v]) => (
          <div key={lbl} className="gx-stat">
            <b>{v ?? '—'}</b>
            <small>{lbl}</small>
            {v && NUM_MEANINGS[v] ? <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 4 }}>{NUM_MEANINGS[v].name}</div> : null}
          </div>
        ))}
      </div>
      {age != null && stage && (
        <div className="gx-card" style={{ marginBottom: 14 }}>
          <strong>{age} years · {stage.name}</strong>
          <p style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{stage.desc}</p>
        </div>
      )}

      <h3 style={{ fontFamily: 'Poppins', margin: '16px 0 10px' }}>Daily tarot</h3>
      <div className="gx-card-grid">
        {[tarot.primary, tarot.secondary].map((c, i) => (
          <div key={c.n + i} className="gx-card" style={{ textAlign: 'center' }}>
            <div className="gx-pill" style={{ marginBottom: 8 }}>{i === 0 ? 'Primary' : 'Secondary'}</div>
            <div style={{ fontSize: 40 }}>{c.emoji}</div>
            <strong style={{ fontFamily: 'Poppins' }}>{c.name}</strong>
            <p style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Arcanum {c.n} · {c.key} · {c.planet}</p>
            <p style={{ fontSize: 13, marginTop: 8 }}>{c.interp}</p>
          </div>
        ))}
      </div>

      <h3 style={{ fontFamily: 'Poppins', margin: '16px 0 10px' }}>Planets</h3>
      <div className="gx-card-grid">
        {PLANETS.map((pl) => (
          <div key={pl.name} className="gx-card" style={{ textAlign: 'center', boxShadow: pl.name === ruler.name ? 'inset 0 0 0 1.5px var(--mint-deep)' : undefined }}>
            <div style={{ fontSize: 28 }}>{pl.emoji}</div>
            <strong>{pl.name}</strong>
            <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{pl.day}</div>
          </div>
        ))}
      </div>
      <div className="gx-card" style={{ marginTop: 10 }}>
        <strong>{hour.emoji} {hour.name} hour now</strong>
        <p style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{hour.quality}</p>
      </div>

      {(p.type || p.chiefDefect || p.belief) && (
        <>
          <h3 style={{ fontFamily: 'Poppins', margin: '16px 0 10px' }}>Self-portrait</h3>
          {p.type && <div className="gx-card" style={{ marginBottom: 8 }}><strong>{p.type} centre</strong><p style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{PSYCH_TYPES[p.type]}</p></div>}
          {p.chiefDefect && <div className="gx-card" style={{ marginBottom: 8 }}><strong>Chief ego</strong><p style={{ fontSize: 13 }}>{p.chiefDefect}</p></div>}
          {p.belief && <div className="gx-card" style={{ marginBottom: 8 }}><strong>Limiting belief</strong><p style={{ fontSize: 13 }}>“{p.belief}”</p></div>}
        </>
      )}

      {entries.length >= 5 && (
        <>
          <h3 style={{ fontFamily: 'Poppins', margin: '16px 0 10px' }}>Ledger patterns</h3>
          <div className="gx-card">
            {DEFECTS.map((d) => {
              const count = entries.reduce((s, r) => s + (Number((r as Record<string, unknown>)[`${d.id}Count`]) || 0), 0);
              return <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span>{d.title}</span><b>{count}</b></div>;
            })}
          </div>
        </>
      )}
    </Shell>
  );
}
