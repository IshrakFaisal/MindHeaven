import { HeartPulse } from 'lucide-react';

export default function Brand({ compact = false, light = false }) {
  return (
    <div className="flex items-center gap-3" aria-label="MindHaven">
      <div
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl shadow-sm ${
          light ? 'bg-white text-pine-700 shadow-black/10' : 'bg-gradient-to-br from-pine-500 to-pine-800 text-white shadow-pine-200'
        }`}
        aria-hidden="true"
      >
        <HeartPulse size={19} strokeWidth={2.4} />
      </div>
      {!compact && (
        <div>
          <p className={`text-lg font-bold leading-none tracking-[-0.025em] ${light ? 'text-white' : 'text-pine-950'}`}>
            MindHaven
          </p>
          <p className={`mt-1 hidden text-[0.55rem] font-semibold uppercase tracking-[0.14em] sm:block ${light ? 'text-pine-100' : 'text-pine-700'}`}>Wellbeing, understood</p>
        </div>
      )}
    </div>
  );
}
