import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BellRing,
  Brain,
  Check,
  HeartHandshake,
  LockKeyhole,
  Languages,
  MoonStar,
  Pill,
  ShieldCheck,
  Sparkles,
  SunMedium,
  X,
} from 'lucide-react';
import useDialogFocus from '../hooks/useDialogFocus';
import { createTranslator, SUPPORTED_LOCALES } from '../lib/i18n';
import { DEFAULT_PREFERENCES, WELLBEING_GOALS } from '../lib/preferences';

const GOAL_ICONS = {
  mood: Brain,
  stress: HeartHandshake,
  sleep: MoonStar,
  routine: SunMedium,
  medication: Pill,
};

export default function OnboardingModal({ open, preferences, onSave, onClose, userName }) {
  const dialogRef = useRef(null);
  useDialogFocus(dialogRef, open);
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState({ ...DEFAULT_PREFERENCES, ...preferences });
  const t = createTranslator(draft.locale);
  const steps = [
    { title: t('onboarding.goalTitle', 'What would feel most helpful?'), eyebrow: t('onboarding.goalEyebrow', 'Make MindHaven yours') },
    { title: t('onboarding.rhythmTitle', 'Choose a gentle rhythm.'), eyebrow: t('onboarding.rhythmEyebrow', 'Your daily routine') },
    { title: t('onboarding.readyTitle', 'Your space is ready.'), eyebrow: t('onboarding.readyEyebrow', 'Private by design') },
  ];

  useEffect(() => {
    if (!open) return undefined;
    setDraft({ ...DEFAULT_PREFERENCES, ...preferences });
    setStep(0);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && preferences?.completedOnboarding) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, open, preferences]);

  if (!open) return null;

  const toggleGoal = (goalId) => {
    setDraft((current) => {
      const selected = current.goals.includes(goalId);
      if (selected && current.goals.length === 1) return current;
      return {
        ...current,
        goals: selected
          ? current.goals.filter((item) => item !== goalId)
          : [...current.goals, goalId].slice(0, 3),
      };
    });
  };

  const finish = () => onSave({ ...draft, completedOnboarding: true });
  const currentStep = steps[step];
  const firstName = userName?.split(' ')[0] || 'there';

  return (
    <div className="dialog-overlay fixed inset-0 z-[80] grid place-items-center overflow-y-auto bg-pine-950/65 px-3 py-6 backdrop-blur-md" role="presentation">
      <section
        ref={dialogRef}
        tabIndex={-1}
        className="app-dialog page-enter relative w-full max-w-3xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-pine-300 via-pine-500 to-pine-800" />
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-pine-100 blur-3xl" />

        {preferences?.completedOnboarding && (
          <button type="button" onClick={onClose} className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-white text-slate-400 shadow-sm transition hover:text-pine-800" aria-label="Close preferences">
            <X size={18} />
          </button>
        )}

        <div className="relative border-b border-pine-100 px-5 pb-5 pt-7 sm:px-9 sm:pt-9">
          <div className="flex items-center gap-2" aria-label={`Step ${step + 1} of ${steps.length}`}>
            {steps.map((item, index) => (
              <span key={item.title} className={`h-1.5 flex-1 rounded-full transition ${index <= step ? 'bg-pine-600' : 'bg-pine-100'}`} />
            ))}
          </div>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-pine-600">{currentStep.eyebrow}</p>
          <h2 id="onboarding-title" className="mt-2 max-w-2xl text-3xl font-semibold tracking-[-0.045em] text-pine-950 sm:text-4xl">{currentStep.title}</h2>
          {step === 0 && <p className="mt-2 text-sm leading-6 text-slate-500">{t('onboarding.goalDescription', 'Choose up to three priorities. We’ll bring the most useful actions forward for you.')}</p>}
        </div>

        <div className="relative px-5 py-6 sm:px-9 sm:py-8">
          {step === 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {WELLBEING_GOALS.map((goal) => {
                const Icon = GOAL_ICONS[goal.id];
                const selected = draft.goals.includes(goal.id);
                return (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => toggleGoal(goal.id)}
                    aria-pressed={selected}
                    className={`group flex items-start gap-4 rounded-[1.35rem] border p-4 text-left transition duration-300 ${selected ? 'border-pine-500 bg-pine-50 shadow-sm' : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-pine-200 hover:shadow-md'}`}
                  >
                    <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl transition ${selected ? 'bg-pine-700 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-pine-100 group-hover:text-pine-700'}`}>
                      <Icon size={19} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2 text-sm font-semibold text-pine-950">{goal.label}{selected && <Check size={16} className="text-pine-600" />}</span>
                      <span className="mt-1 block text-xs leading-5 text-slate-500">{goal.description}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {step === 1 && (
            <div className="mx-auto max-w-xl">
              <fieldset className="mb-4 rounded-[1.5rem] border border-pine-100 bg-white p-5">
                <legend className="px-1 text-sm font-bold text-pine-950"><Languages size={16} className="mr-2 inline" />{t('onboarding.language', 'Language')}</legend>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {SUPPORTED_LOCALES.map((language) => (
                    <label key={language.id} className={`cursor-pointer rounded-xl border px-4 py-3 text-center text-sm font-bold transition ${draft.locale === language.id ? 'border-pine-500 bg-pine-50 text-pine-800' : 'border-slate-200 text-slate-500'}`}>
                      <input type="radio" name="locale" value={language.id} checked={draft.locale === language.id} onChange={() => setDraft((current) => ({ ...current, locale: language.id }))} className="sr-only" />
                      {language.nativeLabel}
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="rounded-[1.5rem] border border-pine-100 bg-gradient-to-br from-white to-pine-50/70 p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-pine-800 text-white"><BellRing size={20} /></span>
                  <div><p className="font-semibold text-pine-950">When do you usually reflect?</p><p className="mt-1 text-sm leading-6 text-slate-500">This time appears as an in-app cue. MindHaven will never send notifications without permission.</p></div>
                </div>
                <label className="mt-6 block text-sm font-bold text-pine-950" htmlFor="reflection-time">Preferred reflection time</label>
                <input id="reflection-time" className="field mt-2" type="time" value={draft.reminderTime} onChange={(event) => setDraft((current) => ({ ...current, reminderTime: event.target.value }))} />
              </div>

              <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-[1.35rem] border border-slate-200 bg-white p-4 transition hover:border-pine-200">
                <input type="checkbox" className="mt-1 h-4 w-4 accent-pine-700" checked={draft.gentlePrompts} onChange={(event) => setDraft((current) => ({ ...current, gentlePrompts: event.target.checked }))} />
                <span><span className="block text-sm font-semibold text-pine-950">{t('onboarding.gentlePrompts', 'Use gentle prompts')}</span><span className="mt-1 block text-xs leading-5 text-slate-500">Show supportive next steps and consistency cues without streak pressure.</span></span>
              </label>
              <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-[1.35rem] border border-slate-200 bg-white p-4 transition hover:border-pine-200">
                <input type="checkbox" className="mt-1 h-4 w-4 accent-pine-700" checked={draft.compactMotion} onChange={(event) => setDraft((current) => ({ ...current, compactMotion: event.target.checked }))} />
                <span><span className="block text-sm font-semibold text-pine-950">{t('onboarding.reduceMotion', 'Use less motion')}</span><span className="mt-1 block text-xs leading-5 text-slate-500">Reduce decorative animation and movement throughout MindHaven.</span></span>
              </label>
            </div>
          )}

          {step === 2 && (
            <div className="mx-auto max-w-xl text-center">
              <span className="mx-auto grid h-20 w-20 place-items-center rounded-[1.75rem] bg-gradient-to-br from-pine-700 to-pine-950 text-white shadow-lg"><Sparkles size={30} /></span>
              <h3 className="mt-5 text-2xl font-semibold tracking-tight text-pine-950">Welcome to your space, {firstName}.</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Your Today page will prioritize {draft.goals.map((id) => WELLBEING_GOALS.find((goal) => goal.id === id)?.shortLabel.toLowerCase()).filter(Boolean).join(', ')}.</p>
              <div className="mt-6 grid gap-3 text-left sm:grid-cols-2">
                <div className="rounded-2xl bg-pine-50 p-4"><ShieldCheck size={19} className="text-pine-700" /><p className="mt-3 text-sm font-semibold text-pine-950">Private records</p><p className="mt-1 text-xs leading-5 text-slate-500">Your trackers stay inside your authenticated account.</p></div>
                <div className="rounded-2xl bg-[#f3f5f1] p-4"><LockKeyhole size={19} className="text-pine-600" /><p className="mt-3 text-sm font-semibold text-pine-950">You own the data</p><p className="mt-1 text-xs leading-5 text-slate-500">Export your records or delete the account from Privacy.</p></div>
              </div>
            </div>
          )}
        </div>

        <footer className="relative flex items-center justify-between gap-3 border-t border-pine-200/60 bg-pine-50/70 px-5 py-4 sm:px-9">
          <button type="button" className="secondary-button" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0}>
            <ArrowLeft size={16} /> {t('onboarding.back', 'Back')}
          </button>
          {step < steps.length - 1 ? (
            <button type="button" className="primary-button" onClick={() => setStep((current) => current + 1)}>
              {t('onboarding.continue', 'Continue')} <ArrowRight size={16} />
            </button>
          ) : (
            <button type="button" className="primary-button min-w-40" onClick={finish}>
              {t('onboarding.enter', 'Enter MindHaven')} <ArrowRight size={16} />
            </button>
          )}
        </footer>
      </section>
    </div>
  );
}
