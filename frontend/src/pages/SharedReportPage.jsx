import { useEffect, useState } from 'react';
import { Activity, CalendarRange, Download, LockKeyhole, MoonStar, ShieldCheck, UserRound } from 'lucide-react';
import Brand from '../components/Brand';
import { EmptyState, Spinner } from '../components/Ui';
import { reportApi } from '../lib/api';
import { downloadBlob } from '../lib/download';
import { formatDate } from '../lib/format';

export default function SharedReportPage({ shareToken }) {
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    reportApi.getPublicShare(shareToken)
      .then((result) => { if (active) setPayload(result); })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [shareToken]);

  const download = async () => {
    setDownloading(true);
    try {
      const blob = await reportApi.downloadPublicShare(shareToken);
      downloadBlob(blob, `mindhaven-shared-report-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f6f1] text-pine-950">
      <header className="border-b border-pine-200/70 bg-white/80 backdrop-blur-xl"><div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4 sm:px-6"><Brand /><span className="inline-flex items-center gap-2 rounded-full bg-pine-50 px-3 py-2 text-xs font-bold text-pine-700"><ShieldCheck size={14} /> Secure shared view</span></div></header>
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        {loading && <div className="card flex min-h-80 items-center justify-center gap-3"><Spinner /> Opening the secure report</div>}
        {!loading && error && <div className="card p-8"><EmptyState symbol={<LockKeyhole size={20} />} title="This report is not available" message={error} /><p className="mt-5 text-center text-xs text-slate-500">Ask the person who shared it to create a new link.</p></div>}
        {payload && (() => {
          const { report, share } = payload;
          return <>
            <section className="signed-banner overflow-hidden rounded-[2rem] p-6 text-white shadow-soft sm:p-9"><div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-pine-100">MindHaven wellbeing report</p><h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">A private summary shared by {report.user.name}.</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-pine-50">Personal tracking information for discussion—not a diagnosis or clinical assessment.</p></div><button type="button" className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-pine-900" onClick={download} disabled={downloading}>{downloading ? <Spinner /> : <Download size={17} />}{downloading ? 'Preparing PDF' : 'Download PDF'}</button></div></section>
            <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[[UserRound, 'Prepared for', report.user.name], [CalendarRange, 'Reporting period', report.analytics.rangeLabel], [Activity, 'Average mood', report.analytics.averageMood ? `${report.analytics.averageMood}/10` : 'No data'], [MoonStar, 'Average sleep', report.averages.sleepDuration ? `${report.averages.sleepDuration}h` : 'No data']].map(([Icon, label, value]) => <article key={label} className="card p-5"><Icon size={18} className="text-pine-600" /><p className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-2 text-lg font-semibold text-pine-950">{value}</p></article>)}
            </section>
            <section className="card mt-6 p-6 sm:p-8"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="eyebrow">Report coverage</p><h2 className="mt-2 section-title">The records behind this summary</h2></div><span className="rounded-xl bg-pine-50 px-3 py-2 text-xs font-bold text-pine-700">Expires {formatDate(share.expiresAt)}</span></div><div className="mt-4 flex flex-wrap gap-2"><span className="rounded-full bg-pine-700 px-3 py-1.5 text-xs font-bold text-white">Mood included</span>{(share.sections || []).map((section) => <span key={section} className="rounded-full bg-pine-50 px-3 py-1.5 text-xs font-bold capitalize text-pine-700">{section}</span>)}</div><div className="mt-6 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-pine-50 p-4"><p className="text-2xl font-semibold">{report.moods.length}</p><p className="mt-1 text-xs font-bold text-slate-500">Mood entries</p></div><div className="rounded-2xl bg-pine-50 p-4"><p className="text-2xl font-semibold">{report.sleepLogs.length}</p><p className="mt-1 text-xs font-bold text-slate-500">Sleep logs</p></div><div className="rounded-2xl bg-pine-50 p-4"><p className="text-2xl font-semibold">{report.symptomLogs.length}</p><p className="mt-1 text-xs font-bold text-slate-500">Body-signal logs</p></div></div><p className="mt-6 rounded-2xl bg-amber-50 p-4 text-xs leading-6 text-amber-900">Only the categories chosen by the owner are included. The owner can revoke this link at any time.</p></section>
          </>;
        })()}
      </main>
    </div>
  );
}
