import { useMemo, useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronUp, Clock3, History, Pencil, Sparkles, Trash2, X } from 'lucide-react';
import { EmptyState, Notice, PageHeader, SummaryCard, Spinner } from '../components/Ui';
import { trackerApi } from '../lib/api';

const initialForm = { anxietyLevel: 5, sleepQuality: 6, energyLevel: 6, appetite: 6 };

const SIGNALS = [
  {
    key: 'anxietyLevel',
    label: 'Anxiety level',
    shortLabel: 'Anxiety',
    lowLabel: 'Calm',
    highLabel: 'Intense',
    descriptions: ['Very calm', 'Calm', 'Calm', 'Mild', 'Moderate', 'Moderate', 'Elevated', 'High', 'High', 'Intense'],
    tileClass: 'border-rose-100 bg-rose-50/70',
    textClass: 'text-rose-700',
    preferLower: true,
  },
  {
    key: 'sleepQuality',
    label: 'Sleep quality',
    shortLabel: 'Sleep',
    lowLabel: 'Restless',
    highLabel: 'Restful',
    descriptions: ['Very restless', 'Restless', 'Poor', 'Light', 'Fair', 'Fair', 'Good', 'Restful', 'Restful', 'Excellent'],
    tileClass: 'border-indigo-100 bg-indigo-50/70',
    textClass: 'text-indigo-700',
  },
  {
    key: 'energyLevel',
    label: 'Energy level',
    shortLabel: 'Energy',
    lowLabel: 'Drained',
    highLabel: 'Energized',
    descriptions: ['Drained', 'Very low', 'Low', 'Low', 'Steady', 'Steady', 'Good', 'Energized', 'High', 'Very high'],
    tileClass: 'border-pine-100 bg-pine-50/70',
    textClass: 'text-pine-700',
  },
  {
    key: 'appetite',
    label: 'Appetite',
    shortLabel: 'Appetite',
    lowLabel: 'Very low',
    highLabel: 'Strong',
    descriptions: ['Very low', 'Very low', 'Low', 'Low', 'Steady', 'Steady', 'Good', 'Good', 'Strong', 'Very strong'],
    tileClass: 'border-amber-100 bg-amber-50/70',
    textClass: 'text-amber-700',
  },
];

const isSameDay = (left, right) =>
  left.getFullYear() === right.getFullYear()
  && left.getMonth() === right.getMonth()
  && left.getDate() === right.getDate();

const formatEntryDay = (value) => {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (isSameDay(date, today)) return 'Today';
  if (isSameDay(date, yesterday)) return 'Yesterday';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
};

const formatEntryTime = (value) =>
  new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date(value));

function SignalInput({ signal, value, onChange }) {
  const progress = ((Number(value) - 1) / 9) * 100;
  const description = signal.descriptions[Math.max(0, Math.min(9, Number(value) - 1))];

  return (
    <div className="signal-control rounded-2xl border p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <label className="text-sm font-bold text-pine-950" htmlFor={`symptom-${signal.key}`}>{signal.label}</label>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${signal.tileClass} ${signal.textClass}`}>{description}</span>
          <span className="rounded-lg bg-white px-2.5 py-1 text-sm font-semibold text-pine-950 shadow-sm">{value}<span className="text-xs text-slate-400">/10</span></span>
        </div>
      </div>
      <input
        id={`symptom-${signal.key}`}
        className="range-track"
        style={{
          '--range-progress': `${progress}%`,
        }}
        type="range"
        min="1"
        max="10"
        step="1"
        aria-valuetext={`${value} out of 10 — ${description}`}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <div className="flex justify-between text-xs text-slate-500">
        <span>{signal.lowLabel}</span>
        <span>{signal.highLabel}</span>
      </div>
    </div>
  );
}

function ChangeBadge({ signal, value, previousValue }) {
  if (previousValue === undefined || previousValue === null) return null;
  const difference = Number(value) - Number(previousValue);
  if (!difference) return <span className="text-xs font-bold text-slate-400">No change</span>;

  const improving = signal.preferLower ? difference < 0 : difference > 0;
  return (
    <span className={`text-xs font-semibold ${improving ? 'text-pine-600' : 'text-pine-800'}`}>
      {difference > 0 ? '↑' : '↓'} {Math.abs(difference)} since previous
    </span>
  );
}

function SignalTile({ signal, entry, previousEntry }) {
  const value = entry?.[signal.key];
  return (
    <div className={`rounded-2xl border p-3.5 ${signal.tileClass}`}>
      <p className={`text-xs font-semibold ${signal.textClass}`}>{signal.shortLabel}</p>
      <div className="mt-2 flex items-end justify-between gap-2">
        <p className="text-2xl font-semibold tracking-tight text-pine-950">{value ?? '—'}<span className="text-xs font-bold text-slate-400">/10</span></p>
        <ChangeBadge signal={signal} value={value} previousValue={previousEntry?.[signal.key]} />
      </div>
    </div>
  );
}

function CompactEntry({ entry, previousEntry, onEdit, onDelete }) {
  return (
    <article className="signed-surface rounded-2xl border border-pine-100 px-4 py-4 transition hover:border-pine-200 hover:shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex min-w-32 items-start justify-between gap-2 sm:block">
          <div><p className="text-sm font-semibold text-pine-950">{formatEntryDay(entry.createdAt)}</p>
          <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-slate-400"><Clock3 size={12} /> {formatEntryTime(entry.createdAt)}</p></div>
          <div className="flex gap-1 sm:mt-2">
            <button type="button" onClick={() => onEdit(entry)} className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-pine-50 hover:text-pine-700" aria-label="Edit symptom check-in"><Pencil size={13} /></button>
            <button type="button" onClick={() => onDelete(entry)} className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Delete symptom check-in"><Trash2 size={13} /></button>
          </div>
        </div>
        <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-4">
          {SIGNALS.map((signal) => {
            const difference = previousEntry ? Number(entry[signal.key]) - Number(previousEntry[signal.key]) : 0;
            return (
              <div key={signal.key} className={`rounded-xl border px-3 py-2 ${signal.tileClass}`}>
                <p className={`text-xs font-semibold ${signal.textClass}`}>{signal.shortLabel}</p>
                <p className="mt-1 text-sm font-semibold text-pine-950">
                  {entry[signal.key] ?? '—'}<span className="text-xs text-slate-400">/10</span>
                  {difference !== 0 && <span className="ml-1.5 text-xs text-slate-400">{difference > 0 ? '↑' : '↓'}{Math.abs(difference)}</span>}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </article>
  );
}

export default function SymptomsPage({ token, entries, onSaved, notify }) {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showOlder, setShowOlder] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const sortedEntries = useMemo(
    () => [...entries].sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt)),
    [entries],
  );
  const latestEntry = sortedEntries[0];
  const previousEntry = sortedEntries[1];
  const olderEntries = sortedEntries.slice(1);
  const todayCount = sortedEntries.filter((entry) => isSameDay(new Date(entry.createdAt), new Date())).length;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const wasEditing = Boolean(editingId);
      if (editingId) await trackerApi.updateSymptoms(token, editingId, form);
      else await trackerApi.createSymptoms(token, form);
      setForm({ ...initialForm });
      setEditingId(null);
      setLastSavedAt(new Date());
      await onSaved();
      notify(wasEditing ? 'Symptom check-in updated.' : 'Symptom check-in saved.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  };

  const updateScore = (field) => (value) => setForm((current) => ({ ...current, [field]: value }));

  const beginEdit = (entry) => {
    setEditingId(entry._id);
    setForm({
      anxietyLevel: entry.anxietyLevel,
      sleepQuality: entry.sleepQuality,
      energyLevel: entry.energyLevel,
      appetite: entry.appetite,
    });
    setError('');
    setLastSavedAt(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ ...initialForm });
    setError('');
  };

  const deleteEntry = async (entry) => {
    if (!window.confirm('Delete this symptom check-in? You can restore it for a few seconds.')) return;
    try {
      await trackerApi.deleteSymptoms(token, entry._id);
      if (editingId === entry._id) cancelEdit();
      await onSaved();
      notify('Symptom check-in removed.', {
        actionLabel: 'Undo',
        onAction: async () => {
          await trackerApi.createSymptoms(token, {
            anxietyLevel: entry.anxietyLevel,
            sleepQuality: entry.sleepQuality,
            energyLevel: entry.energyLevel,
            appetite: entry.appetite,
          });
          await onSaved();
          notify('Symptom check-in restored.');
        },
      });
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <div className="page-enter app-page symptoms-page">
      <PageHeader
        eyebrow="Symptom tracker"
        title="Notice what your body is telling you."
        description="Track four simple signals together to build a fuller picture of your wellbeing."
      />

      <section className="page-summary" aria-label="Body signal summary">
        <SummaryCard Icon={CheckCircle2} label="Today’s check-ins" value={todayCount} detail="A snapshot of how your body feels" />
        <SummaryCard Icon={Clock3} label="Latest update" value={latestEntry ? formatEntryTime(latestEntry.createdAt) : 'Not logged yet'} compact detail={latestEntry ? formatEntryDay(latestEntry.createdAt) : 'Your first record starts here'} />
        <SummaryCard Icon={Sparkles} label="A gentle reminder" value="Notice what changes" compact detail="Log again when something noticeably changes." />
      </section>

      <div className="tracker-layout">
        <form className="card p-5 sm:p-7" onSubmit={handleSubmit}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow">{editingId ? 'Editing record' : 'New record'}</p>
              <h2 className="mt-2 section-title">{editingId ? 'Update these signals' : 'Today’s signals'}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">Use your best estimate. There are no wrong answers.</p>
            </div>
            {editingId
              ? <button type="button" onClick={cancelEdit} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200" aria-label="Cancel editing"><X size={18} /></button>
              : <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-pine-50 text-pine-600"><Sparkles size={18} /></span>}
          </div>

          <div className="mt-6 space-y-3">
            {SIGNALS.map((signal) => (
              <SignalInput key={signal.key} signal={signal} value={form[signal.key]} onChange={updateScore(signal.key)} />
            ))}
          </div>

          {error && <div className="mt-6"><Notice type="error">{error}</Notice></div>}
          <button className="primary-button mt-6 w-full" type="submit" disabled={submitting}>
            {submitting && <Spinner />}{submitting ? 'Saving' : editingId ? 'Update symptom check-in' : 'Save symptom check-in'}
          </button>
          {lastSavedAt && (
            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs font-bold text-pine-600">
              <CheckCircle2 size={14} /> Saved just now
            </p>
          )}
        </form>

        <section className="card p-5 sm:p-7">
          <div className="record-heading">
            <div>
              <p className="eyebrow">History</p>
              <h2 className="mt-2 section-title">Recent signals</h2>
              <p className="mt-2 text-sm text-slate-500">Compare check-ins to see what changed—not just the score.</p>
            </div>
            <span className="record-count">{entries.length} check-in{entries.length === 1 ? '' : 's'}</span>
          </div>

          <div className="mt-6">
            {latestEntry ? (
              <div>
                <article className="rounded-[1.35rem] border border-pine-200 bg-pine-50/35 p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-pine-600 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-white">Latest</span>
                        <p className="text-sm font-semibold text-pine-950">{formatEntryDay(latestEntry.createdAt)}</p>
                      </div>
                      <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-slate-400"><Clock3 size={13} /> {formatEntryTime(latestEntry.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <p className="mr-2 hidden text-xs font-semibold text-slate-400 sm:block">Compared with your previous check-in</p>
                      <button type="button" onClick={() => beginEdit(latestEntry)} className="grid h-10 w-10 place-items-center rounded-lg text-slate-400 hover:bg-white hover:text-pine-700" aria-label="Edit latest symptom check-in"><Pencil size={15} /></button>
                      <button type="button" onClick={() => deleteEntry(latestEntry)} className="grid h-10 w-10 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Delete latest symptom check-in"><Trash2 size={15} /></button>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {SIGNALS.map((signal) => (
                      <SignalTile key={signal.key} signal={signal} entry={latestEntry} previousEntry={previousEntry} />
                    ))}
                  </div>
                </article>

                {olderEntries.length > 0 && (
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => setShowOlder((current) => !current)}
                      aria-expanded={showOlder}
                      className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:border-pine-200 hover:bg-pine-50/40"
                    >
                      <span className="flex items-center gap-2 text-sm font-bold text-pine-950"><History size={16} className="text-pine-600" /> Earlier check-ins ({olderEntries.length})</span>
                      {showOlder ? <ChevronUp size={17} className="text-slate-400" /> : <ChevronDown size={17} className="text-slate-400" />}
                    </button>

                    {showOlder && (
                      <div className="mt-3 space-y-3 page-enter">
                        {olderEntries.map((entry, index) => (
                          <CompactEntry key={entry._id} entry={entry} previousEntry={sortedEntries[index + 2]} onEdit={beginEdit} onDelete={deleteEntry} />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <EmptyState symbol={<History size={18} />} title="No symptom logs yet" message="Your symptom check-ins will collect here for easy comparison." />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
