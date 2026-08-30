export function Spinner({ label = 'Loading' }) {
  return (
    <span className="inline-flex items-center gap-2" role="status">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function LoadingPanel({ message = 'Gathering your check-ins...' }) {
  return (
    <div className="space-y-5" role="status" aria-busy="true">
      <span className="sr-only">{message}</span>
      <div className="signed-banner relative overflow-hidden rounded-[2.15rem] p-7 sm:p-9">
        <div className="animate-pulse">
          <div className="h-3 w-32 rounded-full bg-white/15" />
          <div className="mt-5 h-10 w-3/5 rounded-2xl bg-white/15" />
          <div className="mt-3 h-4 w-2/5 rounded-full bg-white/10" />
          <div className="mt-7 flex gap-3"><div className="h-12 w-40 rounded-full bg-pine-300/45" /><div className="h-12 w-28 rounded-full bg-white/10" /></div>
        </div>
      </div>
      <div className="grid animate-pulse gap-5 lg:grid-cols-3">
        {[0, 1, 2].map((item) => <div key={item} className="card h-44 p-6"><div className="h-10 w-10 rounded-xl bg-pine-100" /><div className="mt-5 h-4 w-1/2 rounded-full bg-slate-100" /><div className="mt-3 h-3 w-4/5 rounded-full bg-slate-100" /><div className="mt-2 h-3 w-3/5 rounded-full bg-slate-100" /></div>)}
      </div>
    </div>
  );
}

export function EmptyState({ symbol = '•', title, message, action }) {
  return (
    <div className="empty-state">
      <span className="empty-state-icon" aria-hidden="true">
        {symbol}
      </span>
      <p className="mt-4 font-semibold text-pine-950">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">{message}</p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, action }) {
  return (
    <header className="signed-page-hero page-header">
      <span className="page-header-orbit" aria-hidden="true" />
      <div className="page-header-layout">
        <div className="min-w-0 max-w-3xl">
          <p className="page-header-category">{eyebrow}</p>
          <h1>{title}</h1>
          {description && <p className="page-header-description">{description}</p>}
        </div>
        {action && <div className="page-header-action">{action}</div>}
      </div>
    </header>
  );
}

export function ScoreInput({ id, label, value, onChange, lowLabel = 'Low', highLabel = 'High' }) {
  const progress = `${((Number(value) - 1) / 9) * 100}%`;
  return (
    <div className="score-control">
      <div className="flex items-center justify-between gap-4">
        <label className="text-sm font-semibold text-pine-950" htmlFor={id}>
          {label}
        </label>
        <span className="score-control-value" aria-hidden="true">
          {value}<span>/10</span>
        </span>
      </div>
      <input
        id={id}
        className="range-track"
        style={{ '--range-progress': progress }}
        type="range"
        min="1"
        max="10"
        step="1"
        value={value}
        aria-valuetext={`${value} out of 10`}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <div className="flex justify-between text-xs text-slate-500" aria-hidden="true">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  );
}

export function SummaryCard({ Icon, label, value, detail, compact = false }) {
  return (
    <article className="summary-card">
      <div className="flex items-center justify-between gap-3">
        <p className="summary-card-label">{label}</p>
        {Icon && <Icon size={17} className="shrink-0 text-pine-600" aria-hidden="true" />}
      </div>
      <p className={`summary-card-value${compact ? ' is-text' : ''}`}>{value}</p>
      {detail && <p className="summary-card-detail">{detail}</p>}
    </article>
  );
}

export function Notice({ type = 'success', children }) {
  const styles =
    type === 'error'
      ? 'border-red-200 bg-red-50 text-red-800'
      : 'border-pine-200 bg-pine-50 text-pine-800';
  return (
    <div className={`rounded-2xl border px-4 py-3.5 text-sm font-medium shadow-sm ${styles}`} role="status">
      {children}
    </div>
  );
}
