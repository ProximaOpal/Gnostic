import { useMemo, useState } from 'react';
import { Shell } from '@/components/Shell';
import { ModeToggle } from '@/components/ModeToggle';
import { useStore } from '@/context/StoreContext';
import { dateKey } from '@/lib/store';
import { DEFECTS, IMAGES, type DiaryEntry, type EnergyFocus } from '@/lib/types';
import { getDailyTarot, getDayRuler, calcNumerology } from '@/lib/cosmic';

type Phase = 'morning' | 'day' | 'night' | 'summary';

export function DiaryPage() {
  const { user, patchEntry, toast } = useStore();
  const [active, setActive] = useState(dateKey());
  const [phase, setPhase] = useState<Phase>('morning');
  const entry = user?.ledger[active] || {};

  const days = useMemo(() => {
    const base = new Date(active + 'T12:00:00');
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + (i - 3));
      return d;
    });
  }, [active]);

  function set<K extends keyof DiaryEntry>(k: K, v: DiaryEntry[K]) {
    const cosmic = (() => {
      const tarot = getDailyTarot(user?.profile.dob, user?.profile.fullName || user?.name, new Date(active + 'T12:00:00'));
      const ruler = getDayRuler(new Date(active + 'T12:00:00'));
      const num = calcNumerology(user?.profile.dob, user?.profile.fullName || user?.name, new Date(active + 'T12:00:00'));
      return { tarot: tarot.primary.name, dayRuler: ruler.name, personalDay: num.personalDay };
    })();
    patchEntry(active, { [k]: v, cosmic } as Partial<DiaryEntry>);
  }

  const phases: { id: Phase; title: string; sub: string; img: string }[] = [
    { id: 'morning', title: 'Morning', sub: 'Sleep · dreams · practice', img: IMAGES.dawn },
    { id: 'day', title: 'Day', sub: 'Conduct · defects · service', img: IMAGES.day },
    { id: 'night', title: 'Night', sub: 'Meditation · retrospect', img: IMAGES.night },
    { id: 'summary', title: 'Summary', sub: 'Awareness · energy', img: IMAGES.sum },
  ];

  return (
    <Shell>
      <h2>Diary</h2>
      <p className="sub">Active: {new Date(active + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 14 }}>
        {days.map((d) => {
          const k = dateKey(d);
          const has = user?.ledger[k] && Object.keys(user.ledger[k]).length > 0;
          return (
            <button
              key={k}
              onClick={() => setActive(k)}
              className="gx-card"
              style={{
                flex: '0 0 56px', padding: '10px 6px', textAlign: 'center',
                background: k === active ? 'rgba(0,247,142,.2)' : undefined,
                boxShadow: k === active ? 'inset 0 0 0 1.5px var(--mint-deep)' : undefined,
              }}
            >
              <small style={{ fontSize: 10, color: 'var(--ink-soft)', textTransform: 'uppercase' }}>{d.toLocaleDateString(undefined, { weekday: 'short' })}</small>
              <div style={{ fontFamily: 'Poppins', fontWeight: 700 }}>{d.getDate()}</div>
              {has ? <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--mint-deep)', margin: '4px auto 0' }} /> : null}
            </button>
          );
        })}
      </div>

      <div className="gx-card-grid" style={{ marginBottom: 16 }}>
        {phases.map((p) => (
          <button key={p.id} className="gx-photo-card" onClick={() => setPhase(p.id)} style={{ boxShadow: phase === p.id ? '0 0 0 2px var(--mint)' : undefined }}>
            <div className="ph" style={{ backgroundImage: `url(${p.img})` }} />
            <div className="body"><strong>{p.title}</strong><span>{p.sub}</span></div>
          </button>
        ))}
      </div>

      <ModeToggle
        value={phase}
        onChange={(id) => setPhase(id as Phase)}
        options={phases.map((p) => ({ id: p.id, label: p.title }))}
      />

      {phase === 'morning' && (
        <div className="gx-card">
          <div className="gx-grid2">
            <Field label="Bedtime" value={entry.bed || ''} onChange={(v) => set('bed', v)} />
            <Field label="Awakened" value={entry.wake || ''} onChange={(v) => set('wake', v)} />
          </div>
          <Slider label="Hours slept" value={entry.sleep ?? 7} min={0} max={14} step={0.5} suffix="h" onChange={(v) => set('sleep', v)} />
          <label className="gx-check"><input type="checkbox" checked={!!entry.dreamsLogged} onChange={(e) => set('dreamsLogged', e.target.checked)} /> Recorded dreams</label>
          <Area label="Dream notes" value={entry.dreams || ''} onChange={(v) => set('dreams', v)} />
          <div className="gx-grid2">
            <Field label="Mood on waking" value={entry.wakeMood || ''} onChange={(v) => set('wakeMood', v)} />
            <Field label="Why?" value={entry.wakeMoodWhy || ''} onChange={(v) => set('wakeMoodWhy', v)} />
          </div>
          <Area label="Morning practice" value={entry.morningPractice || ''} onChange={(v) => set('morningPractice', v)} />
          <Field label="Duration (min)" value={String(entry.morningMins ?? '')} onChange={(v) => set('morningMins', Number(v) || 0)} />
        </div>
      )}

      {phase === 'day' && (
        <div className="gx-card">
          <Slider label="Remembrance of divinity" value={entry.divinity ?? 5} min={0} max={10} onChange={(v) => set('divinity', v)} />
          <Field label="Prayer" value={entry.pray || ''} onChange={(v) => set('pray', v)} />
          <Field label="Study" value={entry.study || ''} onChange={(v) => set('study', v)} />
          <Area label="What did you learn?" value={entry.studyLearned || ''} onChange={(v) => set('studyLearned', v)} />
          <Field label="Tongue control" value={entry.tongue || ''} onChange={(v) => set('tongue', v)} />
          <Area label="Service" value={entry.service || ''} onChange={(v) => set('service', v)} />
          <Field label="Useless hours" value={String(entry.useless ?? '')} onChange={(v) => set('useless', Number(v) || 0)} />
          <label className="gx-check"><input type="checkbox" checked={!!entry.chastity} onChange={(e) => set('chastity', e.target.checked)} /> Kept chastity</label>
          <label className="gx-check"><input type="checkbox" checked={!!entry.ateConsciously} onChange={(e) => set('ateConsciously', e.target.checked)} /> Ate consciously</label>
          <label className="gx-check"><input type="checkbox" checked={!!entry.ateProperly} onChange={(e) => set('ateProperly', e.target.checked)} /> Ate properly</label>
          <Field label="Diet" value={entry.diet || ''} onChange={(v) => set('diet', v)} />
          <Area label="Diet effects" value={entry.dietEffects || ''} onChange={(v) => set('dietEffects', v)} />
          <Slider label="Mood" value={entry.mood ?? 5} min={0} max={10} onChange={(v) => set('mood', v)} />
          <Field label="Mood why" value={entry.moodWhy || ''} onChange={(v) => set('moodWhy', v)} />
          <Area label="Mood effect on self/others" value={entry.moodEffect || ''} onChange={(v) => set('moodEffect', v)} />
          <div className="gx-grid2">
            <Field label="Mantras" value={entry.mantras || ''} onChange={(v) => set('mantras', v)} />
            <Field label="How much" value={entry.mantraAmount || ''} onChange={(v) => set('mantraAmount', v)} />
          </div>
          <Field label="Exercise" value={entry.exercise || ''} onChange={(v) => set('exercise', v)} />
          <Area label="Exercise effects" value={entry.exerciseEffects || ''} onChange={(v) => set('exerciseEffects', v)} />
          <Field label="Ego restraint" value={entry.egoRestrained || ''} onChange={(v) => set('egoRestrained', v)} />
          <Area label="Visible impulses" value={entry.egoVisible || ''} onChange={(v) => set('egoVisible', v)} />
          {DEFECTS.map((d) => {
            const ck = `${d.id}Count` as keyof DiaryEntry;
            const dk = `${d.id}Duration` as keyof DiaryEntry;
            const ak = `${d.id}Answer` as keyof DiaryEntry;
            return (
              <div key={d.id} className="gx-card" style={{ background: '#fff', marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <strong>{d.title}</strong>
                  <div className="gx-btn-row">
                    <button className="gx-btn gx-btn-ghost" onClick={() => set(ck, Math.max(0, Number(entry[ck] || 0) - 1) as never)}>−</button>
                    <b style={{ minWidth: 24, textAlign: 'center' }}>{Number(entry[ck] || 0)}</b>
                    <button className="gx-btn gx-btn-ghost" onClick={() => set(ck, (Number(entry[ck] || 0) + 1) as never)}>+</button>
                  </div>
                </div>
                <div className="gx-grid2">
                  <Field label="Duration" value={String(entry[dk] || '')} onChange={(v) => set(dk, v as never)} />
                  <Field label="Answering" value={String(entry[ak] || '')} onChange={(v) => set(ak, v as never)} />
                </div>
              </div>
            );
          })}
          <Field label="Other defect" value={entry.otherDefectName || ''} onChange={(v) => set('otherDefectName', v)} />
          <Area label="Habit failure" value={entry.habitFail || ''} onChange={(v) => set('habitFail', v)} />
          <Area label="Dealing with yourself" value={entry.habitDeal || ''} onChange={(v) => set('habitDeal', v)} />
        </div>
      )}

      {phase === 'night' && (
        <div className="gx-card">
          <Slider label="Concentration" value={entry.conc ?? 5} min={0} max={10} onChange={(v) => set('conc', v)} />
          <Area label="Why this level?" value={entry.concWhy || ''} onChange={(v) => set('concWhy', v)} />
          <Field label="Meditation minutes" value={String(entry.medMins ?? '')} onChange={(v) => set('medMins', Number(v) || 0)} />
          <Area label="Meditation detail" value={entry.medDetail || ''} onChange={(v) => set('medDetail', v)} />
          <Area label="Retrospection" value={entry.retro || ''} onChange={(v) => set('retro', v)} />
          <Area label="What did you learn?" value={entry.retroLearned || ''} onChange={(v) => set('retroLearned', v)} />
          <div className="gx-grid2">
            <Field label="Defect meditated" value={entry.defectMed || ''} onChange={(v) => set('defectMed', v)} />
            <Field label="How long" value={entry.defectMedMins || ''} onChange={(v) => set('defectMedMins', v)} />
          </div>
          <Area label="What it showed" value={entry.defectMedShowed || ''} onChange={(v) => set('defectMedShowed', v)} />
          <Field label="Virtue" value={entry.virtue || ''} onChange={(v) => set('virtue', v)} />
          <Area label="Virtue learned" value={entry.virtueLearned || ''} onChange={(v) => set('virtueLearned', v)} />
          <Field label="Eradicating" value={entry.eradicate || ''} onChange={(v) => set('eradicate', v)} />
          <Area label="What you learned" value={entry.eradicateLearned || ''} onChange={(v) => set('eradicateLearned', v)} />
          <Field label="Obstacle" value={entry.obstacle || ''} onChange={(v) => set('obstacle', v)} />
          <Field label="Antidote" value={entry.antidote || ''} onChange={(v) => set('antidote', v)} />
          <label className="gx-check"><input type="checkbox" checked={!!entry.antidoteApplied} onChange={(e) => set('antidoteApplied', e.target.checked)} /> Applied antidote</label>
        </div>
      )}

      {phase === 'summary' && (
        <div className="gx-card">
          <Slider label="Aware hours" value={entry.aware ?? 6} min={0} max={24} suffix="h" onChange={(v) => set('aware', v)} />
          <Slider label="Mechanical hours" value={entry.mech ?? 10} min={0} max={24} suffix="h" onChange={(v) => set('mech', v)} />
          <p style={{ fontSize: 12, color: 'var(--ink-soft)', marginBottom: 8 }}>Energy investment</p>
          {([
            ['consciousness', 'Awakening consciousness'],
            ['external', 'External circumstances'],
            ['emotions', 'Emotional habits'],
            ['intellect', 'Intellectual habits'],
            ['physical', 'Physical / worldly'],
          ] as [EnergyFocus, string][]).map(([v, label]) => (
            <label key={v} className="gx-check">
              <input type="radio" name="energy" checked={entry.energy === v} onChange={() => set('energy', v)} />
              {label}
            </label>
          ))}
          <Area label="Improve tomorrow" value={entry.tomorrow || ''} onChange={(v) => set('tomorrow', v)} />
        </div>
      )}

      <div className="gx-btn-row" style={{ marginTop: 14 }}>
        <button className="gx-btn gx-btn-primary" onClick={() => toast(`Saved · ${active}`)}>Lock entry</button>
      </div>
    </Shell>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="gx-field">
      <label>{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
function Area({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="gx-field">
      <label>{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
function Slider({ label, value, min, max, step = 1, suffix = '', onChange }: {
  label: string; value: number; min: number; max: number; step?: number; suffix?: string; onChange: (v: number) => void;
}) {
  return (
    <div className="gx-field">
      <label>{label}</label>
      <div className="gx-slider">
        <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
        <b>{value}{suffix}</b>
      </div>
    </div>
  );
}
