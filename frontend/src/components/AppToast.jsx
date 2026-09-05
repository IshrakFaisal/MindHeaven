import { CheckCircle2, RotateCcw, X } from 'lucide-react';

export default function AppToast({ toast, onAction, onDismiss }) {
  if (!toast) return null;

  return (
    <div className="fixed bottom-24 right-4 z-[70] w-[min(25rem,calc(100vw-2rem))] overflow-hidden rounded-[1.25rem] border border-white/10 bg-pine-950 p-2 text-white shadow-[0_22px_60px_rgba(3,44,36,0.35)] sm:right-7 lg:bottom-7" role="status">
      <div className="flex items-center gap-3 rounded-2xl bg-white/5 px-3 py-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-pine-700 text-pine-100">
          <CheckCircle2 size={17} />
        </span>
        <p className="min-w-0 flex-1 text-sm font-bold leading-5">{toast.message}</p>
        {toast.actionLabel && toast.onAction && (
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-xl bg-coral-300 px-3 py-2 text-xs font-semibold text-pine-950 transition hover:bg-coral-200"
            onClick={onAction}
          >
            <RotateCcw size={13} /> {toast.actionLabel}
          </button>
        )}
        <button
          type="button"
          onClick={onDismiss}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-pine-100/55 hover:bg-white/10 hover:text-white"
          aria-label="Dismiss notification"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
