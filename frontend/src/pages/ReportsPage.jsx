import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowRight,
  BarChart3,
  CalendarCheck2,
  CalendarRange,
  CheckCircle2,
  Clock3,
  Compass,
  Download,
  FlaskConical,
  Info,
  Layers3,
  MoonStar,
  Pill,
  SmilePlus,
  Sparkles,
  Tag,
} from 'lucide-react';
import ReportSharingPanel from '../features/insights/ReportSharingPanel';
import TrendChart from '../components/TrendChart';
import { EmptyState, Notice, PageHeader, Spinner } from '../components/Ui';
import { reportApi } from '../lib/api';
import { average, formatRelativeDate, localDateKey, moodLabel } from '../lib/format';
import { downloadBlob } from '../lib/download';

const RANGE_OPTIONS = [
  { value: 'week', label: 'Weekly', detail: '7 days' },
  { value: 'month', label: 'Monthly', detail: '30 days' },
  { value: 'year', label: 'Yearly', detail: '12 months' },
  { value: 'custom', label: 'Custom', detail: 'Choose dates' },
];

const isoDate = (date) => date.toISOString().slice(0, 10);
const defaultEnd = isoDate(new Date());
const defaultStartDate = new Date();
defaultStartDate.setDate(defaultStartDate.getDate() - 29);
const defaultStart = isoDate(defaultStartDate);

const directionCopy = {
  improving: ['Moving upward', 'Your latest active period is higher than your first.'],
  declining: ['Moving downward', 'Your latest active period is lower than your first.'],
  steady: ['Holding steady', 'Your first and latest active periods are close.'],
  'not-enough-data': ['Still gathering', 'Log across two periods to calculate a direction.'],
};

const safeAverage = (values) => average(values.map(Number).filter(Number.isFinite));

function MetricCard({ Icon, label, value, detail, chip }) {
  return (
    <article className="metric-card signed-surface border border-pine-100 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-pine-100 text-pine-700 transition group-hover:bg-pine-700 group-hover:text-white"><Icon size={17} /></span>
        {chip && <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-pine-600 shadow-sm">{chip}</span>}
      </div>
      <p className="metric-card-label mt-4">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-pine-950">{value}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>
    </article>
  );
}

function SignalRow({ label, value, detail, Icon }) {
  const width = value === null ? 0 : Math.max(4, Math.min(100, Number(value) * 10));
  return (
    <div className="signed-surface rounded-2xl border border-pine-100 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-semibold text-pine-950"><Icon size={15} className="text-pine-600" /> {label}</p>
        <span className="text-sm font-semibold text-pine-800">{value === null ? '—' : `${value}/10`}</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-pine-100"><span className="block h-full rounded-full bg-pine-400 transition-all duration-500" style={{ width: `${width}%` }} /></div>
      <p className="mt-2 text-xs font-semibold text-slate-400">{detail}</p>
    </div>
  );
}

function ContextBreakdown({ contexts }) {
  const maximum = contexts[0]?.count || 1;
  if (!contexts.length) return <EmptyState symbol={<Tag size={18} />} title="No context themes yet" message="Add tags such as work, study, family, or health to journal entries to reveal recurring themes." />;
  return (
    <div className="space-y-3">
      {contexts.map((context) => (
        <div key={context.label}>
          <div className="flex items-center justify-between gap-3"><p className="text-sm font-bold text-pine-950">#{context.label}</p><p className="text-xs font-semibold text-pine-600">{context.count} entr{context.count === 1 ? 'y' : 'ies'}</p></div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-pine-100"><span className="block h-full rounded-full bg-pine-500" style={{ width: `${Math.max(8, (context.count / maximum) * 100)}%` }} /></div>
        </div>
      ))}
    </div>
  );
}

export default function ReportsPage({ token, notify, data, onNavigate }) {
  const [range, setRange] = useState('week');
  const [analytics, setAnalytics] = useState(null);
  const [insights, setInsights] = useState(null);
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  const insightDays = useMemo(() => {
    if (range === 'week') return 14;
    if (range === 'month') return 30;
    if (range === 'year') return 365;
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);
    const days = Math.round((end - start) / 86400000) + 1;
    return Math.min(365, Math.max(14, Number.isFinite(days) ? days : 30));
  }, [endDate, range, startDate]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    if (range === 'custom' && (!startDate || !endDate || startDate > endDate)) {
      setError('Choose a valid start and end date.');
      setLoading(false);
      return () => { active = false; };
    }
    const query = range === 'custom' ? { start: startDate, end: endDate } : { range };
    reportApi
      .getMoodTrends(token, query)
      .then((result) => { if (active) setAnalytics(result); })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [endDate, range, startDate, token]);

  useEffect(() => {
    let active = true;
    reportApi.getInsights(token, insightDays)
      .then((result) => { if (active) setInsights(result); })
      .catch(() => { if (active) setInsights(null); });
    return () => { active = false; };
  }, [insightDays, token]);


  const selectedRecords = useMemo(() => {
    const start = analytics?.startDate ? new Date(analytics.startDate) : null;
    const end = analytics?.endDate ? new Date(analytics.endDate) : null;
    const inWindow = (entry) => {
      if (!start || !end || !entry?.createdAt) return false;
      const date = new Date(entry.createdAt);
      return date >= start && date <= end;
    };
    return {
      moods: (data?.moods || []).filter(inWindow),
      sleep: (data?.sleep || []).filter(inWindow),
      symptoms: (data?.symptoms || []).filter(inWindow),
    };
  }, [analytics?.endDate, analytics?.startDate, data?.moods, data?.sleep, data?.symptoms]);

  const dashboard = useMemo(() => {
    const { moods, sleep, symptoms } = selectedRecords;
    const start = analytics?.startDate ? new Date(analytics.startDate) : new Date();
    const end = analytics?.endDate ? new Date(analytics.endDate) : new Date();
    // The API end timestamp is the end of the day; rounding would add an extra day.
    const calendarDays = Math.max(1, Math.floor((end - start) / 86400000) + 1);
    const trackedDays = new Set([
      ...moods.map((entry) => localDateKey(new Date(entry.createdAt))),
      ...sleep.map((entry) => localDateKey(new Date(entry.createdAt))),
      ...symptoms.map((entry) => localDateKey(new Date(entry.createdAt))),
    ]);
    const coverage = Math.min(100, Math.round((trackedDays.size / calendarDays) * 100));
    const decisions = data?.medicationDoses || [];
    const taken = decisions.filter((dose) => dose.status === 'taken').length;
    const medicationCompletion = decisions.length ? Math.round((taken / decisions.length) * 100) : null;

    const contextCounts = new Map();
    moods.forEach((mood) => {
      (data?.tagsByMood?.[mood._id] || []).forEach((tag) => {
        const label = tag.label?.trim().toLowerCase();
        if (label) contextCounts.set(label, (contextCounts.get(label) || 0) + 1);
      });
    });
    const contexts = [...contextCounts].map(([label, count]) => ({ label, count })).sort((left, right) => right.count - left.count).slice(0, 5);

    const weekdayBuckets = Array.from({ length: 7 }, (_, index) => ({
      index,
      label: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][index],
      values: [],
    }));
    moods.forEach((mood) => weekdayBuckets[new Date(mood.createdAt).getDay()].values.push(Number(mood.moodValue)));
    const weekdays = weekdayBuckets.map((bucket) => ({ ...bucket, average: safeAverage(bucket.values), count: bucket.values.length }));

    const allActivity = [
      ...moods.map((entry) => entry.createdAt),
      ...sleep.map((entry) => entry.createdAt),
      ...symptoms.map((entry) => entry.createdAt),
    ].filter(Boolean).sort((left, right) => new Date(right) - new Date(left));

    return {
      calendarDays,
      trackedDays: trackedDays.size,
      coverage,
      sleepDuration: safeAverage(sleep.map((entry) => entry.sleepDuration)),
      sleepQuality: safeAverage(sleep.map((entry) => entry.sleepQuality)),
      anxiety: safeAverage(symptoms.map((entry) => entry.anxietyLevel)),
      energy: safeAverage(symptoms.map((entry) => entry.energyLevel)),
      appetite: safeAverage(symptoms.map((entry) => entry.appetite)),
      medicationCompletion,
      medicationDecisions: decisions.length,
      contexts,
      weekdays,
      latestActivity: allActivity[0] || null,
      totalRecords: moods.length + sleep.length + symptoms.length,
    };
  }, [analytics?.endDate, analytics?.startDate, data?.medicationDoses, data?.tagsByMood, selectedRecords]);

  const direction = directionCopy[analytics?.trend?.direction] || directionCopy['not-enough-data'];
  const trendChange = analytics?.trend?.change;
  const readyInsights = (insights?.insights || []).filter((insight) => insight.status === 'ready').length;
  const gatheringInsights = (insights?.insights || []).filter((insight) => insight.status !== 'ready');
  const topContext = dashboard.contexts[0];
  const moodSummary = analytics?.averageMood
    ? `${moodLabel(analytics.averageMood)} overall at ${analytics.averageMood}/10`
    : 'Your mood baseline is still forming';

  const nextAction = useMemo(() => {
    if (!selectedRecords.moods.length) return { page: 'mood', title: 'Start with one mood entry', detail: 'Insights need a feeling score before they can compare anything.', action: 'Open journal', Icon: SmilePlus };
    const sleepInsight = (insights?.insights || []).find((item) => item.id === 'sleep-mood');
    if (sleepInsight?.status !== 'ready') return { page: 'sleep', title: 'Pair sleep with mood', detail: `${sleepInsight?.sampleSize || 0}/${sleepInsight?.minimumSampleSize || 5} paired days are ready.`, action: 'Log sleep', Icon: MoonStar };
    const anxietyInsight = (insights?.insights || []).find((item) => item.id === 'anxiety-mood');
    if (anxietyInsight?.status !== 'ready') return { page: 'symptoms', title: 'Add body signals', detail: `${anxietyInsight?.sampleSize || 0}/${anxietyInsight?.minimumSampleSize || 5} paired days are ready.`, action: 'Check body signals', Icon: Activity };
    return { page: 'checkin', title: 'Keep the picture current', detail: 'Your core comparisons are ready. One connected check-in keeps them useful.', action: 'Daily check-in', Icon: CheckCircle2 };
  }, [insights?.insights, selectedRecords.moods.length]);

  const downloadReport = async () => {
    setDownloading(true);
    setError('');
    try {
      const query = range === 'custom' ? { start: startDate, end: endDate } : { range };
      const blob = await reportApi.download(token, query);
      downloadBlob(blob, `mindhaven-${range}-report-${new Date().toISOString().slice(0, 10)}.pdf`);
      notify('Your PDF report has been downloaded.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setDownloading(false);
    }
  };


  return (
    <div className="page-enter app-page reports-page">
      <PageHeader
        eyebrow="Insights & personal patterns"
        title="See what your days are beginning to say."
        description="A transparent view of mood, sleep, body signals, context, and medication consistency—built only from your own records."
        action={<button type="button" className="primary-button" onClick={downloadReport} disabled={downloading || loading}>{downloading ? <Spinner /> : <Download size={17} />}{downloading ? 'Preparing PDF' : 'Download report'}</button>}
      />

      {error && <div className="mb-5"><Notice type="error">{error}</Notice></div>}

      <section className="card mb-5 overflow-hidden" aria-label="Insight timeframe">
        <div className="flex flex-col gap-4 border-b border-pine-100 bg-pine-50/70 p-3 sm:p-4 lg:flex-row lg:items-center">
          <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-4">
            {RANGE_OPTIONS.map((option) => (
              <button key={option.value} type="button" onClick={() => setRange(option.value)} className={`insight-range border border-transparent px-3 py-3 text-center transition ${range === option.value ? 'bg-pine-800 text-white shadow-sm' : 'bg-white text-pine-800 hover:bg-pine-100'}`} aria-pressed={range === option.value}>
                <span className="block text-sm font-semibold">{option.label}</span>
                <span className={`mt-0.5 block text-xs font-semibold ${range === option.value ? 'text-pine-700' : 'text-slate-400'}`}>{option.detail}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-bold text-pine-700 shadow-sm"><Clock3 size={14} /> {loading ? 'Refreshing…' : `Live from ${dashboard.totalRecords} selected records`}</div>
        </div>
        {range === 'custom' && (
          <div className="flex flex-col gap-3 bg-white/70 px-5 py-4 sm:flex-row sm:items-end sm:px-7">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-pine-100 text-pine-700"><CalendarRange size={18} /></span>
            <label className="flex-1 text-xs font-bold text-slate-500">Start date<input className="field mt-1.5" type="date" value={startDate} max={endDate || defaultEnd} onChange={(event) => setStartDate(event.target.value)} /></label>
            <label className="flex-1 text-xs font-bold text-slate-500">End date<input className="field mt-1.5" type="date" value={endDate} min={startDate} max={defaultEnd} onChange={(event) => setEndDate(event.target.value)} /></label>
            <p className="max-w-xs text-xs leading-5 text-slate-400">Up to 366 days. Every selected-period metric uses these same dates.</p>
          </div>
        )}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="insight-summary relative overflow-hidden p-5 sm:p-7">
          <span className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-pine-300/10 blur-2xl" />
          <div className="relative flex flex-col justify-between gap-7 sm:flex-row sm:items-end">
            <div className="max-w-xl"><p className="text-xs font-semibold uppercase tracking-[0.17em] text-pine-50">{analytics?.rangeLabel || 'Selected period'}</p><h2 className="mt-3 text-2xl font-semibold leading-snug tracking-[-0.025em]">{moodSummary}</h2><p className="mt-3 text-sm leading-6 text-pine-50">{direction[0]}. {direction[1]}</p></div>
            <div className="grid grid-cols-2 gap-2 sm:min-w-56"><div className="insight-summary-stat p-4"><p className="text-xs font-bold uppercase text-pine-50">Active days</p><p className="mt-1 text-2xl font-semibold">{dashboard.trackedDays}</p></div><div className="insight-summary-stat p-4"><p className="text-xs font-bold uppercase text-pine-50">Patterns ready</p><p className="mt-1 text-2xl font-semibold">{readyInsights}/2</p></div></div>
          </div>
          <p className="relative mt-7 flex items-start gap-2 border-t border-white/20 pt-5 text-xs leading-5 text-pine-50"><Info size={14} className="mt-0.5 shrink-0" /> These summaries describe your logs. They do not diagnose a condition or prove that one factor caused another.</p>
        </article>

        <article className="card flex flex-col justify-between p-6 sm:p-7">
          <div className="coverage-layout flex items-start gap-5">
            <div className="relative grid h-24 w-24 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(#65629c ${dashboard.coverage}%, #e3e1f0 ${dashboard.coverage}% 100%)` }}><span className="grid h-[4.7rem] w-[4.7rem] place-items-center rounded-full bg-white text-xl font-semibold text-pine-950">{dashboard.coverage}%</span></div>
            <div><p className="eyebrow">Tracking coverage</p><h2 className="mt-2 text-xl font-semibold tracking-tight text-pine-950">{dashboard.trackedDays} of {dashboard.calendarDays} days</h2><p className="mt-2 text-xs leading-5 text-slate-500">A day counts when it contains a mood, sleep, or body-signal record. Gaps remain visible rather than being estimated.</p></div>
          </div>
          <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl bg-pine-50 p-4"><div><p className="text-xs font-bold text-slate-400">Latest selected-period activity</p><p className="mt-1 text-sm font-semibold text-pine-950">{dashboard.latestActivity ? formatRelativeDate(dashboard.latestActivity) : 'No activity yet'}</p></div><CalendarCheck2 size={19} className="text-pine-600" /></div>
        </article>
      </section>

      <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Key wellbeing metrics">
        <MetricCard Icon={SmilePlus} label="Average mood" value={analytics?.averageMood ? `${analytics.averageMood}/10` : '—'} detail={`${analytics?.totalEntries || 0} mood entries in this period`} chip={trendChange == null ? 'No comparison' : `${trendChange > 0 ? '+' : ''}${trendChange} pts`} />
        <MetricCard Icon={MoonStar} label="Average sleep" value={dashboard.sleepDuration === null ? '—' : `${dashboard.sleepDuration}h`} detail={`Quality ${dashboard.sleepQuality === null ? 'not recorded' : `${dashboard.sleepQuality}/10`}`} chip={`${selectedRecords.sleep.length} logs`} />
        <MetricCard Icon={Activity} label="Average anxiety" value={dashboard.anxiety === null ? '—' : `${dashboard.anxiety}/10`} detail="Lower and higher values are personal observations" chip={`${selectedRecords.symptoms.length} logs`} />
        <MetricCard Icon={Pill} label="Medication completion" value={dashboard.medicationCompletion === null ? '—' : `${dashboard.medicationCompletion}%`} detail="Taken ÷ recorded dose decisions in the last 7 days" chip={`${dashboard.medicationDecisions} decisions`} />
      </section>

      <section className="mt-5 grid items-stretch gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <article className="card p-5 sm:p-7">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="eyebrow">Movement over time</p><h2 className="mt-2 section-title">Mood rhythm</h2></div><p className="text-xs font-semibold text-slate-400">Daily or monthly averages · 1–10 scale</p></div>
          <div className={`mt-5 transition-opacity ${loading ? 'opacity-40' : 'opacity-100'}`}><TrendChart series={analytics?.series || []} /></div>
        </article>

        <article className="card p-5 sm:p-7">
          <p className="eyebrow">Signal profile</p><h2 className="mt-2 section-title">How the body felt</h2><p className="mt-2 text-xs leading-5 text-slate-500">Averages use symptom check-ins inside the selected period.</p>
          <div className="mt-5 space-y-3">
            <SignalRow Icon={Activity} label="Anxiety" value={dashboard.anxiety} detail="1 is calm; 10 is intense" />
            <SignalRow Icon={Sparkles} label="Energy" value={dashboard.energy} detail="1 is drained; 10 is energized" />
            <SignalRow Icon={Layers3} label="Appetite" value={dashboard.appetite} detail="1 is very low; 10 is strong" />
          </div>
        </article>
      </section>

      <section className="mt-5 card p-5 sm:p-7">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="eyebrow">Explainable relationships</p><h2 className="mt-2 section-title">What paired records suggest</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">A relationship waits for at least five days containing both measurements. Sample sizes stay visible.</p></div><span className="rounded-xl bg-pine-50 px-3 py-2 text-xs font-semibold text-pine-700">Last {insights?.days || insightDays} days</span></div>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {(insights?.insights || []).map((insight) => {
            const progress = Math.min(100, Math.round((insight.sampleSize / insight.minimumSampleSize) * 100));
            return (
              <article key={insight.id} className={`rounded-[1.35rem] border p-5 ${insight.status === 'ready' ? 'border-pine-200 bg-gradient-to-br from-pine-50 to-white' : 'border-pine-100 bg-white/70'}`}>
                <div className="flex items-start justify-between gap-3"><span className={`grid h-11 w-11 place-items-center rounded-xl ${insight.status === 'ready' ? 'bg-pine-700 text-white' : 'bg-pine-100 text-pine-600'}`}>{insight.status === 'ready' ? <CheckCircle2 size={18} /> : <FlaskConical size={18} />}</span><span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-pine-600 shadow-sm">n={insight.sampleSize}</span></div>
                <h3 className="mt-4 text-lg font-semibold text-pine-950">{insight.title}</h3><p className="mt-2 text-sm font-semibold leading-6 text-pine-900">{insight.statement}</p><p className="mt-2 text-xs leading-5 text-slate-500">{insight.detail}</p>
                <details className="mt-4 rounded-xl border border-pine-100 bg-white/80 p-3 text-xs text-slate-500"><summary className="cursor-pointer font-bold text-pine-700">How this was calculated</summary><p className="mt-2 leading-5">{insight.method || 'Daily records with both measurements are paired and compared.'}</p><p className="mt-2 leading-5"><strong>Limit:</strong> {insight.limitation || 'Personal logs can show association, not cause or diagnosis.'}</p></details>
                {insight.status !== 'ready' && <div className="mt-4"><div className="h-2 overflow-hidden rounded-full bg-pine-100"><span className="block h-full rounded-full bg-pine-500" style={{ width: `${progress}%` }} /></div><p className="mt-2 text-xs font-bold text-slate-400">{insight.sampleSize}/{insight.minimumSampleSize} paired days</p></div>}
              </article>
            );
          })}
          {!insights && <EmptyState symbol={<FlaskConical size={18} />} title="Preparing relationships" message="MindHaven is comparing days that contain matching measurements." />}
        </div>
        <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-slate-400"><Info size={14} className="mt-0.5 shrink-0" /> {insights?.disclaimer || 'Correlations describe your records and do not establish cause or provide a diagnosis.'}</p>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-2">
        <article className="card p-5 sm:p-7">
          <div className="record-heading"><div><p className="eyebrow">Journal context</p><h2 className="mt-2 section-title">What appears around your moods</h2></div>{topContext && <span className="rounded-full bg-pine-100 px-3 py-1.5 text-xs font-semibold text-pine-700">Most frequent: #{topContext.label}</span>}</div>
          <p className="mt-2 text-xs leading-5 text-slate-500">Counts reflect tags attached to mood entries in this period; they do not imply cause.</p>
          <div className="mt-6"><ContextBreakdown contexts={dashboard.contexts} /></div>
        </article>

        <article className="card p-5 sm:p-7">
          <div><p className="eyebrow">Day-of-week view</p><h2 className="mt-2 section-title">Average mood by weekday</h2><p className="mt-2 text-xs leading-5 text-slate-500">Only weekdays with at least one mood entry receive a bar.</p></div>
          <div className="mt-6 flex h-52 items-end gap-2 sm:gap-3" aria-label="Average mood by weekday">
            {dashboard.weekdays.map((day) => <div key={day.label} className="flex h-full flex-1 flex-col items-center justify-end gap-2" title={`${day.label}: ${day.average === null ? 'No entries' : `${day.average}/10 from ${day.count}`}`}><span className="text-xs font-semibold text-pine-700">{day.average ?? '—'}</span><span className="flex h-36 w-full items-end overflow-hidden rounded-xl bg-pine-50"><span className={`block w-full rounded-xl ${day.average === null ? 'h-2 bg-pine-100' : 'bg-pine-300'}`} style={day.average === null ? undefined : { height: `${day.average * 10}%` }} /></span><span className="text-xs font-bold text-slate-400">{day.label}</span></div>)}
          </div>
        </article>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <article className="insight-next-step relative overflow-hidden p-6 sm:p-7">
          <span className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-pine-300/10 blur-2xl" />
          <span className="relative grid h-11 w-11 place-items-center rounded-2xl bg-white/10 text-pine-50"><Compass size={19} /></span><p className="relative mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-pine-50">Best next step</p><h2 className="relative mt-2 text-2xl font-semibold tracking-tight">{nextAction.title}</h2><p className="relative mt-2 text-sm leading-6 text-pine-50">{nextAction.detail}</p><button type="button" onClick={() => onNavigate(nextAction.page)} className="relative mt-6 inline-flex items-center gap-2 rounded-xl bg-pine-50 px-4 py-3 text-sm font-semibold text-pine-900 transition hover:-translate-y-0.5"><nextAction.Icon size={16} /> {nextAction.action} <ArrowRight size={15} /></button>
        </article>

        <article className="card p-6 sm:p-7">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="eyebrow">Report readiness</p><h2 className="mt-2 section-title">A useful summary, with the gaps included</h2></div><span className="rounded-xl bg-pine-50 px-3 py-2 text-xs font-semibold text-pine-700">{readyInsights} ready · {gatheringInsights.length} gathering</span></div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              [BarChart3, 'Mood overview', `${analytics?.totalEntries || 0} entries with trend and range`],
              [MoonStar, 'Sleep context', `${selectedRecords.sleep.length} sleep logs selected`],
              [Activity, 'Body signals', `${selectedRecords.symptoms.length} symptom logs selected`],
              [Pill, 'Medication reference', `${data?.medications?.length || 0} schedules in your account`],
            ].map(([Icon, title, detail]) => <div key={title} className="flex items-start gap-3 rounded-2xl bg-pine-50/70 p-4"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-pine-600 shadow-sm"><Icon size={16} /></span><div><p className="text-sm font-semibold text-pine-950">{title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p></div></div>)}
          </div>
          <div className="mt-5 flex flex-col justify-between gap-3 rounded-2xl border border-pine-100 bg-white p-4 sm:flex-row sm:items-center"><p className="text-xs leading-5 text-slate-500">The PDF uses the same selected dates and clearly labels MindHaven as personal tracking—not clinical interpretation.</p><button type="button" className="secondary-button shrink-0" onClick={downloadReport} disabled={downloading || loading}>{downloading ? <Spinner /> : <Download size={16} />} Download PDF</button></div>
        </article>
      </section>

      <ReportSharingPanel
        analytics={analytics}
        endDate={endDate}
        loading={loading}
        notify={notify}
        range={range}
        startDate={startDate}
        token={token}
      />
    </div>
  );
}
