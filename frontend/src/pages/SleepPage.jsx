import { useMemo, useState } from 'react';
import { BedDouble, Clock3, Minus, Moon, Pencil, Plus, Sunrise, Trash2, X } from 'lucide-react';
import { EmptyState, Notice, PageHeader, ScoreInput, SummaryCard, Spinner } from '../components/Ui';
import { trackerApi } from '../lib/api';
import { average, formatDate, localDateKey } from '../lib/format';

export default function SleepPage({ token, entries, onSaved, notify }) {
  const [duration, setDuration] = useState('7.5');
  const [quality, setQuality] = useState(7);
  const [sleepDate, setSleepDate] = useState(localDateKey());
  const [bedtime, setBedtime] = useState('23:00');
  const [wakeTime, setWakeTime] = useState('06:30');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const sortedEntries = useMemo(() => [...entries].sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt)), [entries]);
  const recentEntries = sortedEntries.slice(0, 7);
  const averageDuration = average(recentEntries.map((entry) => entry.sleepDuration));
  const averageQuality = average(recentEntries.map((entry) => entry.sleepQuality));
  const durationSpread = recentEntries.length > 1
    ? Math.max(...recentEntries.map((entry) => Number(entry.sleepDuration))) - Math.min(...recentEntries.map((entry) => Number(entry.sleepDuration)))
    : null;
  const consistencyLabel = durationSpread === null ? 'Add another night' : durationSpread <= 1 ? 'Steady rhythm' : durationSpread <= 2 ? 'Some variation' : 'Wide variation';

  const adjustDuration = (amount) => {
    setDuration((current) => String(Math.min(24, Math.max(0, Number(current || 0) + amount))));
  };

  const updateTime = (field, value) => {
    const nextBedtime = field === 'bedtime' ? value : bedtime;
    const nextWakeTime = field === 'wakeTime' ? value : wakeTime;
    if (field === 'bedtime') setBedtime(value);
    else setWakeTime(value);
    if (!nextBedtime || !nextWakeTime) return;
    const [bedHour, bedMinute] = nextBedtime.split(':').map(Number);
    const [wakeHour, wakeMinute] = nextWakeTime.split(':').map(Number);
    let minutes = wakeHour * 60 + wakeMinute - (bedHour * 60 + bedMinute);
    if (minutes <= 0) minutes += 24 * 60;
    setDuration(String(Math.round((minutes / 60) * 4) / 4));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const wasEditing = Boolean(editingId);
      const payload = { sleepDuration: Number(duration), sleepQuality: quality, sleepDate, bedtime, wakeTime };
      if (editingId) await trackerApi.updateSleep(token, editingId, payload);
      else await trackerApi.createSleep(token, payload);
      setDuration('7.5');
      setQuality(7);
      setSleepDate(localDateKey());
      setBedtime('23:00');
      setWakeTime('06:30');
      setEditingId(null);
      await onSaved();
      notify(wasEditing ? 'Sleep log updated.' : 'Sleep log saved.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  };

  const beginEdit = (entry) => {
    setEditingId(entry._id);
    setDuration(String(entry.sleepDuration));
    setQuality(entry.sleepQuality || 7);
    setSleepDate(entry.sleepDate || localDateKey(new Date(entry.createdAt)));
    setBedtime(entry.bedtime || '23:00');
    setWakeTime(entry.wakeTime || '06:30');
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDuration('7.5');
    setQuality(7);
    setSleepDate(localDateKey());
    setBedtime('23:00');
    setWakeTime('06:30');
    setError('');
  };

  const deleteEntry = async (entry) => {
    if (!window.confirm('Delete this sleep log? You can restore it for a few seconds.')) return;
    try {
      await trackerApi.deleteSleep(token, entry._id);
      if (editingId === entry._id) cancelEdit();
      await onSaved();
      notify('Sleep log removed.', {
        actionLabel: 'Undo',
        onAction: async () => {
          await trackerApi.createSleep(token, {
            sleepDuration: entry.sleepDuration,
            sleepQuality: entry.sleepQuality,
            sleepDate: entry.sleepDate,
            bedtime: entry.bedtime,
            wakeTime: entry.wakeTime,
          });
          await onSaved();
          notify('Sleep log restored.');
        },
      });
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <div className="page-enter app-page sleep-page">
      <PageHeader
        eyebrow="Sleep tracker"
        title="Rest is part of the story."
        description="Record duration and quality so you can compare sleep with changes in your mood."
      />

      <section className="page-summary" aria-label="Sleep summary">
        <SummaryCard Icon={Moon} label="Seven-night average" value={averageDuration === null ? '—' : `${averageDuration}h`} detail={`Across ${recentEntries.length} recorded night${recentEntries.length === 1 ? '' : 's'}`} />
        <SummaryCard Icon={BedDouble} label="Rest quality" value={averageQuality === null ? '—' : `${averageQuality}/10`} detail="Your personal average" />
        <SummaryCard Icon={Clock3} label="Consistency" value={consistencyLabel} compact detail={durationSpread === null ? 'Keep tracking to compare' : `${Math.round(durationSpread * 10) / 10}h range`} />
      </section>

      <div className="tracker-layout">
        <form className="card p-5 sm:p-7" onSubmit={handleSubmit}>
          <div className="flex items-center justify-between gap-3">
            <div><p className="eyebrow">{editingId ? 'Editing record' : 'New record'}</p><h2 className="mt-2 section-title">{editingId ? 'Update sleep log' : 'Last night’s sleep'}</h2></div>
            {editingId && <button type="button" onClick={cancelEdit} className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100" aria-label="Cancel editing"><X size={17} /></button>}
          </div>
          <div className="mt-7 rounded-[1.35rem] border border-pine-100 bg-gradient-to-br from-pine-50/80 to-white p-4">
            <div className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold text-pine-950">Your sleep window</p><p className="mt-1 text-xs text-slate-500">Bedtime and wake time automatically estimate duration.</p></div><Clock3 size={18} className="text-pine-600" /></div>
            <label className="mt-4 block text-xs font-bold text-slate-500" htmlFor="sleep-date">Night of</label>
            <input id="sleep-date" className="field mt-1.5" type="date" max={localDateKey()} value={sleepDate} onChange={(event) => setSleepDate(event.target.value)} />
            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="text-xs font-bold text-slate-500" htmlFor="bedtime"><Moon size={13} className="mr-1 inline" /> Bedtime<input id="bedtime" className="field mt-1.5" type="time" value={bedtime} onChange={(event) => updateTime('bedtime', event.target.value)} /></label>
              <label className="text-xs font-bold text-slate-500" htmlFor="wake-time"><Sunrise size={13} className="mr-1 inline" /> Wake time<input id="wake-time" className="field mt-1.5" type="time" value={wakeTime} onChange={(event) => updateTime('wakeTime', event.target.value)} /></label>
            </div>
          </div>
          <div className="mt-7">
            <label className="field-label" htmlFor="sleep-duration">Duration in hours</label>
            <div className="grid grid-cols-[3rem_1fr_3rem] overflow-hidden rounded-xl border border-slate-200 bg-white">
              <button type="button" onClick={() => adjustDuration(-0.5)} className="grid place-items-center border-r border-slate-200 text-slate-500 transition hover:bg-pine-50 hover:text-pine-800" aria-label="Reduce sleep by 30 minutes">
                <Minus size={17} />
              </button>
              <div className="relative">
                <input
                  id="sleep-duration"
                  className="w-full border-0 bg-transparent px-4 py-3 text-center text-lg font-semibold text-pine-950 focus:outline-none"
                  type="number"
                  min="0"
                  max="24"
                  step="0.25"
                  value={duration}
                  onChange={(event) => setDuration(event.target.value)}
                  required
                />
                <span className="sr-only">hours</span>
              </div>
              <button type="button" onClick={() => adjustDuration(0.5)} className="grid place-items-center border-l border-slate-200 text-slate-500 transition hover:bg-pine-50 hover:text-pine-800" aria-label="Increase sleep by 30 minutes">
                <Plus size={17} />
              </button>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {[6, 7, 8, 9].map((hours) => (
                <button
                  key={hours}
                  type="button"
                  onClick={() => setDuration(String(hours))}
                  aria-pressed={Number(duration) === hours}
                  className={`rounded-lg border py-2 text-xs font-bold transition ${
                    Number(duration) === hours ? 'border-pine-600 bg-pine-50 text-pine-800' : 'border-slate-200 text-slate-400 hover:border-pine-300'
                  }`}
                >
                  {hours}h
                </button>
              ))}
            </div>
          </div>
          <div className="mt-7">
            <ScoreInput id="sleep-quality" label="Sleep quality" value={quality} onChange={setQuality} lowLabel="Restless" highLabel="Deeply rested" />
          </div>
          {error && <div className="mt-6"><Notice type="error">{error}</Notice></div>}
          <button className="primary-button mt-7 w-full" type="submit" disabled={submitting}>
            {submitting && <Spinner />}{submitting ? 'Saving' : editingId ? 'Update sleep log' : 'Save sleep log'}
          </button>
        </form>

        <section className="card p-5 sm:p-7">
          <div className="flex items-end justify-between gap-4">
            <div><p className="eyebrow">Night by night</p><h2 className="mt-2 section-title">Sleep history</h2></div>
            <span className="rounded-xl bg-pine-50 px-3 py-2 text-xs font-bold text-pine-700">{entries.length} nights</span>
          </div>
          <div className="mt-6">
            {sortedEntries.length ? (
              <div>
                <div className="mb-4 flex h-32 items-end gap-2 rounded-[1.35rem] border border-pine-100 bg-pine-50/55 p-4" aria-label="Recent sleep duration chart">
                  {[...recentEntries].reverse().map((entry) => (
                    <div key={`bar-${entry._id}`} className="flex h-full flex-1 flex-col items-center justify-end gap-2" title={`${entry.sleepDuration} hours`}><span className="w-full rounded-md bg-pine-300 transition hover:bg-pine-400" style={{ height: `${Math.max(12, Math.min(100, (Number(entry.sleepDuration) / 10) * 100))}%` }} /><span className="text-xs font-bold text-slate-400">{new Intl.DateTimeFormat('en-US', { weekday: 'narrow' }).format(new Date(entry.createdAt))}</span></div>
                  ))}
                </div>
                <div className="sleep-history-grid grid gap-3">
                {sortedEntries.map((entry) => (
                  <article key={entry._id} className="sleep-record record-card">
                    <div className="record-heading">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-pine-100 text-pine-700"><BedDouble size={18} /></span>
                        <div>
                          <time className="text-sm font-semibold text-pine-950">{formatDate(entry.createdAt, { year: true })}</time>
                          {(entry.bedtime || entry.wakeTime) && <p className="mt-1 text-xs text-slate-500">{entry.bedtime || '—'} – {entry.wakeTime || '—'}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => beginEdit(entry)} className="grid h-10 w-10 place-items-center rounded-lg text-slate-400 hover:bg-pine-50 hover:text-pine-700" aria-label="Edit sleep log"><Pencil size={15} /></button>
                        <button type="button" onClick={() => deleteEntry(entry)} className="grid h-10 w-10 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Delete sleep log"><Trash2 size={15} /></button>
                      </div>
                    </div>
                    <div className="sleep-record-metrics">
                      <p className="text-2xl font-semibold tabular-nums text-pine-950">{entry.sleepDuration}<span className="ml-1.5 text-xs font-normal text-slate-500">hours</span></p>
                      <div className="flex min-w-0 items-center gap-3">
                        <p className="shrink-0 text-xs text-slate-500">Quality <span className="font-semibold text-pine-800">{entry.sleepQuality ?? '—'}/10</span></p>
                        <div className="h-1.5 w-full max-w-24 overflow-hidden rounded-full bg-pine-100" aria-hidden="true"><div className="h-full rounded-full bg-pine-400" style={{ width: `${(entry.sleepQuality || 0) * 10}%` }} /></div>
                      </div>
                    </div>
                  </article>
                ))}
                </div>
              </div>
            ) : (
              <EmptyState symbol={<Moon size={20} />} title="No sleep logs yet" message="Add last night’s sleep to start comparing rest and mood." />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
