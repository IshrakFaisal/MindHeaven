import { useState } from 'react';
import { Activity, ArrowRight, Check, CheckCircle2, ChevronRight, MoonStar, Pill, SmilePlus } from 'lucide-react';
import { average, formatDate, formatRelativeDate, moodEmoji } from '../lib/format';

const trackerIcons = { mood: SmilePlus, sleep: MoonStar, symptoms: Activity, medications: Pill };

export function TodayChecklist({ checklist, onNavigate, onStartCheckIn }) {
  const { steps, completed, total, percent, nextStep } = checklist;
  return (
    <section className="card overview-panel overview-checklist" aria-labelledby="today-checklist-title">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Your daily overview</p>
          <h2 id="today-checklist-title" className="overview-title mt-1">Today’s checklist</h2>
        </div>
        <span className="overview-completion-count">{completed}<span>/{total}</span></span>
      </div>
      <p className="mt-2 text-xs leading-5 text-pine-700">A few small steps, at your own pace.</p>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-pine-100" role="progressbar" aria-label="Today’s tracking progress" aria-valuemin={0} aria-valuemax={total} aria-valuenow={completed} aria-valuetext={`${completed} of ${total} trackers completed today`}>
        <div className="h-full rounded-full bg-pine-600 transition-[width] duration-300" style={{ width: `${percent}%` }} />
      </div>
      <ul className="mt-3 divide-y divide-pine-200/40">
        {steps.map((step) => {
          const Icon = trackerIcons[step.id];
          return (
            <li key={step.id}>
              <button type="button" className="overview-tracker-row group" onClick={() => onNavigate(step.id)}>
                <span className={`overview-tracker-icon ${step.done ? 'is-complete' : ''}`}>
                  <Icon size={18} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="overview-tracker-name">{step.label}</span>
                  <span className="overview-tracker-detail">{step.detail}</span>
                </span>
                {step.done ? <span className="shrink-0 text-pine-700"><CheckCircle2 size={17} aria-hidden="true" /><span className="sr-only">Completed today</span></span>
                  : step.optional ? <span className="overview-optional-label">Optional</span>
                    : <ChevronRight size={16} className="shrink-0 text-pine-600 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />}
              </button>
            </li>
          );
        })}
      </ul>
      <div className="mt-auto pt-4">
        {nextStep ? (
          <button type="button" className="secondary-button w-full" onClick={() => nextStep.id === 'mood' ? onStartCheckIn() : onNavigate(nextStep.id)}>
            {nextStep.action} <ArrowRight size={15} aria-hidden="true" />
          </button>
        ) : (
          <p className="flex items-center gap-2 rounded-xl bg-pine-100/60 px-3 py-3 text-xs font-semibold text-pine-800"><Check size={16} aria-hidden="true" /> You’re all set for today. Come back anytime.</p>
        )}
      </div>
    </section>
  );
}

export function WeeklyRhythm({ week, onNavigate, onStartCheckIn }) {
  const [selectedDate, setSelectedDate] = useState(null);
  const recordedDays = week.filter((day) => day.average !== null);
  const weeklyAverage = average(recordedDays.map((day) => day.average));
  const selectedDay = week.find((day) => day.key === selectedDate) || week[week.length - 1];
  return (
    <section className="card overview-panel overview-weekly" aria-labelledby="weekly-rhythm-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">The bigger picture</p>
          <h2 id="weekly-rhythm-title" className="overview-title mt-1">Your weekly rhythm</h2>
          <p className="mt-1 text-xs text-pine-700">{formatDate(week[0].day)} – {formatDate(week[6].day)}</p>
        </div>
        <button type="button" className="overview-text-button" onClick={() => onNavigate('reports')}>View insights <ArrowRight size={14} aria-hidden="true" /></button>
      </div>

      {recordedDays.length ? (
        <>
          <div className="mt-5 flex flex-wrap items-center gap-x-7 gap-y-3 border-b border-pine-200/50 pb-4">
            <div className="flex items-baseline gap-2"><span className="text-3xl font-semibold tracking-tight text-pine-950">{weeklyAverage}<span className="ml-0.5 text-sm font-medium text-pine-600">/10</span></span><span className="text-xs text-pine-700">daily average</span></div>
            <span className="text-xs text-pine-700"><strong className="text-sm font-semibold text-pine-900">{recordedDays.length} of 7</strong> days recorded</span>
          </div>
          <div className="mt-4 grid grid-cols-7 gap-2 sm:gap-4" role="group" aria-label="Daily average mood, scale 1 to 10">
            {week.map((day) => {
              const selected = selectedDay.key === day.key;
              return (
                <button key={day.key} type="button" onClick={() => setSelectedDate(day.key)} aria-pressed={selected}
                  aria-label={`${formatDate(day.day, { weekday: 'long' })}: ${day.average === null ? 'no check-in' : `${day.average} out of 10, ${day.count} check-in${day.count === 1 ? '' : 's'}`}`}
                  className={`overview-day group ${selected ? 'overview-day-selected' : ''}`}>
                  <span className="mb-2 text-xs font-bold text-pine-800" aria-hidden="true">{day.average ?? '—'}</span>
                  <span className="flex h-24 w-full items-end overflow-hidden rounded-lg bg-pine-100/55 sm:h-28" aria-hidden="true">
                    {day.average !== null && <span className={`w-full rounded-lg transition-all duration-300 ${selected ? 'bg-pine-600' : 'bg-pine-300 group-hover:bg-pine-400'}`} style={{ height: `${day.average * 10}%` }} />}
                  </span>
                  <span className="mt-2 text-xs font-semibold text-pine-700" aria-hidden="true">{day.label}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-4 border-t border-pine-200/50 pt-3 text-xs leading-5 text-pine-700" role="status">
            <span className="font-bold">{formatDate(selectedDay.day)}:</span> {selectedDay.average === null ? 'No mood check-in recorded.' : `${selectedDay.average}/10 average from ${selectedDay.count} check-in${selectedDay.count === 1 ? '' : 's'}.`}
          </p>
        </>
      ) : (
        <div className="overview-empty-week mt-5">
          <svg className="overview-reflection-art" viewBox="0 0 120 110" fill="none" aria-hidden="true" focusable="false">
            <circle cx="59" cy="55" r="47" fill="#e0eee4" />
            <rect x="31" y="18" width="59" height="78" rx="10" transform="rotate(9 31 18)" fill="#c5dece" />
            <rect x="28" y="14" width="59" height="78" rx="10" fill="#f8fcf8" stroke="#a5c9b4" />
            <path d="M41 34h31M41 44h23M41 64h24M41 74h17" stroke="#bed6c7" strokeWidth="3" strokeLinecap="round" />
            <path d="M78 79c-8-15-3-28 13-32 4 15-1 26-13 32Z" fill="#70a68a" />
            <path d="m78 88 9-32" stroke="#397558" strokeWidth="2" strokeLinecap="round" />
            <circle cx="28" cy="82" r="5" fill="#ddbd86" />
          </svg>
          <div>
            <h3 className="text-base font-bold text-pine-950">Your week starts with one check-in.</h3>
            <p className="mt-1 max-w-md text-sm leading-6 text-pine-700">No mood entries in the last 7 days. Add a check-in to start seeing your own rhythm here.</p>
            <button type="button" className="overview-text-button mt-2" onClick={onStartCheckIn}>Add your first check-in <ArrowRight size={14} aria-hidden="true" /></button>
          </div>
        </div>
      )}
    </section>
  );
}

export function RecentActivity({ activity, onNavigate, onStartCheckIn }) {
  return (
    <section className="card overview-panel overview-activity" aria-labelledby="recent-activity-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Your personal timeline</p>
          <h2 id="recent-activity-title" className="overview-title mt-1">Recent activity</h2>
        </div>
        <button type="button" onClick={() => onNavigate('mood')} className="overview-text-button">Open journal <ArrowRight size={14} aria-hidden="true" /></button>
      </div>
      {activity.length ? (
        <ol className="mt-4 divide-y divide-pine-200/40">
          {activity.map((item) => (
            <li key={`${item.kind}-${item._id}`}>
              <button type="button" className="overview-activity-row group" onClick={() => onNavigate(item.page)}>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-pine-100/70 text-pine-700"><item.Icon size={18} aria-hidden="true" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block break-words text-sm font-bold leading-6 text-pine-950">{item.summary}</span>
                  <span className="mt-0.5 block text-xs text-pine-700">{item.kind} · <time dateTime={item.createdAt}>{formatRelativeDate(item.createdAt)}</time></span>
                </span>
                {item.kind === 'Mood' && <span className="hidden text-xl sm:block" aria-hidden="true">{moodEmoji(item.moodValue)}</span>}
                <ChevronRight size={16} className="shrink-0 text-pine-600 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ol>
      ) : (
        <div className="overview-empty-activity mt-5 flex items-start gap-4 p-4 sm:p-5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-pine-100 text-pine-700"><SmilePlus size={20} aria-hidden="true" /></span>
          <div><h3 className="text-sm font-bold text-pine-950">A fresh page, just for you.</h3><p className="mt-1 text-sm leading-6 text-pine-700">Your mood, sleep, and body-signal entries will appear here.</p><button type="button" onClick={onStartCheckIn} className="overview-text-button mt-1">Start with how you feel <ArrowRight size={14} aria-hidden="true" /></button></div>
        </div>
      )}
    </section>
  );
}
