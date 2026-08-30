import { useState } from 'react';
import { Check, Flower2, ShieldCheck, Timer, Wind } from 'lucide-react';
import { PageHeader } from '../components/Ui';
import WellnessPlayer from '../components/WellnessPlayer';
import { BREATHING_EXERCISES, MEDITATION_SESSIONS, meditationDuration } from '../lib/wellness';

export default function WellnessPage({ onNavigate, preferences }) {
  const [kind, setKind] = useState('breathing');
  const [breathingId, setBreathingId] = useState(BREATHING_EXERCISES[0].id);
  const [meditationId, setMeditationId] = useState(MEDITATION_SESSIONS[0].id);
  const [minutes, setMinutes] = useState(3);
  const breathing = kind === 'breathing';
  const practices = breathing ? BREATHING_EXERCISES : MEDITATION_SESSIONS;
  const selectedId = breathing ? breathingId : meditationId;
  const practice = practices.find((item) => item.id === selectedId);
  const durationMs = (breathing ? minutes * 60 : meditationDuration(practice)) * 1000;

  return (
    <div className="page-enter app-page wellness-page">
      <PageHeader
        eyebrow="Wellness tools"
        title="A softer moment starts here."
        description="Step away from the numbers. Follow a gentle breath or make a little room for the present, at your own pace."
        action={<span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-pine-950/15 px-4 py-3 text-sm font-bold text-pine-50"><Timer size={17} /> 1-8 minutes for you</span>}
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2" role="group" aria-label="Wellness practice type">
        {[
          { id: 'breathing', label: 'Guided breathing', description: 'An easy rhythm, one breath at a time.', Icon: Wind },
          { id: 'meditation', label: 'Guided meditation', description: 'Notice, pause, and gently begin again.', Icon: Flower2 },
        ].map(({ id, label, description, Icon }) => (
          <button key={id} type="button" onClick={() => setKind(id)} aria-pressed={kind === id} className={`wellness-choice flex items-center gap-4 border p-5 text-left transition hover:-translate-y-0.5 ${kind === id ? 'border-pine-600 bg-pine-900 text-white shadow-lg shadow-pine-900/10' : 'border-pine-200 bg-white/80 text-pine-900 hover:bg-pine-50'}`}>
            <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${kind === id ? 'bg-white/10 text-pine-100' : 'bg-pine-100 text-pine-700'}`}><Icon size={23} /></span>
            <span className="flex-1"><span className="block font-semibold">{label}</span><span className={`mt-1 block text-xs leading-5 ${kind === id ? 'text-pine-100' : 'text-slate-600'}`}>{description}</span></span>
            {kind === id && <Check size={18} className="shrink-0 text-pine-200" />}
          </button>
        ))}
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(17rem,0.78fr)_minmax(0,1.4fr)]">
        <aside className="card p-5 sm:p-6">
          <p className="eyebrow">Make it your moment</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-pine-950">{breathing ? 'Choose your rhythm' : 'Choose a session'}</h2>
          <div className="mt-5 space-y-3" role="group" aria-label={breathing ? 'Breathing exercise' : 'Meditation session'}>
            {practices.map((item) => (
              <button key={item.id} type="button" aria-pressed={item.id === selectedId} onClick={() => breathing ? setBreathingId(item.id) : setMeditationId(item.id)} className={`w-full rounded-2xl border p-4 text-left transition ${item.id === selectedId ? 'border-pine-500 bg-pine-50 shadow-sm' : 'border-pine-100 bg-white/70 hover:border-pine-300'}`}>
                <span className="flex items-center justify-between gap-3"><span className="text-sm font-semibold text-pine-950">{item.title}</span>{item.id === selectedId && <Check size={16} className="shrink-0 text-pine-700" />}</span>
                <span className="mt-1.5 block text-xs leading-5 text-slate-600">{item.description}</span>
                <span className="mt-3 inline-flex rounded-lg bg-white px-2 py-1 text-xs font-bold text-pine-800">
                  {breathing ? `${item.phases[0].seconds}s in / ${item.phases[1].seconds}s out / no holds` : `${meditationDuration(item) / 60} min / ${item.tag}`}
                </span>
              </button>
            ))}
          </div>

          {breathing && (
            <fieldset className="mt-6">
              <legend className="text-sm font-semibold text-pine-900">How much time do you have?</legend>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {[1, 3, 5].map((value) => (
                  <button key={value} type="button" onClick={() => setMinutes(value)} aria-pressed={minutes === value} className={`min-h-11 rounded-xl border text-sm font-bold transition ${minutes === value ? 'border-pine-700 bg-pine-700 text-white' : 'border-pine-200 bg-white text-pine-800 hover:bg-pine-50'}`}>{value} min</button>
                ))}
              </div>
            </fieldset>
          )}
          <p className="mt-5 text-xs leading-6 text-slate-500">Changing the practice or duration resets your timer. Session progress is not saved.</p>
          <div className="mt-5 rounded-2xl border border-pine-100 bg-white/75 p-4">
            <p className="flex items-center gap-2 text-xs font-semibold text-pine-800"><ShieldCheck size={16} /> Your comfort comes first</p>
            <p className="mt-2 text-xs leading-6 text-slate-600">Practise somewhere safe, never while driving. Keep your eyes open if you prefer. If you feel dizzy, breathless, or more distressed, stop and breathe normally.</p>
          </div>
        </aside>

        <WellnessPlayer key={`${kind}-${practice.id}-${durationMs}`} kind={kind} practice={practice} durationMs={durationMs} compactMotion={preferences?.compactMotion} onNavigate={onNavigate} />
      </div>

      <footer className="signed-surface mt-6 rounded-2xl border border-pine-100 px-5 py-5 text-xs leading-6 text-slate-600 sm:px-7">
        <p className="font-bold text-pine-900">A small practice, not a prescription.</p>
        <p>These general wellbeing tools do not diagnose or treat a condition, and are not a replacement for professional care. They may not suit everyone; stopping is always okay.</p>
        <p className="mt-2">Learn more: <a className="font-semibold text-pine-800 underline underline-offset-4" href="https://www.nhs.uk/mental-health/self-help/guides-tools-and-activities/breathing-exercises-for-stress/" target="_blank" rel="noreferrer">NHS breathing guidance (opens in a new tab)</a> · <a className="font-semibold text-pine-800 underline underline-offset-4" href="https://www.nhs.uk/mental-health/self-help/tips-and-support/mindfulness/" target="_blank" rel="noreferrer">NHS mindfulness guidance (opens in a new tab)</a></p>
      </footer>
    </div>
  );
}
