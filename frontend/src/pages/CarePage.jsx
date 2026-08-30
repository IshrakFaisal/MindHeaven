import { useEffect, useMemo, useState } from 'react';
import { Brain, CheckCircle2, Edit3, Plus, Save, Trash2 } from 'lucide-react';
import { EmptyState, Notice, PageHeader, Spinner } from '../components/Ui';
import { CrisisSafetyBanner, CrisisSupportPanel } from '../features/care/CrisisSupport';
import { careApi } from '../lib/api';
import { formatRelativeDate } from '../lib/format';

const EMPTY_FORM = {
  situation: '',
  automaticThought: '',
  emotion: '',
  intensity: 7,
  evidenceFor: '',
  evidenceAgainst: '',
  balancedThought: '',
  afterIntensity: 5,
};

function ScoreField({ id, label, value, onChange }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <label className="field-label" htmlFor={id}>{label}</label>
        <span className="rounded-lg bg-pine-50 px-2.5 py-1 text-sm font-semibold text-pine-700">{value}/10</span>
      </div>
      <input id={id} type="range" min="1" max="10" value={value} onChange={(event) => onChange(Number(event.target.value))} className="mt-3 w-full accent-pine-700" />
      <div className="mt-1 flex justify-between text-xs font-semibold text-slate-400"><span>Lower</span><span>Stronger</span></div>
    </div>
  );
}

export default function CarePage({ token, notify }) {
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadRecords = async () => {
    setLoading(true);
    try {
      setRecords(await careApi.getThoughtRecords(token));
      setError('');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRecords(); }, [token]);

  const improvement = useMemo(
    () => Math.max(0, Number(form.intensity) - Number(form.afterIntensity)),
    [form.afterIntensity, form.intensity],
  );

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const reset = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError('');
  };

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editingId) await careApi.updateThoughtRecord(token, editingId, form);
      else await careApi.createThoughtRecord(token, form);
      notify(editingId ? 'Thought record updated.' : 'A new balanced thought has been saved.');
      reset();
      await loadRecords();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const edit = (record) => {
    setEditingId(record._id);
    setForm(Object.fromEntries(Object.keys(EMPTY_FORM).map((key) => [key, record[key] ?? EMPTY_FORM[key]])));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async (record) => {
    if (!window.confirm('Delete this private thought record?')) return;
    try {
      await careApi.deleteThoughtRecord(token, record._id);
      setRecords((current) => current.filter((item) => item._id !== record._id));
      notify('Thought record deleted.');
      if (editingId === record._id) reset();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <div className="page-enter app-page care-page">
      <PageHeader
        eyebrow="Care toolkit"
        title="Pause, examine the thought, and make room for another view."
        description="Use a structured CBT-style reflection for everyday thoughts, or reach trusted support when the situation needs more than an app."
      />

      <CrisisSafetyBanner />

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <form className="card overflow-hidden" onSubmit={save}>
          <div className="border-b border-pine-100 bg-gradient-to-r from-pine-50 to-white p-5 sm:p-7">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <div><p className="eyebrow">CBT thought record</p><h2 className="mt-2 section-title">{editingId ? 'Refine this reflection' : 'Walk the thought through six clear steps'}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">This is a reflection tool, not therapy or a diagnosis. Write only what feels useful.</p></div>
              {editingId && <button type="button" className="secondary-button" onClick={reset}><Plus size={15} /> New record</button>}
            </div>
          </div>

          <div className="space-y-7 p-5 sm:p-7">
            <div className="care-step-grid">
              <span className="care-step-number">1</span>
              <div><label className="field-label" htmlFor="thought-situation">What happened?</label><textarea id="thought-situation" className="field mt-2 min-h-24 resize-y" value={form.situation} onChange={(event) => update('situation', event.target.value)} maxLength="500" placeholder="Describe the situation using observable facts." required /></div>
            </div>
            <div className="care-step-grid">
              <span className="care-step-number">2</span>
              <div className="grid gap-4 sm:grid-cols-[1fr_0.55fr]">
                <div><label className="field-label" htmlFor="automatic-thought">What went through your mind?</label><textarea id="automatic-thought" className="field mt-2 min-h-28 resize-y" value={form.automaticThought} onChange={(event) => update('automaticThought', event.target.value)} maxLength="1200" placeholder="Write the automatic thought as it appeared." required /></div>
                <div className="space-y-4"><div><label className="field-label" htmlFor="thought-emotion">Emotion</label><input id="thought-emotion" className="field mt-2" value={form.emotion} onChange={(event) => update('emotion', event.target.value)} maxLength="100" placeholder="e.g. anxious" required /></div><ScoreField id="thought-intensity" label="Initial intensity" value={form.intensity} onChange={(value) => update('intensity', value)} /></div>
              </div>
            </div>
            <div className="care-step-grid">
              <span className="care-step-number">3</span>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><label className="field-label" htmlFor="evidence-for">What supports the thought?</label><textarea id="evidence-for" className="field mt-2 min-h-28 resize-y" value={form.evidenceFor} onChange={(event) => update('evidenceFor', event.target.value)} maxLength="1200" placeholder="Facts that make it feel believable." /></div>
                <div><label className="field-label" htmlFor="evidence-against">What does not support it?</label><textarea id="evidence-against" className="field mt-2 min-h-28 resize-y" value={form.evidenceAgainst} onChange={(event) => update('evidenceAgainst', event.target.value)} maxLength="1200" placeholder="Exceptions, context, or another person's view." /></div>
              </div>
            </div>
            <div className="care-step-grid">
              <span className="care-step-number">4</span>
              <div><label className="field-label" htmlFor="balanced-thought">A more balanced thought</label><textarea id="balanced-thought" className="field mt-2 min-h-28 resize-y" value={form.balancedThought} onChange={(event) => update('balancedThought', event.target.value)} maxLength="1200" placeholder="Aim for fair and believable—not forced positivity." required /></div>
            </div>
            <div className="care-step-grid">
              <span className="care-step-number">5</span>
              <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end"><ScoreField id="after-intensity" label="How strong is the emotion now?" value={form.afterIntensity} onChange={(value) => update('afterIntensity', value)} /><div className="rounded-2xl bg-pine-50 px-5 py-4 text-center"><p className="text-xs font-bold uppercase tracking-wider text-pine-600">Shift</p><p className="mt-1 text-2xl font-semibold text-pine-950">{improvement ? `-${improvement}` : '—'}</p></div></div>
            </div>
            {error && <Notice type="error">{error}</Notice>}
            <div className="flex flex-col justify-between gap-3 border-t border-pine-100 pt-6 sm:flex-row sm:items-center"><p className="text-xs leading-5 text-slate-500">Your entry is stored privately with your account and can be edited or deleted.</p><button type="submit" className="primary-button" disabled={saving}>{saving ? <Spinner /> : <Save size={16} />}{saving ? 'Saving reflection' : editingId ? 'Update reflection' : 'Save private reflection'}</button></div>
          </div>
        </form>

        <aside className="space-y-6">
          <CrisisSupportPanel />

          <section className="card p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3"><div><p className="eyebrow">Your reflections</p><h2 className="mt-2 text-xl font-semibold text-pine-950">Recent thought records</h2></div><span className="rounded-xl bg-pine-50 px-3 py-2 text-xs font-bold text-pine-700">{records.length}</span></div>
            <div className="mt-5 space-y-3">
              {loading && <div className="flex items-center gap-2 py-8 text-sm text-slate-500"><Spinner /> Loading reflections</div>}
              {!loading && !records.length && <EmptyState symbol={<Brain size={18} />} title="No thought records yet" message="Your first balanced reflection will appear here." />}
              {records.slice(0, 8).map((record) => <article key={record._id} className="rounded-2xl border border-pine-100 bg-white p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-semibold text-pine-950">{record.situation}</p><p className="mt-1 text-xs font-semibold text-pine-600">{record.emotion} · {record.intensity}/10 to {record.afterIntensity}/10</p></div><span title="Balanced thought saved"><CheckCircle2 size={17} className="shrink-0 text-pine-500" /></span></div><p className="mt-3 line-clamp-3 text-xs leading-5 text-slate-500">{record.balancedThought}</p><div className="mt-3 flex items-center justify-between gap-3"><span className="text-xs font-semibold text-slate-400">{formatRelativeDate(record.createdAt)}</span><div className="flex gap-1"><button type="button" onClick={() => edit(record)} className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-pine-50 hover:text-pine-700" aria-label="Edit thought record"><Edit3 size={15} /></button><button type="button" onClick={() => remove(record)} className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-700" aria-label="Delete thought record"><Trash2 size={15} /></button></div></div></article>)}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
