import { useMemo, useState, type ReactNode } from 'react';
import { Shell } from '@/components/Shell';
import { ModeToggle } from '@/components/ModeToggle';
import { useStore } from '@/context/StoreContext';
import { dateKey } from '@/lib/store';
import { DEFECTS, IMAGES, type DiaryEntry, type EnergyFocus } from '@/lib/types';
import { getDailyTarot, getDayRuler, calcNumerology } from '@/lib/cosmic';

type Phase = 'morning' | 'day' | 'night' | 'summary';

type StepField = {
  key: string;
  render: (entry: DiaryEntry, set: <K extends keyof DiaryEntry>(k: K, v: DiaryEntry[K]) => void) => ReactNode;
};

const PHASE_STEPS: Record<Phase, StepField[][]> = {
  morning: [
    [
      { key: 'bed', render: (e, set) => <Field label="Bedtime" value={e.bed || ''} onChange={(v) => set('bed', v)} /> },
      { key: 'wake', render: (e, set) => <Field label="Awakened" value={e.wake || ''} onChange={(v) => set('wake', v)} /> },
      { key: 'sleep', render: (e, set) => <Slider label="Hours slept" value={e.sleep ?? 7} min={0} max={14} step={0.5} suffix="h" onChange={(v) => set('sleep', v)} /> },
    ],
    [
      { key: 'dreamsLogged', render: (e, set) => <label className="gx-check"><input type="checkbox" checked={!!e.dreamsLogged} onChange={(ev) => set('dreamsLogged', ev.target.checked)} /> Recorded dreams</label> },
      { key: 'dreams', render: (e, set) => <Area label="Dream notes" value={e.dreams || ''} onChange={(v) => set('dreams', v)} /> },
      { key: 'wakeMood', render: (e, set) => <Field label="Mood on waking" value={e.wakeMood || ''} onChange={(v) => set('wakeMood', v)} /> },
    ],
    [
      { key: 'wakeMoodWhy', render: (e, set) => <Field label="Why?" value={e.wakeMoodWhy || ''} onChange={(v) => set('wakeMoodWhy', v)} /> },
      { key: 'morningPractice', render: (e, set) => <Area label="Morning practice" value={e.morningPractice || ''} onChange={(v) => set('morningPractice', v)} /> },
      { key: 'morningMins', render: (e, set) => <Field label="Duration (min)" value={String(e.morningMins ?? '')} onChange={(v) => set('morningMins', Number(v) || 0)} /> },
    ],
  ],
  day: [
    [
      { key: 'divinity', render: (e, set) => <Slider label="Remembrance of divinity" value={e.divinity ?? 5} min={0} max={10} onChange={(v) => set('divinity', v)} /> },
      { key: 'pray', render: (e, set) => <Field label="Prayer" value={e.pray || ''} onChange={(v) => set('pray', v)} /> },
      { key: 'study', render: (e, set) => <Field label="Study" value={e.study || ''} onChange={(v) => set('study', v)} /> },
    ],
    [
      { key: 'studyLearned', render: (e, set) => <Area label="What did you learn?" value={e.studyLearned || ''} onChange={(v) => set('studyLearned', v)} /> },
      { key: 'tongue', render: (e, set) => <Field label="Tongue control" value={e.tongue || ''} onChange={(v) => set('tongue', v)} /> },
      { key: 'service', render: (e, set) => <Area label="Service" value={e.service || ''} onChange={(v) => set('service', v)} /> },
    ],
    [
      { key: 'useless', render: (e, set) => <Field label="Useless hours" value={String(e.useless ?? '')} onChange={(v) => set('useless', Number(v) || 0)} /> },
      { key: 'chastity', render: (e, set) => <label className="gx-check"><input type="checkbox" checked={!!e.chastity} onChange={(ev) => set('chastity', ev.target.checked)} /> Kept chastity</label> },
      { key: 'ate', render: (e, set) => (
        <>
          <label className="gx-check"><input type="checkbox" checked={!!e.ateConsciously} onChange={(ev) => set('ateConsciously', ev.target.checked)} /> Ate consciously</label>
          <label className="gx-check"><input type="checkbox" checked={!!e.ateProperly} onChange={(ev) => set('ateProperly', ev.target.checked)} /> Ate properly</label>
        </>
      ) },
    ],
    [
      { key: 'diet', render: (e, set) => <Field label="Diet" value={e.diet || ''} onChange={(v) => set('diet', v)} /> },
      { key: 'dietEffects', render: (e, set) => <Area label="Diet effects" value={e.dietEffects || ''} onChange={(v) => set('dietEffects', v)} /> },
      { key: 'mood', render: (e, set) => <Slider label="Mood" value={e.mood ?? 5} min={0} max={10} onChange={(v) => set('mood', v)} /> },
    ],
    [
      { key: 'moodWhy', render: (e, set) => <Field label="Mood why" value={e.moodWhy || ''} onChange={(v) => set('moodWhy', v)} /> },
      { key: 'moodEffect', render: (e, set) => <Area label="Mood effect on self/others" value={e.moodEffect || ''} onChange={(v) => set('moodEffect', v)} /> },
      { key: 'mantras', render: (e, set) => (
        <div className="gx-grid2">
          <Field label="Mantras" value={e.mantras || ''} onChange={(v) => set('mantras', v)} />
          <Field label="How much" value={e.mantraAmount || ''} onChange={(v) => set('mantraAmount', v)} />
        </div>
      ) },
    ],
    [
      { key: 'exercise', render: (e, set) => <Field label="Exercise" value={e.exercise || ''} onChange={(v) => set('exercise', v)} /> },
      { key: 'exerciseEffects', render: (e, set) => <Area label="Exercise effects" value={e.exerciseEffects || ''} onChange={(v) => set('exerciseEffects', v)} /> },
      { key: 'ego', render: (e, set) => (
        <>
          <Field label="Ego restraint" value={e.egoRestrained || ''} onChange={(v) => set('egoRestrained', v)} />
          <Area label="Visible impulses" value={e.egoVisible || ''} onChange={(v) => set('egoVisible', v)} />
        </>
      ) },
    ],
    ...DEFECTS.map((d) => [{
      key: d.id,
      render: (e: DiaryEntry, set: <K extends keyof DiaryEntry>(k: K, v: DiaryEntry[K]) => void) => {
        const ck = `${d.id}Count` as keyof DiaryEntry;
        const dk = `${d.id}Duration` as keyof DiaryEntry;
        const ak = `${d.id}Answer` as keyof DiaryEntry;
        return (
          <div className="gx-card" style={{ background: '#fff', marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <strong>{d.title}</strong>
              <div className="gx-btn-row">
                <button type="button" className="gx-btn gx-btn-ghost" onClick={() => set(ck, Math.max(0, Number(e[ck] || 0) - 1) as never)}>−</button>
                <b style={{ minWidth: 24, textAlign: 'center' }}>{Number(e[ck] || 0)}</b>
                <button type="button" className="gx-btn gx-btn-ghost" onClick={() => set(ck, (Number(e[ck] || 0) + 1) as never)}>+</button>
              </div>
            </div>
            <div className="gx-grid2">
              <Field label="Duration" value={String(e[dk] || '')} onChange={(v) => set(dk, v as never)} />
              <Field label="Answering" value={String(e[ak] || '')} onChange={(v) => set(ak, v as never)} />
            </div>
          </div>
        );
      },
    }] as StepField[]),
    [
      { key: 'other', render: (e, set) => <Field label="Other defect" value={e.otherDefectName || ''} onChange={(v) => set('otherDefectName', v)} /> },
      { key: 'habitFail', render: (e, set) => <Area label="Habit failure" value={e.habitFail || ''} onChange={(v) => set('habitFail', v)} /> },
      { key: 'habitDeal', render: (e, set) => <Area label="Dealing with yourself" value={e.habitDeal || ''} onChange={(v) => set('habitDeal', v)} /> },
    ],
  ],
  night: [
    [
      { key: 'conc', render: (e, set) => <Slider label="Concentration" value={e.conc ?? 5} min={0} max={10} onChange={(v) => set('conc', v)} /> },
      { key: 'concWhy', render: (e, set) => <Area label="Why this level?" value={e.concWhy || ''} onChange={(v) => set('concWhy', v)} /> },
      { key: 'medMins', render: (e, set) => <Field label="Meditation minutes" value={String(e.medMins ?? '')} onChange={(v) => set('medMins', Number(v) || 0)} /> },
    ],
    [
      { key: 'medDetail', render: (e, set) => <Area label="Meditation detail" value={e.medDetail || ''} onChange={(v) => set('medDetail', v)} /> },
      { key: 'retro', render: (e, set) => <Area label="Retrospection" value={e.retro || ''} onChange={(v) => set('retro', v)} /> },
      { key: 'retroLearned', render: (e, set) => <Area label="What did you learn?" value={e.retroLearned || ''} onChange={(v) => set('retroLearned', v)} /> },
    ],
    [
      { key: 'defectMed', render: (e, set) => (
        <div className="gx-grid2">
          <Field label="Defect meditated" value={e.defectMed || ''} onChange={(v) => set('defectMed', v)} />
          <Field label="How long" value={e.defectMedMins || ''} onChange={(v) => set('defectMedMins', v)} />
        </div>
      ) },
      { key: 'defectMedShowed', render: (e, set) => <Area label="What it showed" value={e.defectMedShowed || ''} onChange={(v) => set('defectMedShowed', v)} /> },
      { key: 'virtue', render: (e, set) => <Field label="Virtue" value={e.virtue || ''} onChange={(v) => set('virtue', v)} /> },
    ],
    [
      { key: 'virtueLearned', render: (e, set) => <Area label="Virtue learned" value={e.virtueLearned || ''} onChange={(v) => set('virtueLearned', v)} /> },
      { key: 'eradicate', render: (e, set) => <Field label="Eradicating" value={e.eradicate || ''} onChange={(v) => set('eradicate', v)} /> },
      { key: 'eradicateLearned', render: (e, set) => <Area label="What you learned" value={e.eradicateLearned || ''} onChange={(v) => set('eradicateLearned', v)} /> },
    ],
    [
      { key: 'obstacle', render: (e, set) => <Field label="Obstacle" value={e.obstacle || ''} onChange={(v) => set('obstacle', v)} /> },
      { key: 'antidote', render: (e, set) => <Field label="Antidote" value={e.antidote || ''} onChange={(v) => set('antidote', v)} /> },
      { key: 'antidoteApplied', render: (e, set) => <label className="gx-check"><input type="checkbox" checked={!!e.antidoteApplied} onChange={(ev) => set('antidoteApplied', ev.target.checked)} /> Applied antidote</label> },
    ],
  ],
  summary: [
    [
      { key: 'aware', render: (e, set) => <Slider label="Aware hours" value={e.aware ?? 6} min={0} max={24} suffix="h" onChange={(v) => set('aware', v)} /> },
      { key: 'mech', render: (e, set) => <Slider label="Mechanical hours" value={e.mech ?? 10} min={0} max={24} suffix="h" onChange={(v) => set('mech', v)} /> },
      { key: 'energy', render: (e, set) => (
        <>
          <p style={{ fontSize: 12, color: 'var(--ink-soft)', marginBottom: 8 }}>Energy investment</p>
          {([
            ['consciousness', 'Awakening consciousness'],
            ['external', 'External circumstances'],
            ['emotions', 'Emotional habits'],
          ] as [EnergyFocus, string][]).map(([v, label]) => (
            <label key={v} className="gx-check">
              <input type="radio" name="energy" checked={e.energy === v} onChange={() => set('energy', v)} />
              {label}
            </label>
          ))}
        </>
      ) },
    ],
    [
      { key: 'energy2', render: (e, set) => (
        <>
          {([
            ['intellect', 'Intellectual habits'],
            ['physical', 'Physical / worldly'],
          ] as [EnergyFocus, string][]).map(([v, label]) => (
            <label key={v} className="gx-check">
              <input type="radio" name="energy" checked={e.energy === v} onChange={() => set('energy', v)} />
              {label}
            </label>
          ))}
        </>
      ) },
      { key: 'tomorrow', render: (e, set) => <Area label="Improve tomorrow" value={e.tomorrow || ''} onChange={(v) => set('tomorrow', v)} /> },
    ],
  ],
};

export function DiaryPage() {
  const { user, patchEntry, toast } = useStore();
  const [active, setActive] = useState(dateKey());
  const [phase, setPhase] = useState<Phase>('morning');
  const [step, setStep] = useState(0);
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

  const steps = PHASE_STEPS[phase];
  const page = steps[Math.min(step, steps.length - 1)] || [];
  const isLast = step >= steps.length - 1;

  function selectPhase(id: Phase) {
    setPhase(id);
    setStep(0);
  }

  function next() {
    if (!isLast) {
      setStep((s) => s + 1);
      return;
    }
    const idx = phases.findIndex((p) => p.id === phase);
    if (idx < phases.length - 1) {
      setPhase(phases[idx + 1].id);
      setStep(0);
    } else {
      toast(`Locked · ${active}`);
    }
  }

  const leftExtra = (
    <div className="gx-left-extra">
      <div className="gx-left-phases">
        {phases.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`gx-left-phase ${phase === p.id ? 'on' : ''}`}
            onClick={() => selectPhase(p.id)}
          >
            <div className="ph" style={{ backgroundImage: `url(${p.img})` }} />
            <div>
              <strong>{p.title}</strong>
              <span>{p.sub}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <Shell leftExtra={leftExtra}>
      <h2>Diary</h2>
      <p className="sub">Active: {new Date(active + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>

      <div className="gx-days" style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 14 }}>
        {days.map((d) => {
          const k = dateKey(d);
          const has = user?.ledger[k] && Object.keys(user.ledger[k]).length > 0;
          return (
            <button
              key={k}
              type="button"
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

      <ModeToggle
        value={phase}
        onChange={(id) => selectPhase(id as Phase)}
        options={phases.map((p) => ({ id: p.id, label: p.title }))}
      />

      <p style={{ fontSize: 12, color: 'var(--ink-soft)', marginBottom: 8 }}>
        {phases.find((p) => p.id === phase)?.title} · step {step + 1}/{steps.length} · max 3 prompts
      </p>

      <div className="gx-card">
        {page.map((f) => <div key={f.key}>{f.render(entry, set)}</div>)}
      </div>

      <div className="gx-btn-row" style={{ marginTop: 14 }}>
        <button type="button" className="gx-btn gx-btn-ghost" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>Back</button>
        <button type="button" className="gx-btn gx-btn-primary" onClick={next}>
          {isLast ? (phase === 'summary' ? 'Lock entry' : 'Next phase') : 'Next'}
        </button>
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
