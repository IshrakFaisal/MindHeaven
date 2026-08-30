import { useMemo, useState } from 'react';
import { CalendarDays, Check, Flame, Pencil, Search, Sparkles, Tag, Trash2, X } from 'lucide-react';
import { EmptyState, Notice, PageHeader, SummaryCard, Spinner } from '../components/Ui';
import MoodSlider from '../components/MoodSlider';
import { trackerApi } from '../lib/api';
import { average, formatDate, localDateKey, moodEmoji, moodLabel } from '../lib/format';

const initialForm = { moodValue: 7, moodType: 'numeric', title: '', note: '', tags: '' };

export default function MoodPage({ token, data, onSaved, notify }) {
  const [form, setForm] = useState(initialForm);
  const [historyRange, setHistoryRange] = useState('all');
  const [query, setQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const sortedMoods = useMemo(() => [...data.moods].sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt)), [data.moods]);
  const recentMoods = sortedMoods.filter((entry) => Date.now() - new Date(entry.createdAt).getTime() <= 7 * 24 * 60 * 60 * 1000);
  const recentAverage = average(recentMoods.map((entry) => entry.moodValue));
  const trackedDays = new Set(sortedMoods.map((entry) => localDateKey(new Date(entry.createdAt))));
  let currentStreak = 0;
  for (let offset = 0; offset < 365; offset += 1) {
    const day = new Date();
    day.setDate(day.getDate() - offset);
    if (!trackedDays.has(localDateKey(day))) break;
    currentStreak += 1;
  }
  const landscape = Array.from({ length: 14 }, (_, index) => {
    const day = new Date();
    day.setDate(day.getDate() - (13 - index));
    const dayKey = localDateKey(day);
    const dayEntries = sortedMoods.filter((entry) => localDateKey(new Date(entry.createdAt)) === dayKey);
    return { day, value: average(dayEntries.map((entry) => entry.moodValue)) };
  });

  const suggestedTags = ['work', 'study', 'family', 'weather', 'health', 'social'];
  const selectedTagLabels = form.tags.split(',').map((tag) => tag.trim()).filter(Boolean);
  const filteredMoods = sortedMoods.filter((entry) => {
    const inRange = historyRange === 'all'
      || Date.now() - new Date(entry.createdAt).getTime() <= Number(historyRange) * 24 * 60 * 60 * 1000;
    const tags = data.tagsByMood[entry._id] || [];
    const searchable = [entry.title, entry.note, ...tags.map((tag) => tag.label)].filter(Boolean).join(' ').toLowerCase();
    return inRange && searchable.includes(query.trim().toLowerCase());
  });

  const toggleTag = (tag) => {
    const nextTags = selectedTagLabels.includes(tag)
      ? selectedTagLabels.filter((item) => item !== tag)
      : [...selectedTagLabels, tag];
    setForm((current) => ({ ...current, tags: nextTags.join(', ') }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const tags = form.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 8);

      if (editingId) {
        await trackerApi.updateMood(token, editingId, {
          moodValue: form.moodValue,
          moodType: form.moodType,
          title: form.title.trim(),
          note: form.note.trim(),
          tags,
        });
      } else {
        const mood = await trackerApi.createMood(token, {
          moodValue: form.moodValue,
          moodType: form.moodType,
          title: form.title.trim(),
          note: form.note.trim(),
        });
        await Promise.all(tags.map((label) => trackerApi.createTag(token, { moodEntry: mood._id, label })));
      }
      setForm(initialForm);
      setEditingId(null);
      await onSaved();
      notify(editingId ? 'Journal entry updated.' : 'Mood check-in saved.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  };

  const beginEdit = (entry) => {
    const tags = data.tagsByMood[entry._id] || [];
    setEditingId(entry._id);
    setForm({
      moodValue: entry.moodValue,
      moodType: entry.moodType || 'numeric',
      title: entry.title || '',
      note: entry.note || '',
      tags: tags.map((tag) => tag.label).join(', '),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(initialForm);
    setError('');
  };

  const deleteEntry = async (entry) => {
    if (!window.confirm('Delete this journal entry? You can restore it for a few seconds.')) return;
    const deletedTags = data.tagsByMood[entry._id] || [];
    try {
      await trackerApi.deleteMood(token, entry._id);
      if (editingId === entry._id) cancelEdit();
      await onSaved();
      notify('Journal entry removed.', {
        actionLabel: 'Undo',
        onAction: async () => {
          const restored = await trackerApi.createMood(token, {
            moodValue: entry.moodValue,
            moodType: entry.moodType,
            title: entry.title,
            note: entry.note,
          });
          await Promise.all(deletedTags.map((tag) => trackerApi.createTag(token, { moodEntry: restored._id, label: tag.label })));
          await onSaved();
          notify('Journal entry restored.');
        },
      });
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <div className="page-enter app-page mood-page">
      <PageHeader
        eyebrow="Mood journal"
        title="Name the feeling, without judging it."
        description="A quick score and a little context are enough. Consistency matters more than perfect wording."
      />

      <section className="page-summary journal-summary" aria-label="Mood journal summary">
        <SummaryCard Icon={CalendarDays} label="Seven-day average" value={recentAverage === null ? '—' : `${recentAverage}/10`} detail={`${recentMoods.length} check-in${recentMoods.length === 1 ? '' : 's'} included`} />
        <SummaryCard Icon={Flame} label="Gentle consistency" value={`${currentStreak} day${currentStreak === 1 ? '' : 's'}`} detail="No pressure—just context" />
        <div className="journal-landscape">
          <div className="flex items-center justify-between gap-3"><div><p className="flex items-center gap-1.5 text-xs font-bold text-pine-600"><Sparkles size={13} /> Your 14-day landscape</p><p className="mt-1 text-xs font-semibold text-slate-400">Each tile represents the average feeling recorded that day.</p></div><span className="text-xs font-semibold text-pine-950">Today →</span></div>
          <div className="mt-4 grid gap-1.5" style={{ gridTemplateColumns: 'repeat(14, minmax(0, 1fr))' }} aria-label="Fourteen-day mood landscape">
            {landscape.map((day) => (
              <span key={day.day.toISOString()} className="h-8 rounded-lg border border-white/70 shadow-sm" title={`${formatDate(day.day)}: ${day.value === null ? 'No entry' : `${day.value}/10`}`} style={{ backgroundColor: day.value === null ? '#ecefed' : day.value >= 8 ? '#77bdad' : day.value >= 6 ? '#b9d7d0' : day.value >= 4 ? '#f0c89e' : '#edb7bb' }} />
            ))}
          </div>
        </div>
      </section>

      <div className="tracker-layout">
        <form className="card p-5 sm:p-7" onSubmit={handleSubmit}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow">{editingId ? 'Editing entry' : 'Today’s check-in'}</p>
              <h2 className="mt-2 section-title">{editingId ? 'Refine your journal entry' : 'How are you feeling?'}</h2>
            </div>
            <span className="record-count">Private journal</span>
          </div>

          <div className="mt-6">
            <MoodSlider value={form.moodValue} onChange={(moodValue) => setForm((current) => ({ ...current, moodValue }))} disabled={submitting} />
          </div>

          <fieldset className="mt-6">
            <legend className="field-label">Scale style</legend>
            <div className="grid grid-cols-3 gap-2">
              {[
                ['numeric', '1–10'],
                ['emoji', 'Emoji'],
                ['color', 'Color'],
              ].map(([value, label]) => (
                <label
                  key={value}
                  className={`cursor-pointer rounded-xl border px-3 py-2.5 text-center text-sm font-bold transition ${
                    form.moodType === value
                      ? 'border-pine-600 bg-pine-50 text-pine-800'
                      : 'border-pine-100 bg-white text-slate-500 hover:border-pine-200'
                  }`}
                >
                  <input
                    className="sr-only"
                    type="radio"
                    name="moodType"
                    value={value}
                    checked={form.moodType === value}
                    onChange={() => setForm((current) => ({ ...current, moodType: value }))}
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="mt-6">
            <label className="field-label" htmlFor="mood-title">Entry title</label>
            <input
              id="mood-title"
              className="field"
              maxLength="120"
              placeholder="A short name for this moment"
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            />
          </div>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between gap-3">
              <label className="text-sm font-semibold text-pine-950" htmlFor="mood-note">What shaped today?</label>
              <span className="text-xs font-medium text-slate-400">{form.note.length}/500</span>
            </div>
            <textarea
              id="mood-note"
              className="field min-h-28 resize-y"
              maxLength="500"
              placeholder="A conversation, a quiet win, a difficult moment..."
              value={form.note}
              onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
            />
          </div>

          <div className="mt-5">
            <label className="field-label flex items-center gap-2" htmlFor="mood-tags"><Tag size={15} /> Context tags</label>
            <input
              id="mood-tags"
              className="field"
              type="text"
              placeholder="work, study, family, weather"
              value={form.tags}
              onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))}
            />
            <p className="mt-2 text-xs text-slate-400">Separate tags with commas.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {suggestedTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  aria-pressed={selectedTagLabels.includes(tag)}
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1.5 text-xs font-bold transition ${
                    selectedTagLabels.includes(tag)
                      ? 'border-pine-600 bg-pine-700 text-white'
                      : 'border-slate-200 text-slate-500 hover:border-pine-300'
                  }`}
                >
                  {selectedTagLabels.includes(tag) && <Check size={12} />} {tag}
                </button>
              ))}
            </div>
          </div>

          {error && <div className="mt-5"><Notice type="error">{error}</Notice></div>}

          <div className="mt-6 flex gap-2">
            {editingId && <button className="secondary-button px-4" type="button" onClick={cancelEdit}><X size={16} /> Cancel</button>}
            <button className="primary-button flex-1" type="submit" disabled={submitting}>
              {submitting && <Spinner />}
              {submitting ? 'Saving entry' : editingId ? 'Update journal entry' : 'Save mood check-in'}
            </button>
          </div>
        </form>

        <section className="card p-5 sm:p-7">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="eyebrow">Your timeline</p>
              <h2 className="mt-2 section-title">Mood history</h2>
            </div>
            <div className="segmented-control" role="group" aria-label="Mood history range">
              {[
                ['7', '7 days'],
                ['30', '30 days'],
                ['all', 'All'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setHistoryRange(value)}
                  aria-pressed={historyRange === value}
                  className={`rounded-md px-2.5 py-1.5 text-xs font-bold transition ${
                    historyRange === value ? 'bg-white text-pine-800 shadow-sm' : 'text-slate-400'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <label className="relative mt-5 block">
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="field pl-10" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search titles, notes, or tags" aria-label="Search journal" />
          </label>

          <div className="mt-6">
            {filteredMoods.length ? (
              <div className="space-y-3">
                {filteredMoods.map((entry) => {
                  const tags = data.tagsByMood[entry._id] || [];
                  return (
                    <article key={entry._id} className="record-card rounded-2xl border border-pine-100 p-4 sm:p-5">
                      <div className="flex items-start gap-4">
                        <span className="grid h-12 min-w-12 place-items-center rounded-2xl bg-white text-2xl shadow-sm" aria-hidden="true">
                          {moodEmoji(entry.moodValue)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              {entry.title && <h3 className="truncate text-base font-semibold text-pine-950">{entry.title}</h3>}
                              <p className="font-bold text-pine-950">{moodLabel(entry.moodValue)} · {entry.moodValue}/10</p>
                              <p className="mt-0.5 text-xs font-medium text-slate-400">{formatDate(entry.createdAt, { year: true })} · {entry.moodType} scale</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <button type="button" onClick={() => beginEdit(entry)} className="grid h-10 w-10 place-items-center rounded-lg text-slate-400 hover:bg-pine-50 hover:text-pine-700" aria-label="Edit journal entry"><Pencil size={15} /></button>
                              <button type="button" onClick={() => deleteEntry(entry)} className="grid h-10 w-10 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Delete journal entry"><Trash2 size={15} /></button>
                            </div>
                          </div>
                          {entry.note && <p className="mt-3 text-sm leading-6 text-slate-600">{entry.note}</p>}
                          {tags.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {tags.map((tag) => (
                                <span key={tag._id} className="rounded-full bg-pine-100 px-2.5 py-1 text-xs font-bold text-pine-700">
                                  #{tag.label}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                symbol={<CalendarDays size={18} />}
                title={data.moods.length ? 'No matching entries' : 'No mood entries yet'}
                message={data.moods.length ? 'Try a different search or choose a wider date range.' : 'Your first check-in will appear here with its note and context tags.'}
              />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
