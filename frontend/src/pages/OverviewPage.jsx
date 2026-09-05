import { useEffect, useMemo, useRef, useState } from 'react';
import { Activity, ArrowRight, BellRing, CalendarDays, Check, CheckCircle2, Circle, Clock3, Compass, MoonStar, Plus, SmilePlus, Wind } from 'lucide-react';
import MoodSlider from '../components/MoodSlider';
import { RecentActivity, TodayChecklist, WeeklyRhythm } from '../components/OverviewPanels';
import { Spinner } from '../components/Ui';
import { getDailyCheckIn } from '../features/checkin/dailyCheckIn';
import { trackerApi } from '../lib/api';
import { bodySignalLabel } from '../lib/bodySignals';
import { localDateKey, moodLabel } from '../lib/format';
import { buildMoodWeek, buildTodayChecklist } from '../lib/overview';
import { primaryGoal } from '../lib/preferences';

const contextTags = ['work', 'study', 'family', 'weather'];

const FOCUS_GUIDANCE = {
  mood: {
    title: 'Make room for the feeling first.',
    detail: 'A mood score plus one honest sentence gives future patterns the context they need.',
    page: 'mood',
    action: 'Open journal',
  },
  stress: {
    title: 'Notice the body before solving the day.',
    detail: 'Name one physical sensation and what is happening around it. Repeated moments can reveal gentle patterns.',
    page: 'symptoms',
    action: 'Check body signals',
  },
  sleep: {
    title: 'Last night can explain part of today.',
    detail: 'Log duration and rest quality while the memory is still fresh.',
    page: 'sleep',
    action: 'Log last night',
  },
  routine: {
    title: 'Small and repeatable is enough.',
    detail: 'Complete one short check-in today. Consistency matters more than filling every tracker.',
    page: 'checkin',
    action: 'Start daily check-in',
  },
  medication: {
    title: 'Keep today’s treatment decision clear.',
    detail: 'Record taken or skipped exactly as it happened—without judgment.',
    page: 'medications',
    action: 'Review medication',
  },
};

export default function OverviewPage({ data, user, token, onSaved, notify, onNavigate, preferences }) {
  const [moodValue, setMoodValue] = useState(8);
  const [note, setNote] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [saveState, setSaveState] = useState('draft');
  const checkInRef = useRef(null);
  const todayKey = localDateKey();
  const todayDaily = useMemo(() => getDailyCheckIn(data, todayKey), [data, todayKey]);
  const todayMood = todayDaily.mood;
  const week = useMemo(() => buildMoodWeek(data.moods), [data.moods]);
  const checklist = useMemo(() => buildTodayChecklist(data), [data]);
  const firstName = user.name?.split(' ')[0] || 'there';
  const focus = primaryGoal(preferences);
  const focusGuidance = FOCUS_GUIDANCE[focus.id] || FOCUS_GUIDANCE.mood;
  const currentHour = new Date().getHours();
  const dayPart = currentHour < 12 ? 'A gentle start is enough.' : currentHour < 18 ? 'Pause for one honest moment.' : 'Close the day with a little clarity.';
  const todayLabel = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  useEffect(() => {
    if (todayMood) {
      setMoodValue(todayMood.moodValue);
      setNote(todayMood.note || '');
      setSelectedTags(todayDaily.tags);
      setSaveState('saved');
      return;
    }
    setMoodValue(8);
    setNote('');
    setSelectedTags([]);
    setSaveState('draft');
  }, [todayDaily, todayMood]);

  const activity = [
    ...data.moods.map((item) => ({ ...item, kind: 'Mood', page: 'mood', Icon: SmilePlus, summary: `${item.moodValue}/10 · ${item.note || moodLabel(item.moodValue)}` })),
    ...data.sleep.map((item) => ({ ...item, kind: 'Sleep', page: 'sleep', Icon: MoonStar, summary: `${item.sleepDuration} hours · Quality ${item.sleepQuality || 'not rated'}` })),
    ...data.symptoms.map((item) => ({
      ...item,
      kind: 'Body signals',
      page: 'symptoms',
      Icon: Activity,
      summary: item.sensations?.length
        ? `${item.sensations.slice(0, 2).map(bodySignalLabel).join(' + ')}${item.emotion ? ` · ${bodySignalLabel(item.emotion)}` : ''}`
        : `Anxiety ${item.anxietyLevel || '—'} · Energy ${item.energyLevel || '—'}`,
    })),
  ]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const startQuickCheckIn = () => {
    const reducedMotion = preferences?.compactMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    checkInRef.current?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
    checkInRef.current?.querySelector('input[type="range"]')?.focus({ preventScroll: true });
  };

  const toggleTag = (tag) => {
    setSaveState('draft');
    setSelectedTags((current) =>
      current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag],
    );
  };

  const saveQuickMood = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const payload = {
        moodValue,
        moodType: todayMood?.moodType || 'numeric',
        title: todayMood?.title || '',
        note: note.trim(),
        tags: selectedTags,
      };
      if (todayMood) {
        await trackerApi.updateMood(token, todayMood._id, payload);
      } else {
        await trackerApi.createMood(token, {
          ...payload,
          entryDate: todayKey,
          recordedAt: `${todayKey}T12:00:00.000Z`,
        });
      }
      await onSaved();
      setSaveState('saved');
      notify(todayMood ? 'Today’s check-in was updated.' : 'Today’s check-in is saved.');
    } catch (error) {
      notify(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="overview-page page-enter">
      <header className="signed-page-hero overview-hero relative mb-6 overflow-hidden text-white">
        <div className="pointer-events-none absolute -right-16 -top-28 h-80 w-80 rounded-full border border-white/10" aria-hidden="true" />
        <div className="pointer-events-none absolute -right-5 -top-16 h-56 w-56 rounded-full border border-white/10" aria-hidden="true" />
        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center lg:gap-8">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-pine-50">
              <span className="inline-flex items-center gap-2"><CalendarDays size={14} aria-hidden="true" />{todayLabel}</span>
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5">Focus: {focus.shortLabel}</span>
            </div>
            <h1 className="overview-greeting mt-4 max-w-3xl break-words">
              Hi {firstName}, <span className="text-pine-100">how are you feeling?</span>
            </h1>
            <p className="overview-hero-description mt-3 text-sm leading-6 text-pine-50">{dayPart} Take a moment to check in with yourself.</p>
          </div>
          <div className="flex shrink-0 flex-col items-start gap-2 lg:items-center">
            <button type="button" className="primary-button rounded-full px-6" onClick={() => onNavigate('checkin')}>
              <Plus size={17} aria-hidden="true" /> {todayMood ? 'Edit daily check-in' : 'Daily check-in'}
            </button>
            <p className="text-xs text-pine-50">One record per day · edit anytime</p>
          </div>
        </div>
      </header>

      <div className="overview-layout">
        <article ref={checkInRef} className="card overview-panel overview-checkin scroll-mt-24" aria-labelledby="quick-checkin-title">
          <form className="flex h-full flex-col" onSubmit={(event) => { event.preventDefault(); saveQuickMood(); }}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="eyebrow">Daily check-in · quick update</p>
                <h2 id="quick-checkin-title" className="overview-title mt-1">What feels closest right now?</h2>
              </div>
              <span className="overview-time-badge"><Clock3 size={13} aria-hidden="true" /> Under a minute</span>
            </div>
            <div className="mt-6">
              <MoodSlider value={moodValue} onChange={(value) => { setMoodValue(value); setSaveState('draft'); }} disabled={submitting} />
            </div>
            <div className="mt-5">
              <label htmlFor="quick-mood-note" className="mb-2 block text-xs font-bold text-pine-900">A short note <span className="ml-1 font-normal text-pine-700">(optional)</span></label>
              <input id="quick-mood-note" className="field" value={note} onChange={(event) => { setNote(event.target.value); setSaveState('draft'); }}
                maxLength="180" placeholder="What’s on your mind?" aria-label="Quick check-in note" disabled={submitting} />
            </div>
            <div className="overview-context mt-3 flex flex-wrap items-center gap-2" role="group" aria-label="Mood context">
              <span className="mr-1 text-xs font-semibold text-pine-700">Context</span>
              {contextTags.map((tag) => (
                <button key={tag} type="button" onClick={() => toggleTag(tag)} aria-pressed={selectedTags.includes(tag)} disabled={submitting}
                  className={`overview-context-chip ${selectedTags.includes(tag) ? 'is-selected' : ''}`}>
                  {tag}
                </button>
              ))}
            </div>
            <div className="mt-auto pt-5">
              <div className="flex flex-col justify-between gap-3 border-t border-pine-200/50 pt-4 sm:flex-row sm:items-center">
                <p className={`overview-save-status ${saveState === 'saved' ? 'is-saved' : ''}`} role="status">
                  {saveState === 'saved' && !submitting ? <CheckCircle2 size={15} aria-hidden="true" /> : <Circle size={10} aria-hidden="true" />}
                  {submitting ? 'Saving your check-in…' : saveState === 'saved' ? 'Today’s record saved · edit anytime' : 'Not saved yet'}
                </p>
                <button type="submit" className="primary-button w-full min-w-32 sm:w-auto" disabled={submitting}>
                  {submitting ? <Spinner /> : <Check size={17} aria-hidden="true" />} {submitting ? 'Saving' : todayMood ? 'Update' : 'Save'}
                </button>
              </div>
            </div>
          </form>
        </article>

        <TodayChecklist checklist={checklist} onNavigate={onNavigate} onStartCheckIn={startQuickCheckIn} />
        <WeeklyRhythm week={week} onNavigate={onNavigate} onStartCheckIn={startQuickCheckIn} />

        <aside className="card overview-panel overview-guidance" aria-labelledby="focus-guidance-title">
          <div className="overview-support-heading flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-pine-100/80 text-pine-700"><Compass size={19} aria-hidden="true" /></span>
            <div><p className="eyebrow">A gentle suggestion</p><p className="mt-1 text-xs text-pine-700">For {focus.shortLabel.toLowerCase()}</p></div>
          </div>
          <h2 id="focus-guidance-title" className="overview-title mt-5">{focusGuidance.title}</h2>
          <p className="mt-3 text-sm leading-6 text-pine-700">{focusGuidance.detail}</p>
          <button type="button" onClick={() => onNavigate(focusGuidance.page)} className="overview-text-button mt-4">{focusGuidance.action} <ArrowRight size={14} aria-hidden="true" /></button>
          {preferences?.gentlePrompts && (
            <p className="mt-5 flex items-center gap-2 border-t border-pine-200/50 pt-4 text-xs text-pine-700"><BellRing size={14} aria-hidden="true" /> Preferred check-in time <span className="ml-auto font-bold text-pine-900">{preferences.reminderTime || '20:00'}</span></p>
          )}
        </aside>

        <RecentActivity activity={activity} onNavigate={onNavigate} onStartCheckIn={startQuickCheckIn} />

        <section className="card overview-panel overview-wellness" aria-labelledby="overview-wellness-title">
          <div className="overview-support-heading flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-pine-100 text-pine-700"><Wind size={21} aria-hidden="true" /></span>
            <p className="eyebrow">Beyond tracking</p>
          </div>
          <h2 id="overview-wellness-title" className="overview-title mt-2">Make room for a pause.</h2>
          <p className="mt-2 text-sm leading-6 text-pine-700">Guided breathing and meditation, at your own pace.</p>
          <button type="button" onClick={() => onNavigate('wellness')} className="secondary-button mt-5 w-full">Explore wellness <ArrowRight size={15} aria-hidden="true" /></button>
        </section>
      </div>
    </div>
  );
}
