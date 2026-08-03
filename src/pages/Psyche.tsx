import { useState } from 'react';
import { Shell } from '@/components/Shell';
import { ModeToggle } from '@/components/ModeToggle';
import { useStore } from '@/context/StoreContext';
import {
  calcNumerology, getAge, getDailyTarot, getDayRuler, getPlanetaryHour,
  LIFE_STAGES, NUM_MEANINGS, PLANETS, PSYCH_TYPES,
} from '@/lib/cosmic';
import { DEFECTS } from '@/lib/types';

const BEHAVIOURS = ['Perfectionism','Procrastination','People-pleasing','Avoidance','Rumination','Spiritual bypassing','Self-sabotage','Comparison','Isolation','Overwork'];

type Section = 'numbers' | 'tarot' | 'planets' | 'portrait';
type EditTab = 'bio' | 'defects' | 'aims';

export function PsychePage() {
  const { user, patchProfile, toast } = useStore();
  const p = user?.profile || {};
  const [edit, setEdit] = useState(!p.dob);
  const [section, setSection] = useState<Section>('numbers');
  const [editTab, setEditTab] = useState<EditTab>('bio');
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
      <div className="gx-page">
        <div className="gx-page-head" style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h2>Psyche</h2>
            <p className="sub">Chaldean, planets, tarot, self-portrait.</p>
          </div>
          <button type="button" className="gx-btn gx-btn-primary" onClick={() => setEdit((e) => !e)}>{edit ? 'Done' : 'Edit profile'}</button>
        </div>

        {edit ? (
          <div className="gx-fill">
            <ModeToggle
              value={editTab}
              onChange={(id) => setEditTab(id as EditTab)}
              options={[
                { id: 'bio', label: 'Bio' },
                { id: 'defects', label: 'Defects' },
                { id: 'aims', label: 'Aims' },
              ]}
            />
            <div className="gx-panel-card">
              {editTab === 'bio' && (
                <>
                  <div className="gx-grid2">
                    <div className="gx-field"><label>Full birth name</label><input value={p.fullName || ''} onChange={(e) => patchProfile({ fullName: e.target.value })} /></div>
                    <div className="gx-field"><label>Date of birth</label><input type="date" value={p.dob || ''} onChange={(e) => patchProfile({ dob: e.target.value })} /></div>
                    <div className="gx-field"><label>Time of birth</label><input value={p.tob || ''} onChange={(e) => patchProfile({ tob: e.target.value })} /></div>
                    <div className="gx-field"><label>Place of birth</label><input value={p.pob || ''} onChange={(e) => patchProfile({ pob: e.target.value })} /></div>
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--ink-soft)', margin: '4px 0 6px' }}>Dominant centre</p>
                  <div className="gx-tabs">
                    {Object.keys(PSYCH_TYPES).map((t) => (
                      <button key={t} type="button" className={`gx-tab ${p.type === t ? 'on' : ''}`} onClick={() => patchProfile({ type: t })}>{t}</button>
                    ))}
                  </div>
                  {p.type && <p style={{ fontSize: 12, color: 'var(--ink-soft)', marginBottom: 8 }}>{PSYCH_TYPES[p.type]}</p>}
                  <div className="gx-grid2">
                    <div className="gx-field"><label>Sun</label><input value={p.sun || ''} onChange={(e) => patchProfile({ sun: e.target.value })} /></div>
                    <div className="gx-field"><label>Moon</label><input value={p.moon || ''} onChange={(e) => patchProfile({ moon: e.target.value })} /></div>
                    <div className="gx-field"><label>Rising</label><input value={p.asc || ''} onChange={(e) => patchProfile({ asc: e.target.value })} /></div>
                    <div className="gx-field"><label>Teachers</label><input value={p.teachers || ''} onChange={(e) => patchProfile({ teachers: e.target.value })} /></div>
                  </div>
                </>
              )}
              {editTab === 'defects' && (
                <>
                  <div className="gx-field"><label>Chief defect</label><textarea rows={2} value={p.chiefDefect || ''} onChange={(e) => patchProfile({ chiefDefect: e.target.value })} /></div>
                  <div className="gx-tabs">
                    {DEFECTS.map((d) => {
                      const on = (p.selectedDefects || []).includes(d.id);
                      return (
                        <button key={d.id} type="button" className={`gx-tab ${on ? 'on' : ''}`} onClick={() => {
                          const cur = new Set(p.selectedDefects || []);
                          on ? cur.delete(d.id) : cur.add(d.id);
                          patchProfile({ selectedDefects: [...cur] });
                        }}>{d.title}</button>
                      );
                    })}
                  </div>
                  <div className="gx-tabs" style={{ marginTop: 4 }}>
                    {BEHAVIOURS.map((b) => {
                      const on = (p.selectedBehaviours || []).includes(b);
                      return (
                        <button key={b} type="button" className={`gx-tab ${on ? 'on' : ''}`} onClick={() => {
                          const cur = new Set(p.selectedBehaviours || []);
                          on ? cur.delete(b) : cur.add(b);
                          patchProfile({ selectedBehaviours: [...cur] });
                        }}>{b}</button>
                      );
                    })}
                  </div>
                  <div className="gx-field"><label>Shadow</label><textarea rows={2} value={p.shadow || ''} onChange={(e) => patchProfile({ shadow: e.target.value })} /></div>
                </>
              )}
              {editTab === 'aims' && (
                <>
                  <div className="gx-field"><label>Limiting belief</label><input value={p.belief || ''} onChange={(e) => patchProfile({ belief: e.target.value })} /></div>
                  <div className="gx-field"><label>Annual aim</label><input value={p.goal || ''} onChange={(e) => patchProfile({ goal: e.target.value })} /></div>
                  <button type="button" className="gx-btn gx-btn-primary" onClick={() => { setEdit(false); toast('Profile saved'); }}>Save profile</button>
                </>
              )}
            </div>
          </div>
        ) : (
          <>
            <ModeToggle
              value={section}
              onChange={(id) => setSection(id as Section)}
              options={[
                { id: 'numbers', label: 'Numbers' },
                { id: 'tarot', label: 'Tarot' },
                { id: 'planets', label: 'Planets' },
                { id: 'portrait', label: 'Portrait' },
              ]}
            />

            <div className="gx-fill">
              {section === 'numbers' && (
                <>
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
                        {v && NUM_MEANINGS[v] ? <div style={{ fontSize: 10, color: 'var(--ink-soft)', marginTop: 2 }}>{NUM_MEANINGS[v].name}</div> : null}
                      </div>
                    ))}
                  </div>
                  {age != null && stage && (
                    <div className="gx-card">
                      <strong style={{ fontSize: 13 }}>{age} years · {stage.name}</strong>
                      <p style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{stage.desc}</p>
                    </div>
                  )}
                </>
              )}

              {section === 'tarot' && (
                <div className="gx-card-grid" style={{ flex: 1, minHeight: 0, alignContent: 'start' }}>
                  {[tarot.primary, tarot.secondary].map((c, i) => (
                    <div key={c.n + i} className="gx-card" style={{ textAlign: 'center' }}>
                      <div className="gx-pill" style={{ marginBottom: 6 }}>{i === 0 ? 'Primary' : 'Secondary'}</div>
                      <div style={{ fontSize: 32 }}>{c.emoji}</div>
                      <strong style={{ fontFamily: 'Poppins', fontSize: 15 }}>{c.name}</strong>
                      <p style={{ fontSize: 11, color: 'var(--ink-soft)' }}>Arcanum {c.n} · {c.key} · {c.planet}</p>
                      <p style={{ fontSize: 12, marginTop: 6 }}>{c.interp}</p>
                    </div>
                  ))}
                </div>
              )}

              {section === 'planets' && (
                <>
                  <div className="gx-card-grid" style={{ alignContent: 'start' }}>
                    {PLANETS.map((pl) => (
                      <div key={pl.name} className="gx-card" style={{ textAlign: 'center', padding: 10, boxShadow: pl.name === ruler.name ? 'inset 0 0 0 1.5px var(--mint-deep)' : undefined }}>
                        <div style={{ fontSize: 22 }}>{pl.emoji}</div>
                        <strong style={{ fontSize: 13 }}>{pl.name}</strong>
                        <div style={{ fontSize: 11, color: 'var(--ink-soft)' }}>{pl.day}</div>
                      </div>
                    ))}
                  </div>
                  <div className="gx-card" style={{ marginTop: 8, flexShrink: 0 }}>
                    <strong style={{ fontSize: 13 }}>{hour.emoji} {hour.name} hour now</strong>
                    <p style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{hour.quality}</p>
                  </div>
                </>
              )}

              {section === 'portrait' && (
                <div className="gx-feed">
                  {!(p.type || p.chiefDefect || p.belief) && (
                    <div className="gx-card" style={{ color: 'var(--ink-soft)' }}>
                      Add a centre, chief defect, or belief via Edit profile.
                    </div>
                  )}
                  {p.type && <div className="gx-card"><strong style={{ fontSize: 13 }}>{p.type} centre</strong><p style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{PSYCH_TYPES[p.type]}</p></div>}
                  {p.chiefDefect && <div className="gx-card"><strong style={{ fontSize: 13 }}>Chief ego</strong><p style={{ fontSize: 12 }}>{p.chiefDefect}</p></div>}
                  {p.belief && <div className="gx-card"><strong style={{ fontSize: 13 }}>Limiting belief</strong><p style={{ fontSize: 12 }}>“{p.belief}”</p></div>}
                  {entries.length >= 5 && (
                    <div className="gx-card">
                      <strong style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>Ledger patterns</strong>
                      {DEFECTS.map((d) => {
                        const count = entries.reduce((s, r) => s + (Number((r as Record<string, unknown>)[`${d.id}Count`]) || 0), 0);
                        return <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}><span>{d.title}</span><b>{count}</b></div>;
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Shell>
  );
}
