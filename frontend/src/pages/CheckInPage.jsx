import { useState } from 'react';
import { ArrowLeft, ArrowRight, CalendarDays, Check, MoonStar, Sparkles, Tag } from 'lucide-react';
import { Notice, PageHeader, ScoreInput, Spinner } from '../components/Ui';
import { trackerApi } from '../lib/api';
import { moodEmoji, moodLabel } from '../lib/format';

const moodChoices = [
  { value: 2, emoji: '😣', label: 'Rough' },
  { value: 4, emoji: '😕', label: 'Low' },
  { value: 6, emoji: '😐', label: 'Okay' },
  { value: 8, emoji: '🙂', label: 'Good' },
  { value: 10, emoji: '😁', label: 'Great' },
];

const suggestedTags = ['work', 'study', 'family', 'relationships', 'health', 'weather'];
const today = () => new Date().toISOString().slice(0, 10);
const initialForm = {
  date: today(),
  moodValue: 7,
  title: '',
  note: '',
  tags: [],
  anxietyLevel: 5,
  sleepQuality: 6,
  energyLevel: 6,
  appetite: 6,
  sleepDuration: 7,
};

export default function CheckInPage({ token, onSaved, notify, onNavigate }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const setValue = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const toggleTag = (tag) => setForm((current) => ({
    ...current,
    tags: current.tags.includes(tag)
      ? current.tags.filter((item) => item !== tag)
      : [...current.tags, tag],
  }));

  const saveCheckIn = async () => {
    setSubmitting(true);
    setError('');
    try {
      await trackerApi.createCheckIn(token, {
        recordedAt: `${form.date}T12:00:00.000Z`,
        mood: {
          moodValue: form.moodValue,
          moodType: 'emoji',
          title: form.title.trim(),
          note: form.note.trim(),
        },
        symptoms: {
          anxietyLevel: form.anxietyLevel,
          sleepQuality: form.sleepQuality,
          energyLevel: form.energyLevel,
          appetite: form.appetite,
        },
        sleep: {
          sleepDuration: form.sleepDuration,
          sleepQuality: form.sleepQuality,
        },
        tags: form.tags,
      });
      await onSaved();
      notify('Your complete daily check-in is saved.');
      onNavigate('overview');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-enter app-page checkin-page">
      <PageHeader
        eyebrow="Unified daily check-in"
        title="Capture the day as one connected story."
        description="Mood, context, symptoms, and sleep are saved together so later insights have something meaningful to compare."
        action={<button type="button" className="secondary-button" onClick={() => onNavigate('overview')}>Exit check-in</button>}
      />

      <div className="mx-auto max-w-5xl">
        <div className="checkin-progress mb-5 grid grid-cols-3 gap-2" aria-label="Check-in progress">
          {[
            [1, 'Mood & context'],
            [2, 'Body & sleep'],
            [3, 'Review'],
          ].map(([number, label]) => (
            <button
              key={number}
              type="button"
              onClick={() => number < step && setStep(number)}
              aria-current={step === number ? 'step' : undefined}
              disabled={number > step || submitting}
              className={`rounded-2xl border px-3 py-3 text-left transition ${
                step === number
                  ? 'border-pine-500 bg-pine-600 text-white shadow-sm'
                  : number < step
                    ? 'border-pine-200 bg-pine-50 text-pine-800'
                    : 'border-slate-200 bg-white text-slate-400'
              }`}
            >
              <span className="block text-xs font-semibold uppercase tracking-wide">Step {number}</span>
              <span className="mt-1 block text-xs font-bold sm:text-sm">{label}</span>
            </button>
          ))}
        </div>

        <section className="card overflow-hidden">
          <div className="border-b border-pine-100 bg-pine-50/60 px-5 py-4 sm:px-7">
            <div className="h-1.5 overflow-hidden rounded-full bg-pine-100">
              <div className="h-full rounded-full bg-pine-500 transition-all duration-300" style={{ width: `${(step / 3) * 100}%` }} />
            </div>
          </div>

          <div className="p-5 sm:p-8">
            {step === 1 && (
              <div className="page-enter">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <p className="eyebrow">Start with the feeling</p>
                    <h2 className="mt-2 section-title">How did this day feel overall?</h2>
                  </div>
                  <label className="flex items-center gap-2 rounded-xl border border-pine-100 bg-white px-3 py-2 text-xs font-bold text-pine-800">
                    <CalendarDays size={15} />
                    <input aria-label="Check-in date" className="min-w-0 bg-transparent" type="date" value={form.date} max={today()} onChange={(event) => setValue('date', event.target.value)} />
                  </label>
                </div>

                <div className="mt-7 grid grid-cols-5 gap-2" role="radiogroup" aria-label="Overall mood">
                  {moodChoices.map((choice) => (
                    <button
                      key={choice.value}
                      type="button"
                      role="radio"
                      aria-checked={form.moodValue === choice.value}
                      onClick={() => setValue('moodValue', choice.value)}
                      className={`rounded-2xl border px-2 py-4 text-center transition ${
                        form.moodValue === choice.value
                          ? 'border-pine-500 bg-pine-50 shadow-sm'
                          : 'border-slate-200 hover:border-pine-200 hover:bg-pine-50/40'
                      }`}
                    >
                      <span className="block text-2xl" aria-hidden="true">{choice.emoji}</span>
                      <span className="mt-2 block text-xs font-bold text-pine-950">{choice.label}</span>
                      <span className="mt-0.5 block text-xs font-semibold text-slate-400">{choice.value}/10</span>
                    </button>
                  ))}
                </div>

                <div className="mt-7 grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="field-label" htmlFor="checkin-title">Give this entry a short title</label>
                    <input id="checkin-title" className="field" maxLength="120" placeholder="A busy day, a small win, feeling unsettled..." value={form.title} onChange={(event) => setValue('title', event.target.value)} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="field-label" htmlFor="checkin-note">What shaped the day?</label>
                    <textarea id="checkin-note" className="field min-h-32 resize-y" maxLength="1000" placeholder="Write only as much as feels useful." value={form.note} onChange={(event) => setValue('note', event.target.value)} />
                    <p className="mt-2 text-right text-xs font-semibold text-slate-400">{form.note.length}/1000</p>
                  </div>
                </div>

                <div className="mt-5">
                  <p className="field-label flex items-center gap-2"><Tag size={15} /> Context tags</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        aria-pressed={form.tags.includes(tag)}
                        className={`rounded-full border px-3 py-2 text-xs font-bold transition ${
                          form.tags.includes(tag) ? 'border-pine-500 bg-pine-600 text-white' : 'border-slate-200 text-slate-500 hover:border-pine-300'
                        }`}
                      >
                        {form.tags.includes(tag) && <Check size={12} className="mr-1 inline" />} {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="page-enter">
                <p className="eyebrow">Add the context</p>
                <h2 className="mt-2 section-title">What was happening in your body?</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">Use your best estimate. These signals make future comparisons more useful.</p>

                <div className="mt-7 grid gap-5 md:grid-cols-2">
                  <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5">
                    <ScoreInput id="checkin-anxiety" label="Anxiety" value={form.anxietyLevel} onChange={(value) => setValue('anxietyLevel', value)} lowLabel="Calm" highLabel="Intense" />
                  </div>
                  <div className="rounded-2xl border border-pine-100 bg-pine-50/50 p-5">
                    <ScoreInput id="checkin-energy" label="Energy" value={form.energyLevel} onChange={(value) => setValue('energyLevel', value)} lowLabel="Drained" highLabel="Energized" />
                  </div>
                  <div className="rounded-2xl border border-sky-100 bg-sky-50/60 p-5">
                    <ScoreInput id="checkin-appetite" label="Appetite" value={form.appetite} onChange={(value) => setValue('appetite', value)} lowLabel="Very low" highLabel="Strong" />
                  </div>
                  <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-5">
                    <ScoreInput id="checkin-sleep-quality" label="Sleep quality" value={form.sleepQuality} onChange={(value) => setValue('sleepQuality', value)} lowLabel="Restless" highLabel="Restful" />
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-pine-200 bg-gradient-to-br from-pine-50 to-white p-5">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-pine-100 text-pine-700"><MoonStar size={18} /></span>
                      <div><p className="text-sm font-bold text-pine-950">Sleep duration</p><p className="text-xs text-slate-400">How long did you sleep?</p></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" className="secondary-button min-h-9 px-3 py-1" aria-label="Reduce sleep by 30 minutes" onClick={() => setValue('sleepDuration', Math.max(0, form.sleepDuration - 0.5))}>−</button>
                      <span className="min-w-20 text-center text-xl font-semibold text-pine-950">{form.sleepDuration}h</span>
                      <button type="button" className="secondary-button min-h-9 px-3 py-1" aria-label="Increase sleep by 30 minutes" onClick={() => setValue('sleepDuration', Math.min(24, form.sleepDuration + 0.5))}>+</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="page-enter">
                <div className="text-center">
                  <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-pine-50 text-3xl">{moodEmoji(form.moodValue)}</span>
                  <p className="mt-4 eyebrow">Review your check-in</p>
                  <h2 className="mt-2 section-title">{form.title || `${moodLabel(form.moodValue)} day`}</h2>
                  <p className="mt-2 text-sm text-slate-500">{form.date} · Mood {form.moodValue}/10</p>
                </div>

                <div className="mx-auto mt-7 grid max-w-3xl gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-rose-50/70 p-4"><p className="text-xs font-bold text-rose-700">Anxiety</p><p className="mt-2 text-2xl font-semibold text-pine-950">{form.anxietyLevel}/10</p></div>
                  <div className="rounded-2xl bg-indigo-50/70 p-4"><p className="text-xs font-bold text-indigo-700">Sleep</p><p className="mt-2 text-2xl font-semibold text-pine-950">{form.sleepDuration}h</p><p className="text-xs text-slate-400">Quality {form.sleepQuality}/10</p></div>
                  <div className="rounded-2xl bg-pine-50 p-4"><p className="text-xs font-bold text-pine-700">Energy</p><p className="mt-2 text-2xl font-semibold text-pine-950">{form.energyLevel}/10</p></div>
                </div>

                {(form.note || form.tags.length > 0) && (
                  <div className="signed-surface mx-auto mt-5 max-w-3xl rounded-2xl border border-pine-100 p-5">
                    {form.note && <p className="text-sm leading-6 text-slate-600">{form.note}</p>}
                    {form.tags.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{form.tags.map((tag) => <span key={tag} className="rounded-full bg-pine-50 px-2.5 py-1 text-xs font-bold text-pine-700">#{tag}</span>)}</div>}
                  </div>
                )}

                <div className="mx-auto mt-5 flex max-w-3xl items-start gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-500">
                  <Sparkles size={15} className="mt-0.5 shrink-0 text-pine-600" /> These measurements are personal observations, not a diagnosis.
                </div>
              </div>
            )}

            {error && <div className="mt-6"><Notice type="error">{error}</Notice></div>}

            <div className="checkin-footer mt-8 flex items-center justify-between gap-3 border-t border-slate-100 pt-6">
              <button type="button" className="secondary-button" onClick={() => setStep((current) => Math.max(1, current - 1))} disabled={step === 1 || submitting}>
                <ArrowLeft size={16} /> Back
              </button>
              {step < 3 ? (
                <button type="button" className="primary-button" onClick={() => setStep((current) => Math.min(3, current + 1))}>
                  Continue <ArrowRight size={16} />
                </button>
              ) : (
                <button type="button" className="primary-button min-w-48" onClick={saveCheckIn} disabled={submitting}>
                  {submitting ? <Spinner /> : <Check size={17} />}{submitting ? 'Saving check-in' : 'Save complete check-in'}
                </button>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
