import { Check, Flower2, Pause, Play, RotateCcw, Volume2, VolumeX, Wind } from 'lucide-react';
import { useSpokenGuidance, useWellnessSession } from '../hooks/useWellnessSession';
import { formatSessionTime, getBreathingFrame, getMeditationFrame } from '../lib/wellness';

export default function WellnessPlayer({ kind, practice, durationMs, compactMotion, onNavigate }) {
  const session = useWellnessSession(durationMs);
  const breathing = kind === 'breathing';
  const frame = breathing ? getBreathingFrame(practice, session.elapsedMs) : getMeditationFrame(practice, session.elapsedMs);
  const voice = useSpokenGuidance({ status: session.status, cueKey: frame.key, text: breathing ? frame.label : frame.text });
  const running = session.status === 'running';
  const completed = session.status === 'completed';
  const idle = session.status === 'idle';
  const progress = session.elapsedMs / durationMs * 100;
  const Icon = breathing ? Wind : Flower2;

  return (
    <section className={`card overflow-hidden ${compactMotion ? 'wellness-reduced-motion' : ''}`} aria-label={`${breathing ? 'Breathing' : 'Meditation'} session player`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-pine-100 p-5 sm:px-7">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-pine-100 text-pine-800"><Icon size={20} /></span>
          <div>
            <h2 className="font-semibold text-pine-950">{practice.title}</h2>
            <p className="mt-1 text-xs font-medium text-pine-700">{completed ? 'Complete' : running ? 'In progress' : idle ? 'Ready when you are' : 'Paused - take your time'}</p>
          </div>
        </div>
        <button
          type="button"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-pine-200 bg-white px-3 py-2 text-xs font-bold text-pine-800 transition hover:bg-pine-50 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!voice.available}
          aria-pressed={voice.enabled}
          aria-label="Spoken guidance"
          onClick={voice.toggle}
          title={voice.available ? 'Read prompts using an English voice on this device' : 'No local English voice is available; follow the written guidance'}
        >
          {voice.enabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          Voice {voice.enabled ? 'on' : 'off'}
        </button>
      </div>

      {completed ? (
        <div className="flex min-h-[23rem] flex-col items-center justify-center px-6 py-10 text-center">
          <span className="grid h-20 w-20 place-items-center rounded-full bg-pine-100 text-pine-700"><Check size={34} /></span>
          <div role="status">
            <h3 className="mt-6 text-3xl font-semibold tracking-tight text-pine-950">A moment, just for you.</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">Session complete. Return to your natural rhythm and take your time.</p>
          </div>
          <button type="button" className="secondary-button mt-5" onClick={() => onNavigate('mood')}>Reflect in your journal</button>
        </div>
      ) : breathing ? (
        <div className="wellness-stage relative flex min-h-[23rem] flex-col items-center justify-center overflow-hidden px-5 py-7 text-center">
          <div className="relative grid h-60 w-60 place-items-center sm:h-64 sm:w-64">
            <span className="absolute inset-0 rounded-full border border-pine-300/35" aria-hidden="true" />
            <span className="absolute inset-3 rounded-full border border-pine-300/30" aria-hidden="true" />
            <span className="wellness-orb absolute inset-5 rounded-full" style={{ transform: `scale(${idle ? 0.76 : frame.scale})` }} aria-hidden="true" />
            <div className="relative max-w-[10rem] text-white">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-pine-100">{idle ? 'Your moment' : running ? 'Follow gently' : 'Paused'}</p>
              <p className="mt-2 text-2xl font-semibold" aria-live={voice.enabled ? 'off' : 'polite'} aria-atomic="true">{idle ? 'Let yourself settle' : frame.label}</p>
              <p className="mt-2 text-lg font-semibold tabular-nums text-pine-100" aria-hidden="true">{idle ? 'No breath holds' : `${Math.ceil(frame.remainingMs / 1000)}s`}</p>
            </div>
          </div>
          <p className="mt-5 max-w-md text-sm leading-6 text-pine-900">{idle ? 'Sit comfortably with your feet supported. Let the count guide you, never force you.' : frame.instruction}</p>
        </div>
      ) : (
        <div className="wellness-stage flex min-h-[23rem] flex-col items-center justify-center px-6 py-9 text-center sm:px-12">
          <span className="grid h-16 w-16 place-items-center rounded-[1.6rem] bg-pine-800 text-pine-100 shadow-lg shadow-pine-200/50"><Flower2 size={29} strokeWidth={1.5} /></span>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.17em] text-pine-700">{idle ? 'A guided practice' : `Step ${frame.index + 1} of ${practice.steps.length}`}</p>
          <div aria-live={voice.enabled ? 'off' : 'polite'} aria-atomic="true">
            <h3 className="mt-3 text-3xl font-semibold tracking-tight text-pine-950">{frame.title}</h3>
            <p className="mx-auto mt-4 max-w-lg text-lg leading-8 text-pine-900">{frame.text}</p>
          </div>
          <p className="mt-5 text-xs leading-6 text-pine-700">{idle ? 'Start when you are ready. Written prompts will guide each step.' : 'Quiet between prompts is intentional. Nothing to get right.'}</p>
        </div>
      )}

      <div className="border-t border-pine-100 p-5 sm:p-7">
        <div className="flex items-center justify-between gap-4 text-xs font-semibold text-pine-700">
          <p>{completed ? 'You finished your practice' : `${formatSessionTime(session.elapsedMs, 'down')} elapsed`}</p>
          <p className="tabular-nums"><span role="timer" aria-live="off" aria-label="Time remaining">{formatSessionTime(session.remainingMs)}</span> remaining</p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-pine-100" role="progressbar" aria-label="Session progress" aria-valuemin={0} aria-valuemax={durationMs / 1000} aria-valuenow={Math.floor(session.elapsedMs / 1000)} aria-valuetext={`${formatSessionTime(session.elapsedMs, 'down')} of ${formatSessionTime(durationMs)}`}>
          <div className="h-full rounded-full bg-pine-600 transition-[width] duration-100" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {!completed && (
            <button type="button" onClick={running ? session.pause : session.start} className="primary-button min-w-40 rounded-full">
              {running ? <Pause size={17} /> : <Play size={17} />}
              {running ? 'Pause session' : idle ? 'Start session' : 'Resume session'}
            </button>
          )}
          <button type="button" onClick={session.reset} className="secondary-button rounded-full" disabled={idle}>
            <RotateCcw size={16} /> {completed ? 'Practise again' : 'Reset session'}
          </button>
        </div>
        {voice.error && <p className="mt-4 text-sm text-amber-800" role="status">{voice.error}</p>}
        <p className="mt-4 text-center text-xs leading-6 text-slate-500">
          {voice.available ? 'Optional spoken prompts use a voice on this device.' : 'Written guidance is available. This browser has no local English voice.'}
          <br />Switching browser tabs pauses the timer. Leaving this page ends the practice.
        </p>
      </div>

      {!breathing && (
        <details className="border-t border-pine-100 px-5 py-5 sm:px-7">
          <summary className="cursor-pointer rounded-lg text-sm font-semibold text-pine-800">Read the full session guide</summary>
          <ol className="mt-5 space-y-4">
            {practice.steps.map((step, index) => (
              <li key={step.title} className={`rounded-2xl border p-4 ${index === frame.index && !completed ? 'border-pine-300 bg-pine-50' : 'border-pine-100 bg-white/65'}`} aria-current={!completed && index === frame.index ? 'step' : undefined}>
                <div className="flex justify-between gap-4 text-sm font-bold text-pine-900"><h3>{index + 1}. {step.title}</h3><span className="shrink-0 text-xs text-pine-700">{step.seconds}s</span></div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{step.text}</p>
              </li>
            ))}
          </ol>
        </details>
      )}
    </section>
  );
}
