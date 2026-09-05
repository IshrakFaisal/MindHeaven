import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpenCheck,
  Brain,
  CheckCircle2,
  Clock3,
  Edit3,
  ExternalLink,
  HeartHandshake,
  History,
  LockKeyhole,
  Plus,
  Save,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { EmptyState, Notice, PageHeader, Spinner } from '../components/Ui';
import { CrisisSafetyBanner, CrisisSupportPanel } from '../features/care/CrisisSupport';
import { EVIDENCE_PRACTICES } from '../features/care/evidencePractices';
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

const TOOL_PATHS = [
  {
    href: '#thought-record',
    label: 'Reflect on a thought',
    description: 'Use a private, structured CBT-style record.',
    meta: 'About 5–10 minutes',
    Icon: Brain,
  },
  {
    href: '#practice-library',
    label: 'Try a short practice',
    description: 'Ground, notice, or breathe at your own pace.',
    meta: 'About 1–5 minutes',
    Icon: Sparkles,
  },
  {
    href: '#support-contacts',
    label: 'Reach human support',
    description: 'View Bangladesh health and support contacts.',
    meta: 'When an app is not enough',
    Icon: HeartHandshake,
  },
];

function ScoreField({ id, label, value, onChange }) {
  const progress = `${((Number(value) - 1) / 9) * 100}%`;
  return (
    <div className="care-intensity-control">
      <div className="care-intensity-heading">
        <label className="field-label" htmlFor={id}>{label}</label>
        <span><strong>{value}</strong>/10</span>
      </div>
      <input
        id={id}
        type="range"
        min="1"
        max="10"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="care-score-range"
        style={{ '--score-position': progress }}
      />
      <div className="care-score-labels"><span>Lower</span><span>Stronger</span></div>
    </div>
  );
}

function FormStep({ number, title, description, children }) {
  return (
    <section className="care-form-step" aria-labelledby={`care-step-${number}`}>
      <div className="care-form-step-heading">
        <span className="care-step-number" aria-hidden="true">{number}</span>
        <div>
          <h3 id={`care-step-${number}`}>{title}</h3>
          <p>{description}</p>
        </div>
      </div>
      <div className="care-form-step-content">{children}</div>
    </section>
  );
}

export default function CarePage({ token, notify, locale = 'en' }) {
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

  const recordSummary = useMemo(() => {
    const shifts = records.map((record) => Math.max(0, Number(record.intensity) - Number(record.afterIntensity)));
    const averageShift = shifts.length ? shifts.reduce((sum, shift) => sum + shift, 0) / shifts.length : 0;
    return {
      averageShift: averageShift ? averageShift.toFixed(1) : '—',
      latest: records[0]?.createdAt ? formatRelativeDate(records[0].createdAt) : 'No entries yet',
    };
  }, [records]);

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
    window.setTimeout(() => document.getElementById('thought-record')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
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
        title="Choose the kind of support this moment needs."
        description="Reflect on a difficult thought, try a brief evidence-linked practice, or find trusted human support—all from one private workspace."
        action={<span className="page-header-badge"><LockKeyhole size={17} /> Private & editable</span>}
      />

      <CrisisSafetyBanner />

      <section className="care-pathway-panel" aria-labelledby="care-pathway-title">
        <div className="care-pathway-intro">
          <p className="eyebrow">Start here</p>
          <h2 id="care-pathway-title">What would be most useful right now?</h2>
          <p>You can change direction at any time.</p>
        </div>
        <div className="care-pathway-grid">
          {TOOL_PATHS.map(({ href, label, description, meta, Icon }) => (
            <a key={href} href={href} className="care-pathway-card">
              <span className="care-pathway-icon" aria-hidden="true"><Icon size={19} /></span>
              <span className="care-pathway-copy"><strong>{label}</strong><small>{description}</small><em>{meta}</em></span>
              <ArrowRight size={16} className="care-pathway-arrow" aria-hidden="true" />
            </a>
          ))}
        </div>
      </section>

      <div className="care-workspace">
        <form id="thought-record" className="card care-reflection-form scroll-mt-28" onSubmit={save}>
          <div className="care-form-header">
            <div>
              <p className="eyebrow">Private CBT-style reflection</p>
              <h2>{editingId ? 'Refine this reflection' : 'Look at the thought from more than one angle'}</h2>
              <p>This guided record helps you slow down and examine an everyday thought. It is not therapy or a diagnosis.</p>
            </div>
            <div className="care-form-header-action">
              <span><LockKeyhole size={14} aria-hidden="true" /> Only you can see this</span>
              {editingId && <button type="button" className="secondary-button" onClick={reset}><Plus size={15} /> New record</button>}
            </div>
          </div>

          <div className="care-form-progress" aria-label="Five-part reflection">
            {['Situation', 'Thought & feeling', 'Evidence', 'Balanced view', 'Check again'].map((label, index) => (
              <span key={label}><b>{index + 1}</b><small>{label}</small></span>
            ))}
          </div>

          <div className="care-form-body">
            <FormStep number="1" title="Describe the situation" description="Begin with what someone else could have observed.">
              <label className="field-label" htmlFor="thought-situation">What happened?</label>
              <textarea id="thought-situation" className="field mt-2 min-h-24 resize-y" value={form.situation} onChange={(event) => update('situation', event.target.value)} maxLength="500" placeholder="Describe the situation using observable facts." required />
            </FormStep>

            <FormStep number="2" title="Capture the first thought and feeling" description="Use the words that showed up naturally—there is no ideal answer.">
              <div className="care-thought-emotion-grid">
                <div><label className="field-label" htmlFor="automatic-thought">What went through your mind?</label><textarea id="automatic-thought" className="field mt-2 min-h-28 resize-y" value={form.automaticThought} onChange={(event) => update('automaticThought', event.target.value)} maxLength="1200" placeholder="Write the automatic thought as it appeared." required /></div>
                <div className="care-emotion-column"><div><label className="field-label" htmlFor="thought-emotion">Emotion</label><input id="thought-emotion" className="field mt-2" value={form.emotion} onChange={(event) => update('emotion', event.target.value)} maxLength="100" placeholder="e.g. anxious" required /></div><ScoreField id="thought-intensity" label="Initial intensity" value={form.intensity} onChange={(value) => update('intensity', value)} /></div>
              </div>
            </FormStep>

            <FormStep number="3" title="Check the evidence" description="Separate facts from assumptions and make room for context.">
              <div className="care-evidence-grid">
                <div><label className="field-label" htmlFor="evidence-for">What supports the thought?</label><textarea id="evidence-for" className="field mt-2 min-h-28 resize-y" value={form.evidenceFor} onChange={(event) => update('evidenceFor', event.target.value)} maxLength="1200" placeholder="Facts that make it feel believable." /></div>
                <div><label className="field-label" htmlFor="evidence-against">What does not support it?</label><textarea id="evidence-against" className="field mt-2 min-h-28 resize-y" value={form.evidenceAgainst} onChange={(event) => update('evidenceAgainst', event.target.value)} maxLength="1200" placeholder="Exceptions, context, or another person's view." /></div>
              </div>
            </FormStep>

            <FormStep number="4" title="Write a fairer view" description="Aim for something believable and balanced, not forced positivity.">
              <label className="field-label" htmlFor="balanced-thought">A more balanced thought</label>
              <textarea id="balanced-thought" className="field mt-2 min-h-28 resize-y" value={form.balancedThought} onChange={(event) => update('balancedThought', event.target.value)} maxLength="1200" placeholder="What is a more complete and compassionate way to see this?" required />
            </FormStep>

            <FormStep number="5" title="Check in once more" description="Notice whether the emotion has shifted. No change is also useful information.">
              <div className="care-after-grid">
                <ScoreField id="after-intensity" label="How strong is the emotion now?" value={form.afterIntensity} onChange={(value) => update('afterIntensity', value)} />
                <div className="care-shift-card"><span>Intensity shift</span><strong>{improvement ? `−${improvement}` : '—'}</strong><small>{improvement ? 'points lower' : 'No decrease yet'}</small></div>
              </div>
            </FormStep>

            {error && <Notice type="error">{error}</Notice>}
            <div className="care-form-submit">
              <p><LockKeyhole size={14} aria-hidden="true" /> Stored privately with your account. You can edit or delete it later.</p>
              <button type="submit" className="primary-button" disabled={saving}>{saving ? <Spinner /> : <Save size={16} />}{saving ? 'Saving reflection' : editingId ? 'Update reflection' : 'Save private reflection'}</button>
            </div>
          </div>
        </form>

        <aside className="care-sidebar">
          <section className="card care-record-overview" aria-labelledby="care-record-overview-title">
            <div className="care-record-overview-heading">
              <span><History size={18} aria-hidden="true" /></span>
              <div><p className="eyebrow">Your private workspace</p><h2 id="care-record-overview-title">Reflection overview</h2></div>
            </div>
            <div className="care-record-stats">
              <div><span>Saved records</span><strong>{records.length}</strong></div>
              <div><span>Average shift</span><strong>{recordSummary.averageShift}</strong></div>
            </div>
            <p className="care-record-latest">Latest activity <strong>{recordSummary.latest}</strong></p>
          </section>

          <section className="card care-record-list" aria-labelledby="care-records-title">
            <div className="care-record-list-heading"><div><p className="eyebrow">Reflection history</p><h2 id="care-records-title">Recent thought records</h2></div><span>{records.length}</span></div>
            <div className="care-record-items">
              {loading && <div className="care-record-loading"><Spinner /> Loading reflections</div>}
              {!loading && !records.length && <EmptyState symbol={<Brain size={18} />} title="No thought records yet" message="Your first balanced reflection will appear here." />}
              {records.slice(0, 8).map((record) => (
                <article key={record._id} className="care-record-card">
                  <div className="care-record-card-heading">
                    <span className="care-record-status" title="Balanced thought saved"><CheckCircle2 size={15} /></span>
                    <div><h3>{record.situation}</h3><p>{record.emotion} · {record.intensity}/10 to {record.afterIntensity}/10</p></div>
                  </div>
                  <p className="care-record-thought">{record.balancedThought}</p>
                  <div className="care-record-footer"><span>{formatRelativeDate(record.createdAt)}</span><div><button type="button" onClick={() => edit(record)} aria-label="Edit thought record"><Edit3 size={14} /></button><button type="button" onClick={() => remove(record)} aria-label="Delete thought record"><Trash2 size={14} /></button></div></div>
                </article>
              ))}
            </div>
          </section>

          <div id="support-contacts" className="scroll-mt-28"><CrisisSupportPanel /></div>
        </aside>
      </div>

      <section id="practice-library" className="card care-practice-library scroll-mt-28" aria-labelledby="practice-library-title">
        <div className="care-practice-library-heading">
          <div><p className="eyebrow">{locale === 'bn' ? 'প্রমাণভিত্তিক শিক্ষামূলক অনুশীলন' : 'Evidence-linked self-help'}</p><h2 id="practice-library-title">{locale === 'bn' ? 'এই মুহূর্তের জন্য একটি ছোট অনুশীলন বেছে নিন।' : 'Choose one small practice for this moment.'}</h2><p>Plain-language exercises adapted from linked public-health sources. These are educational tools, not a clinical treatment plan.</p></div>
          <span><CheckCircle2 size={14} aria-hidden="true" /> Sources checked Aug 2026</span>
        </div>
        <div className="care-practice-grid">
          {EVIDENCE_PRACTICES.map((practice, index) => (
            <article key={practice.id} className="care-practice-card">
              <div className="care-practice-card-top"><span className="care-practice-icon"><BookOpenCheck size={18} /></span><span className="care-practice-duration"><Clock3 size={12} /> {practice.duration}</span></div>
              <p className="care-practice-number">Practice {String(index + 1).padStart(2, '0')}</p>
              <h3>{practice.title}</h3>
              <p className="care-practice-purpose">{practice.purpose}</p>
              <details>
                <summary>View the steps <span>{practice.steps.length}</span></summary>
                <ol>{practice.steps.map((item, stepIndex) => <li key={item}><span>{stepIndex + 1}</span><p>{item}</p></li>)}</ol>
              </details>
              <a href={practice.sourceUrl} target="_blank" rel="noreferrer">{practice.sourceLabel} <ExternalLink size={12} /></a>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
