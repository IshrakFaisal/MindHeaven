import { useEffect, useState } from 'react';
import { BellRing, Camera, Check, Download, Languages, LockKeyhole, Settings2, Sparkles, Trash2, X } from 'lucide-react';
import { Notice, PageHeader, Spinner } from '../components/Ui';
import { userApi } from '../lib/api';
import { prepareProfileImage } from '../lib/avatar';
import { downloadBlob } from '../lib/download';
import { SUPPORTED_LOCALES } from '../lib/i18n';
import { DEFAULT_PREFERENCES, WELLBEING_GOALS } from '../lib/preferences';

export default function ProfilePage({ token, user, onUserUpdated, onAccountDeleted, notify, preferences, onPreferencesSaved, onOpenOnboarding }) {
  const [profile, setProfile] = useState({ name: user.name || '', email: user.email || '' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [profileError, setProfileError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingPhoto, setSavingPhoto] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [privacyError, setPrivacyError] = useState('');
  const [preferenceDraft, setPreferenceDraft] = useState({ ...DEFAULT_PREFERENCES, ...preferences });

  useEffect(() => {
    setProfile({ name: user.name || '', email: user.email || '' });
  }, [user]);

  useEffect(() => {
    setPreferenceDraft({ ...DEFAULT_PREFERENCES, ...preferences });
  }, [preferences]);

  const toggleGoal = (goalId) => {
    setPreferenceDraft((current) => {
      const selected = current.goals.includes(goalId);
      if (selected && current.goals.length === 1) return current;
      return {
        ...current,
        goals: selected ? current.goals.filter((item) => item !== goalId) : [...current.goals, goalId].slice(0, 3),
      };
    });
  };

  const saveExperience = (event) => {
    event.preventDefault();
    onPreferencesSaved({ ...preferenceDraft, completedOnboarding: true });
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setSavingProfile(true);
    setProfileError('');
    try {
      const updated = await userApi.updateProfile(token, profile);
      onUserUpdated(updated);
      notify('Profile details updated.');
    } catch (requestError) {
      setProfileError(requestError.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const updatePhoto = async (profileImage) => {
    setSavingPhoto(true);
    setProfileError('');
    try {
      const updated = await userApi.updateProfile(token, { profileImage });
      onUserUpdated(updated);
      notify(profileImage ? 'Profile picture updated.' : 'Profile picture removed.');
    } catch (requestError) {
      setProfileError(requestError.message);
    } finally {
      setSavingPhoto(false);
    }
  };

  const choosePhoto = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      await updatePhoto(await prepareProfileImage(file));
    } catch (imageError) {
      setProfileError(imageError.message);
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    setSavingPassword(true);
    setPasswordError('');
    try {
      await userApi.changePassword(token, passwords);
      setPasswords({ currentPassword: '', newPassword: '' });
      notify('Password updated successfully.');
    } catch (requestError) {
      setPasswordError(requestError.message);
    } finally {
      setSavingPassword(false);
    }
  };

  const initials = user.name
    ?.split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  const exportData = async () => {
    setExporting(true);
    setPrivacyError('');
    try {
      const blob = await userApi.exportData(token);
      downloadBlob(blob, `mindhaven-data-${new Date().toISOString().slice(0, 10)}.json`);
      notify('Your MindHaven data export is ready.');
    } catch (requestError) {
      setPrivacyError(requestError.message);
    } finally {
      setExporting(false);
    }
  };

  const deleteAccount = async () => {
    if (!deletePassword) {
      setPrivacyError('Enter your current password before deleting the account.');
      return;
    }
    if (!window.confirm('Permanently delete your account and every MindHaven record? This cannot be undone.')) return;
    setDeleting(true);
    setPrivacyError('');
    try {
      await userApi.deleteAccount(token, deletePassword);
      onAccountDeleted();
    } catch (requestError) {
      setPrivacyError(requestError.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="page-enter app-page profile-page">
      <PageHeader
        eyebrow="Account & privacy"
        title="A space that still feels like yours."
        description="Keep your account details current and protect access with a strong password."
        action={<button type="button" className="secondary-button" onClick={onOpenOnboarding}><Sparkles size={16} /> Personalize my space</button>}
      />

      <div className="profile-layout">
        <aside className="profile-identity" aria-label="Your account">
          <span className="profile-identity-avatar overflow-hidden" aria-hidden="true">{user.profileImage ? <img src={user.profileImage} alt="" className="h-full w-full object-cover" /> : initials || 'MH'}</span>
          <div className="min-w-0">
            <h2 className="break-words text-lg font-semibold text-pine-950">{user.name}</h2>
            <p className="mt-1 break-all text-sm text-slate-500">{user.email}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="secondary-button cursor-pointer px-3 py-2 text-xs">
              {savingPhoto ? <Spinner /> : <Camera size={15} />}{savingPhoto ? 'Processing' : user.profileImage ? 'Change photo' : 'Add photo'}
              <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={choosePhoto} disabled={savingPhoto} />
            </label>
            {user.profileImage && <button type="button" className="inline-flex min-h-10 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-slate-500 hover:bg-red-50 hover:text-red-700" onClick={() => updatePhoto('')} disabled={savingPhoto}><X size={14} /> Remove</button>}
          </div>
          <p className="profile-identity-note">Your records are personal. Access requires an authenticated account.</p>
        </aside>

        <form className="card p-5 sm:p-7" onSubmit={saveProfile}>
          <p className="eyebrow">Personal information</p>
          <h2 className="mt-2 section-title">Profile details</h2>
          <div className="mt-7 space-y-5">
            <div>
              <label className="field-label" htmlFor="profile-name">Full name</label>
              <input id="profile-name" className="field" value={profile.name} onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))} required />
            </div>
            <div>
              <label className="field-label" htmlFor="profile-email">Email address</label>
              <input id="profile-email" className="field" type="email" value={profile.email} onChange={(event) => setProfile((current) => ({ ...current, email: event.target.value }))} required />
            </div>
          </div>
          {profileError && <div className="mt-5"><Notice type="error">{profileError}</Notice></div>}
          <button className="primary-button mt-6 w-full" type="submit" disabled={savingProfile}>
            {savingProfile && <Spinner />}{savingProfile ? 'Saving changes' : 'Save profile'}
          </button>
        </form>

        <form className="card p-5 sm:p-7" onSubmit={changePassword}>
          <p className="eyebrow">Security</p>
          <h2 className="mt-2 section-title">Change password</h2>
          <div className="mt-7 space-y-5">
            <div>
              <label className="field-label" htmlFor="current-password">Current password</label>
              <input id="current-password" className="field" type="password" autoComplete="current-password" value={passwords.currentPassword} onChange={(event) => setPasswords((current) => ({ ...current, currentPassword: event.target.value }))} required />
            </div>
            <div>
              <label className="field-label" htmlFor="new-password">New password</label>
              <input id="new-password" className="field" type="password" minLength="6" autoComplete="new-password" value={passwords.newPassword} onChange={(event) => setPasswords((current) => ({ ...current, newPassword: event.target.value }))} required />
              <p className="mt-2 text-xs text-slate-400">Use at least 6 characters.</p>
            </div>
          </div>
          {passwordError && <div className="mt-5"><Notice type="error">{passwordError}</Notice></div>}
          <button className="secondary-button mt-6 w-full" type="submit" disabled={savingPassword}>
            {savingPassword && <Spinner />}{savingPassword ? 'Updating password' : 'Update password'}
          </button>
        </form>
      </div>

      <form className="card mt-6 overflow-hidden" onSubmit={saveExperience}>
        <div className="grid lg:grid-cols-[0.72fr_1.28fr]">
          <div className="settings-intro relative overflow-hidden p-6 sm:p-7">
            <span className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-pine-300/10 blur-2xl" />
            <span className="relative grid h-11 w-11 place-items-center rounded-2xl bg-pine-100 text-pine-700"><Settings2 size={19} /></span>
            <p className="relative mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-pine-50">Experience settings</p>
            <h2 className="relative mt-2 text-2xl font-semibold tracking-tight">Choose what MindHaven brings forward.</h2>
            <p className="relative mt-3 text-sm leading-6 text-pine-50">These preferences personalize Today and now follow your MindHaven account across devices. They do not change or delete health records.</p>
            <label className="relative mt-6 block text-xs font-bold text-pine-50" htmlFor="profile-reminder-time"><BellRing size={14} className="mr-1.5 inline" /> Preferred reflection time</label>
            <input id="profile-reminder-time" className="field mt-2" type="time" value={preferenceDraft.reminderTime} onChange={(event) => setPreferenceDraft((current) => ({ ...current, reminderTime: event.target.value }))} />
          </div>
          <div className="p-5 sm:p-7">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="eyebrow">Your priorities</p><h2 className="mt-2 section-title">What should feel most visible?</h2><p className="mt-2 text-sm text-slate-500">Choose up to three. Keep at least one selected.</p></div><span className="rounded-xl bg-pine-50 px-3 py-2 text-xs font-bold text-pine-700">{preferenceDraft.goals.length}/3 selected</span></div>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {WELLBEING_GOALS.map((goal) => {
                const selected = preferenceDraft.goals.includes(goal.id);
                return <button key={goal.id} type="button" onClick={() => toggleGoal(goal.id)} aria-pressed={selected} className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${selected ? 'border-pine-500 bg-pine-50' : 'border-slate-200 hover:border-pine-200'}`}><span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg ${selected ? 'bg-pine-700 text-white' : 'bg-slate-100 text-slate-400'}`}>{selected ? <Check size={14} /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}</span><span><span className="block text-sm font-semibold text-pine-950">{goal.label}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{goal.description}</span></span></button>;
              })}
            </div>
            <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl bg-slate-50 p-4"><input type="checkbox" className="mt-1 h-4 w-4 accent-pine-700" checked={preferenceDraft.gentlePrompts} onChange={(event) => setPreferenceDraft((current) => ({ ...current, gentlePrompts: event.target.checked }))} /><span><span className="block text-sm font-semibold text-pine-950">Gentle prompts</span><span className="mt-1 block text-xs leading-5 text-slate-500">Show supportive next steps without streak pressure or guilt.</span></span></label>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-pine-950"><span className="flex items-center gap-2"><Languages size={15} /> Interface language</span><select className="field mt-3" value={preferenceDraft.locale} onChange={(event) => setPreferenceDraft((current) => ({ ...current, locale: event.target.value }))}>{SUPPORTED_LOCALES.map((language) => <option key={language.id} value={language.id}>{language.nativeLabel}</option>)}</select></label>
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-slate-50 p-4"><input type="checkbox" className="mt-1 h-4 w-4 accent-pine-700" checked={preferenceDraft.compactMotion} onChange={(event) => setPreferenceDraft((current) => ({ ...current, compactMotion: event.target.checked }))} /><span><span className="block text-sm font-semibold text-pine-950">Reduce motion</span><span className="mt-1 block text-xs leading-5 text-slate-500">Use fewer decorative transitions and animations.</span></span></label>
            </div>
            <button type="submit" className="primary-button mt-5">Save experience settings</button>
          </div>
        </div>
      </form>

      <section className="card mt-6 overflow-hidden">
        <div className="grid lg:grid-cols-2">
          <div className="border-b border-slate-100 p-5 sm:p-7 lg:border-b-0 lg:border-r">
            <p className="eyebrow">Data ownership</p>
            <h2 className="mt-2 section-title">Take your records with you</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">Download a readable JSON file containing your profile, mood journal, tags, symptoms, sleep logs, medication schedules, and dose history.</p>
            <button type="button" className="secondary-button mt-5" onClick={exportData} disabled={exporting}>
              {exporting ? <Spinner /> : <Download size={17} />}{exporting ? 'Preparing export' : 'Download my data'}
            </button>
          </div>

          <div className="bg-[#fcf5f2] p-5 sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-600">Danger zone</p>
            <h2 className="mt-2 section-title text-red-950">Delete account & records</h2>
            <p className="mt-3 text-sm leading-6 text-red-900/65">This removes your account and all personal tracking records. Export your data first if you may need it later.</p>
            <label className="mt-5 block text-sm font-bold text-red-950" htmlFor="delete-password">Confirm with your current password</label>
            <div className="relative mt-2 max-w-md">
              <LockKeyhole size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-red-400" />
              <input id="delete-password" className="field border-red-200 pl-10 focus:border-red-400 focus:ring-red-100" type="password" autoComplete="current-password" value={deletePassword} onChange={(event) => setDeletePassword(event.target.value)} />
            </div>
            <button type="button" className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-800 disabled:opacity-60" onClick={deleteAccount} disabled={deleting}>
              {deleting ? <Spinner /> : <Trash2 size={17} />}{deleting ? 'Deleting account' : 'Delete my account'}
            </button>
          </div>
        </div>
        {privacyError && <div className="border-t border-red-100 p-5"><Notice type="error">{privacyError}</Notice></div>}
      </section>
    </div>
  );
}
