import { useEffect, useState } from 'react';
import { Activity, Copy, Eye, Link2, MoonStar, Pill, Share2, ShieldCheck, Sparkles, Trash2 } from 'lucide-react';
import { EmptyState, Notice, Spinner } from '../../components/Ui';
import { reportApi } from '../../lib/api';
import { formatDate } from '../../lib/format';

const SHARE_SECTIONS = [
  { id: 'sleep', label: 'Sleep', Icon: MoonStar },
  { id: 'symptoms', label: 'Body signals', Icon: Activity },
  { id: 'medication', label: 'Medication', Icon: Pill },
  { id: 'insights', label: 'Pattern insights', Icon: Sparkles },
];

export default function ReportSharingPanel({
  analytics,
  endDate,
  loading,
  notify,
  range,
  startDate,
  token,
}) {
  const [shares, setShares] = useState([]);
  const [shareExpiry, setShareExpiry] = useState(7);
  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState('');
  const [createdLink, setCreatedLink] = useState('');
  const [shareLabel, setShareLabel] = useState('');
  const [sections, setSections] = useState(SHARE_SECTIONS.map((section) => section.id));
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    let active = true;
    reportApi.getShares(token)
      .then((result) => { if (active) setShares(result); })
      .catch(() => { if (active) setShares([]); });
    return () => { active = false; };
  }, [token]);

  const createShare = async () => {
    if (!consent) {
      setShareError('Review the sharing scope and confirm before creating a link.');
      return;
    }
    setSharing(true);
    setShareError('');
    setCreatedLink('');
    try {
      const query = range === 'custom' ? { range, start: startDate, end: endDate } : { range };
      const share = await reportApi.createShare(token, {
        ...query,
        expiryDays: shareExpiry,
        label: shareLabel.trim() || `${analytics?.rangeLabel || 'Wellbeing'} report`,
        sections,
      });
      const link = `${window.location.origin}${window.location.pathname}?share=${encodeURIComponent(share.token)}`;
      setCreatedLink(link);
      setShares((current) => [share, ...current]);
      setConsent(false);
      await navigator.clipboard?.writeText(link);
      notify('Secure report link created and copied.');
    } catch (requestError) {
      setShareError(requestError.message);
    } finally {
      setSharing(false);
    }
  };

  const toggleSection = (sectionId) => {
    setSections((current) => current.includes(sectionId)
      ? current.filter((item) => item !== sectionId)
      : [...current, sectionId]);
  };

  const copyShare = async () => {
    try {
      await navigator.clipboard.writeText(createdLink);
      notify('Secure link copied.');
    } catch {
      setShareError('Copying is blocked by this browser. Select the link and copy it manually.');
    }
  };

  const revokeShare = async (share) => {
    if (!window.confirm('Revoke this report link? Anyone using it will immediately lose access.')) return;
    try {
      const revoked = await reportApi.revokeShare(token, share._id);
      setShares((current) => current.map((item) => item._id === revoked._id ? revoked : item));
      notify('Shared report access revoked.');
    } catch (requestError) {
      setShareError(requestError.message);
    }
  };

  const activeShareCount = shares.filter(
    (share) => !share.revokedAt && new Date(share.expiresAt) > new Date(),
  ).length;

  return (
    <section className="card mt-5 overflow-hidden">
      <div className="grid xl:grid-cols-[0.9fr_1.1fr]">
        <div className="signed-banner relative overflow-hidden p-6 text-white sm:p-8">
          <span className="absolute -right-16 -top-16 h-56 w-56 rounded-full border border-white/10" />
          <span className="relative grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-pine-50"><Share2 size={21} /></span>
          <p className="relative mt-5 text-xs font-bold uppercase tracking-[0.18em] text-pine-100">Secure report sharing</p>
          <h2 className="relative mt-2 text-2xl font-semibold tracking-tight">Share the selected report without sending your account.</h2>
          <p className="relative mt-3 text-sm leading-6 text-pine-50">Create an expiring, revocable link for a doctor, counsellor, or trusted person. Only the selected report period is visible.</p>
          <label className="relative mt-6 block text-xs font-bold text-pine-100" htmlFor="share-expiry">Link duration</label>
          <select id="share-expiry" className="field mt-2 max-w-xs text-pine-950" value={shareExpiry} onChange={(event) => setShareExpiry(Number(event.target.value))}><option value="1">1 day</option><option value="3">3 days</option><option value="7">7 days</option><option value="14">14 days</option><option value="30">30 days</option></select>
          <label className="relative mt-4 block text-xs font-bold text-pine-100" htmlFor="share-label">Link label</label>
          <input id="share-label" className="field mt-2 max-w-sm text-pine-950" maxLength="80" value={shareLabel} onChange={(event) => setShareLabel(event.target.value)} placeholder={analytics?.rangeLabel ? `${analytics.rangeLabel} report` : 'Wellbeing report'} />
          <fieldset className="relative mt-4 rounded-2xl border border-white/15 bg-white/10 p-4"><legend className="px-1 text-xs font-bold text-pine-50">Choose what else to include</legend><p className="mb-3 text-xs leading-5 text-pine-100">Mood summary and selected dates are always included.</p><div className="grid grid-cols-2 gap-2">{SHARE_SECTIONS.map(({ id, label, Icon }) => <label key={id} className="flex cursor-pointer items-center gap-2 rounded-xl bg-white/10 p-2.5 text-xs font-bold text-white"><input type="checkbox" className="h-4 w-4 accent-coral-300" checked={sections.includes(id)} onChange={() => toggleSection(id)} /><Icon size={14} /> {label}</label>)}</div></fieldset>
          <label className="relative mt-4 flex cursor-pointer items-start gap-3 rounded-2xl bg-white/10 p-4 text-xs leading-5 text-pine-50"><input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-coral-300" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>I understand that anyone with this link can view the selected report until it expires or I revoke it.</span></label>
          <button type="button" className="relative mt-4 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-coral-300 px-5 py-3 text-sm font-bold text-pine-950 transition hover:bg-coral-200" onClick={createShare} disabled={sharing || loading || !consent}>{sharing ? <Spinner /> : <Link2 size={17} />}{sharing ? 'Creating secure link' : 'Create and copy link'}</button>
          <p className="relative mt-4 flex items-start gap-2 text-xs leading-5 text-pine-100"><ShieldCheck size={14} className="mt-0.5 shrink-0" />The raw access token is shown only when created. MindHaven stores a one-way hash.</p>
        </div>

        <div className="p-5 sm:p-8">
          <div className="flex items-center justify-between gap-3"><div><p className="eyebrow">Access control</p><h2 className="mt-2 section-title">Shared links</h2></div><span className="rounded-xl bg-pine-50 px-3 py-2 text-xs font-bold text-pine-700">{activeShareCount} active</span></div>
          {createdLink && <div className="mt-5 rounded-2xl border border-pine-200 bg-pine-50 p-4"><p className="text-xs font-bold text-pine-700">New link—save it now</p><div className="mt-2 flex gap-2"><input className="field min-w-0 flex-1 bg-white text-xs" value={createdLink} readOnly onFocus={(event) => event.target.select()} aria-label="New secure report link" /><button type="button" className="secondary-button shrink-0 px-3" onClick={copyShare}><Copy size={16} /> <span className="hidden sm:inline">Copy</span></button></div></div>}
          {shareError && <div className="mt-4"><Notice type="error">{shareError}</Notice></div>}
          <div className="mt-5 space-y-3">
            {!shares.length && <EmptyState symbol={<Link2 size={18} />} title="No report links yet" message="Create a temporary link when you are ready to share a selected report." />}
            {shares.slice(0, 8).map((share) => {
              const expired = new Date(share.expiresAt) <= new Date();
              const inactive = Boolean(share.revokedAt) || expired;
              return <article key={share._id} className={`flex flex-col justify-between gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center ${inactive ? 'border-slate-200 bg-slate-50 opacity-70' : 'border-pine-100 bg-white'}`}><div className="min-w-0"><p className="truncate text-sm font-semibold text-pine-950">{share.label}</p><p className="mt-1 text-xs text-slate-500">Token •••{share.tokenPreview} · {share.revokedAt ? 'Revoked' : expired ? 'Expired' : `Expires ${formatDate(share.expiresAt)}`}</p><p className="mt-1 flex flex-wrap items-center gap-1 text-xs text-slate-400"><Eye size={12} /> Opened {share.accessCount || 0} time{share.accessCount === 1 ? '' : 's'}{share.lastAccessedAt ? ` · Last ${formatDate(share.lastAccessedAt)}` : ''} · Mood + {(share.sections || []).join(', ') || 'no extra sections'}</p></div>{!inactive && <button type="button" className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50" onClick={() => revokeShare(share)}><Trash2 size={14} /> Revoke</button>}</article>;
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
