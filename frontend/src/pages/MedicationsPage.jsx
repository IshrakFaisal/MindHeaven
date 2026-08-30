import { useState } from 'react';
import { BarChart3, Check, Clock3, Moon, Pencil, Pill, RotateCcw, Sun, Trash2, Utensils, X, XCircle } from 'lucide-react';
import { EmptyState, Notice, PageHeader, SummaryCard, Spinner } from '../components/Ui';
import { trackerApi } from '../lib/api';
import { formatDate, localDateKey } from '../lib/format';

const initialForm = { medicationName: '', dosage: '', schedule: '', reminderTime: '', active: true };

export default function MedicationsPage({ token, entries, doses = [], onSaved, notify }) {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [updatingDoseId, setUpdatingDoseId] = useState(null);

  const today = localDateKey();
  const activeEntries = entries.filter((entry) => entry.active !== false);
  const todaysDoses = doses.filter((dose) => dose.date === today);
  const takenDoses = doses.filter((dose) => dose.status === 'taken').length;
  const completionRate = doses.length ? Math.round((takenDoses / doses.length) * 100) : null;
  const recentDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    return {
      key: localDateKey(date),
      label: new Intl.DateTimeFormat('en-US', { weekday: 'narrow' }).format(date),
    };
  });

  const updateField = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      if (editingId) await trackerApi.updateMedication(token, editingId, form);
      else await trackerApi.createMedication(token, form);
      setForm(initialForm);
      setEditingId(null);
      await onSaved();
      notify(editingId ? 'Medication schedule updated.' : 'Medication added.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  };

  const beginEdit = (entry) => {
    setEditingId(entry._id);
    setForm({
      medicationName: entry.medicationName || '',
      dosage: entry.dosage || '',
      schedule: entry.schedule || '',
      reminderTime: entry.reminderTime || '',
      active: entry.active !== false,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(initialForm);
    setError('');
  };

  const toggleActive = async (entry) => {
    try {
      await trackerApi.updateMedication(token, entry._id, { active: entry.active === false });
      await onSaved();
      notify(entry.active === false ? 'Medication schedule resumed.' : 'Medication schedule paused.');
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const deleteMedication = async (entry) => {
    if (!window.confirm(`Remove ${entry.medicationName} from your schedule? You can restore it for a few seconds.`)) return;
    try {
      await trackerApi.deleteMedication(token, entry._id);
      if (editingId === entry._id) cancelEdit();
      await onSaved();
      notify('Medication schedule removed.', {
        actionLabel: 'Undo',
        onAction: async () => {
          await trackerApi.createMedication(token, {
            medicationName: entry.medicationName,
            dosage: entry.dosage,
            schedule: entry.schedule,
            reminderTime: entry.reminderTime,
            active: entry.active !== false,
          });
          await onSaved();
          notify('Medication schedule restored.');
        },
      });
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const updateDose = async (entry, status) => {
    setUpdatingDoseId(entry._id);
    setError('');
    try {
      await trackerApi.setMedicationDose(token, entry._id, today, status);
      await onSaved();
      notify(status === 'taken' ? `${entry.medicationName} marked as taken.` : `${entry.medicationName} marked as skipped.`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setUpdatingDoseId(null);
    }
  };

  const clearDose = async (entry) => {
    setUpdatingDoseId(entry._id);
    setError('');
    try {
      await trackerApi.clearMedicationDose(token, entry._id, today);
      await onSaved();
      notify(`Today’s ${entry.medicationName} status was cleared.`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setUpdatingDoseId(null);
    }
  };

  return (
    <div className="page-enter app-page medications-page">
      <PageHeader
        eyebrow="Medication tracker"
        title="Keep treatment details in one calm place."
        description="Record medication, dosage, and schedule for your own reference and wellness reports."
      />

      <section className="page-summary" aria-label="Medication summary">
        <SummaryCard Icon={Pill} label="Active schedules" value={activeEntries.length} detail="Your current medication routines" />
        <SummaryCard Icon={Check} label="Today recorded" value={todaysDoses.length} detail={`dose decision${todaysDoses.length === 1 ? '' : 's'}`} />
        <SummaryCard Icon={BarChart3} label="Seven-day completion" value={completionRate === null ? '—' : `${completionRate}%`} detail="Of recorded dose decisions" />
      </section>

      <section className="card mb-6 overflow-hidden">
        <div className="flex flex-col justify-between gap-4 border-b border-pine-100 bg-pine-50/60 px-5 py-5 sm:flex-row sm:items-end sm:px-7">
          <div><p className="eyebrow">Today’s plan</p><h2 className="mt-2 section-title">Today’s medication plan</h2><p className="mt-2 text-sm text-slate-500">Record what happened. A skipped dose is information, not a failure.</p></div>
          <time className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-pine-700 shadow-sm">{new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).format(new Date())}</time>
        </div>
        <div className="p-5 sm:p-7">
          {activeEntries.length ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {activeEntries.map((entry) => {
                const dose = todaysDoses.find((item) => String(item.medication) === entry._id);
                const updating = updatingDoseId === entry._id;
                return (
                  <article key={`today-${entry._id}`} className="signed-surface flex flex-col gap-4 rounded-[1.35rem] border border-pine-100 p-4 sm:flex-row sm:items-center">
                    <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${dose?.status === 'taken' ? 'bg-pine-700 text-white' : dose?.status === 'skipped' ? 'bg-amber-100 text-amber-700' : 'bg-pine-100 text-pine-700'}`}>{dose?.status === 'taken' ? <Check size={18} /> : dose?.status === 'skipped' ? <X size={18} /> : <Pill size={18} />}</span>
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-pine-950">{entry.medicationName}</p><p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs font-semibold text-slate-400"><span>{entry.dosage || 'Dosage not recorded'}</span>{entry.reminderTime && <span className="inline-flex items-center gap-1 text-pine-600"><Clock3 size={12} /> {entry.reminderTime}</span>}</p></div>
                    <div className="grid grid-cols-2 gap-2 sm:w-48">
                      <button type="button" onClick={() => updateDose(entry, 'taken')} disabled={updating} aria-pressed={dose?.status === 'taken'} className={`inline-flex min-h-10 items-center justify-center gap-1 rounded-xl border px-2 text-xs font-semibold transition ${dose?.status === 'taken' ? 'border-pine-600 bg-pine-600 text-white' : 'border-pine-200 text-pine-700 hover:bg-pine-50'}`}><Check size={13} /> Taken</button>
                      <button type="button" onClick={() => updateDose(entry, 'skipped')} disabled={updating} aria-pressed={dose?.status === 'skipped'} className={`inline-flex min-h-10 items-center justify-center gap-1 rounded-xl border px-2 text-xs font-semibold transition ${dose?.status === 'skipped' ? 'border-amber-700 bg-amber-700 text-white' : 'border-amber-200 text-amber-700 hover:bg-amber-50'}`}><XCircle size={13} /> Skipped</button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState symbol={<Pill size={18} />} title="No medication due today" message="Add a schedule below when you want medication to become part of your daily plan." />
          )}
        </div>
      </section>

      <div className="tracker-layout">
        <form className="card p-5 sm:p-7" onSubmit={handleSubmit}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="section-title">{editingId ? 'Edit schedule' : 'Add medication'}</h2>
            {editingId && <button type="button" onClick={cancelEdit} className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100" aria-label="Cancel editing"><X size={17} /></button>}
          </div>
          <div className="mt-7 space-y-5">
            <div>
              <label className="field-label" htmlFor="medication-name">Medication name</label>
              <input id="medication-name" className="field" value={form.medicationName} onChange={updateField('medicationName')} placeholder="e.g. Sertraline" required />
            </div>
            <div>
              <label className="field-label" htmlFor="reminder-time">Daily reminder time</label>
              <input id="reminder-time" className="field" type="time" value={form.reminderTime} onChange={updateField('reminderTime')} />
              <p className="mt-2 text-xs leading-5 text-slate-400">Stored as part of your schedule. Browser notifications are not sent automatically.</p>
            </div>
            <div>
              <label className="field-label" htmlFor="dosage">Dosage</label>
              <input id="dosage" className="field" value={form.dosage} onChange={updateField('dosage')} placeholder="e.g. 50 mg" />
            </div>
            <div>
              <label className="field-label" htmlFor="schedule">Schedule</label>
              <input id="schedule" className="field" value={form.schedule} onChange={updateField('schedule')} placeholder="e.g. Every morning after breakfast" />
              <div className="mt-3 grid grid-cols-2 gap-2">
                {[
                  [Sun, 'Every morning'],
                  [Moon, 'Every evening'],
                  [Utensils, 'After a meal'],
                  [Clock3, 'As needed'],
                ].map(([Icon, schedule]) => (
                  <button
                    key={schedule}
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, schedule }))}
                    aria-pressed={form.schedule === schedule}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs font-bold transition ${
                      form.schedule === schedule
                        ? 'border-pine-600 bg-pine-50 text-pine-800'
                        : 'border-slate-200 text-slate-400 hover:border-pine-300 hover:text-pine-700'
                    }`}
                  >
                    <Icon size={14} /> {schedule}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {error && <div className="mt-6"><Notice type="error">{error}</Notice></div>}
          <button className="primary-button mt-7 w-full" type="submit" disabled={submitting}>
            {submitting && <Spinner />}{submitting ? 'Saving schedule' : editingId ? 'Update schedule' : 'Add medication'}
          </button>
          <p className="mt-4 text-xs leading-5 text-slate-400">This tracker does not provide dosage or treatment advice. Follow instructions from your prescriber.</p>
        </form>

        <section className="card p-5 sm:p-7">
          <div className="record-heading">
            <div><p className="eyebrow">Your list</p><h2 className="mt-2 section-title">Medication schedules</h2></div>
            <span className="record-count">{entries.length} recorded</span>
          </div>
          <div className="mt-6">
            {entries.length ? (
              <div className="grid gap-4">
                {entries.map((entry) => (
                  <article key={entry._id} className={`rounded-2xl border p-5 ${entry.active === false ? 'border-slate-200 bg-slate-50' : 'border-pine-100'}`}>
                    <div className="flex items-start gap-4">
                      <span className="grid h-11 min-w-11 place-items-center rounded-xl bg-pine-100 text-pine-700"><Pill size={18} /></span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div><h3 className="font-bold text-pine-950">{entry.medicationName}</h3><span className={`mt-1 inline-flex rounded-full px-2 py-1 text-xs font-semibold ${entry.active === false ? 'bg-slate-200 text-slate-500' : 'bg-pine-50 text-pine-700'}`}>{entry.active === false ? 'Paused' : 'Active'}</span></div>
                          <div className="flex gap-1">
                            <button type="button" onClick={() => beginEdit(entry)} className="grid h-10 w-10 place-items-center rounded-lg text-slate-400 hover:bg-pine-50 hover:text-pine-700" aria-label={`Edit ${entry.medicationName}`}><Pencil size={15} /></button>
                            <button type="button" onClick={() => deleteMedication(entry)} className="grid h-10 w-10 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label={`Delete ${entry.medicationName}`}><Trash2 size={15} /></button>
                          </div>
                        </div>
                        <p className="mt-1 text-sm font-semibold text-pine-700">{entry.dosage || 'Dosage not recorded'}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-500">{entry.schedule || 'Schedule not recorded'}</p>
                        {entry.reminderTime && <p className="mt-2 flex items-center gap-1.5 text-xs font-bold text-pine-600"><Clock3 size={13} /> Reminder {entry.reminderTime}</p>}
                        <p className="mt-3 text-xs font-medium text-slate-400">Added {formatDate(entry.createdAt, { year: true })}</p>
                        <button type="button" onClick={() => toggleActive(entry)} className="mt-4 text-xs font-semibold text-pine-700 hover:text-pine-900">{entry.active === false ? 'Resume schedule' : 'Pause schedule'}</button>

                        {entry.active !== false && (() => {
                          const dose = todaysDoses.find((item) => String(item.medication) === entry._id);
                          const updating = updatingDoseId === entry._id;
                          return (
                            <div className="mt-4 border-t border-slate-100 pt-4">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-xs font-semibold text-pine-950">Today’s dose</p>
                                {dose && <span className={`rounded-full px-2 py-1 text-xs font-semibold ${dose.status === 'taken' ? 'bg-pine-100 text-pine-700' : 'bg-amber-100 text-amber-700'}`}>{dose.status === 'taken' ? 'Taken' : 'Skipped'}</span>}
                              </div>
                              <div className="mt-2 grid grid-cols-[1fr_1fr_auto] gap-2">
                                <button
                                  type="button"
                                  onClick={() => updateDose(entry, 'taken')}
                                  disabled={updating}
                                  aria-pressed={dose?.status === 'taken'}
                                  className={`inline-flex min-h-9 items-center justify-center gap-1 rounded-lg border px-2 text-xs font-semibold transition ${dose?.status === 'taken' ? 'border-pine-600 bg-pine-600 text-white' : 'border-pine-200 text-pine-700 hover:bg-pine-50'}`}
                                >
                                  <Check size={13} /> Taken
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateDose(entry, 'skipped')}
                                  disabled={updating}
                                  aria-pressed={dose?.status === 'skipped'}
                                  className={`inline-flex min-h-9 items-center justify-center gap-1 rounded-lg border px-2 text-xs font-semibold transition ${dose?.status === 'skipped' ? 'border-amber-700 bg-amber-700 text-white' : 'border-amber-200 text-amber-700 hover:bg-amber-50'}`}
                                >
                                  <XCircle size={13} /> Skipped
                                </button>
                                <button type="button" onClick={() => clearDose(entry)} disabled={updating || !dose} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-400 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35" aria-label={`Clear today’s ${entry.medicationName} status`}>
                                  <RotateCcw size={13} />
                                </button>
                              </div>
                            </div>
                          );
                        })()}

                        <div className="mt-4 border-t border-slate-100 pt-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Last seven days</p>
                          <div className="mt-2 grid grid-cols-7 gap-1.5">
                            {recentDays.map((day) => {
                              const dose = doses.find((item) => String(item.medication) === entry._id && item.date === day.key);
                              return (
                                <div key={day.key} className="text-center" title={`${day.key}: ${dose?.status || 'not recorded'}`}>
                                  <span className={`mx-auto grid h-7 w-full place-items-center rounded-md text-xs font-semibold ${dose?.status === 'taken' ? 'bg-pine-600 text-white' : dose?.status === 'skipped' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-300'}`} aria-label={`${day.key}: ${dose?.status || 'not recorded'}`}>
                                    {dose?.status === 'taken' ? <Check size={12} /> : dose?.status === 'skipped' ? <X size={12} /> : '·'}
                                  </span>
                                  <span className="mt-1 block text-xs font-bold text-slate-400">{day.label}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState symbol="Rx" title="No medication recorded" message="Add a medication and its schedule when you are ready." />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
