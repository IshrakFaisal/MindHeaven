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
  const progress = Math.min(100, session.elapsedMs / durationMs * 100);
  const Icon = breathing ? Wind : Flower2;
  const statusLabel = completed ? 'Complete' : running ? 'In progress' : idle ? 'Ready to begin' : 'Paused';

  return (
    <section className={`card wellness-player overflow-hidden ${compactMotion ? 'wellness-reduced-motion' : ''}`} aria-label={`${breathing ? 'Breathing' : 'Meditation'} session player`}>
      <div className="wellness-player-header">
        <div className="wellness-player-identity">
          <span className="wellness-player-icon"><Icon size={20} aria-hidden="true" /></span>
          <div>
            <p className="wellness-player-kicker">{breathing ? 'Breathing practice' : 'Guided meditation'}</p>
            <h2>{practice.title}</h2>
          </div>
        </div>
        <div className="wellness-player-actions">
          <span className="wellness-status-pill" data-status={session.status}><span aria-hidden="true" />{statusLabel}</span>
          <button
            type="button"
            className="wellness-voice-button"
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
      </div>

      {completed ? (
        <div className="wellness-complete-state">
          <span className="wellness-complete-icon"><Check size={34} aria-hidden="true" /></span>
          <div role="status">
            <p className="eyebrow">Practice complete</p>
            <h3>A moment, just for you.</h3>
            <p>Return to your natural rhythm. Notice how you feel without needing to change anything.</p>
          </div>
          <button type="button" className="primary-button" onClick={() => onNavigate('mood')}>Reflect in your journal</button>
        </div>
      ) : breathing ? (
        <div className="wellness-stage wellness-breathing-stage">
          <div className="wellness-stage-meta"><span>Comfortable pace</span><span>No breath holds</span></div>
          <div className="wellness-orb-wrap">
            <span className="wellness-orb-ring wellness-orb-ring-outer" aria-hidden="true" />
            <span className="wellness-orb-ring wellness-orb-ring-inner" aria-hidden="true" />
            <span className="wellness-orb" style={{ transform: `scale(${idle ? 0.76 : frame.scale})` }} aria-hidden="true" />
            <div className="wellness-orb-content">
              <p>{idle ? 'Your moment' : running ? 'Follow gently' : 'Paused'}</p>
              <h3 aria-live={voice.enabled ? 'off' : 'polite'} aria-atomic="true">{idle ? 'Let yourself settle' : frame.label}</h3>
              <span aria-hidden="true">{idle ? 'Begin when ready' : `${Math.ceil(frame.remainingMs / 1000)} seconds`}</span>
            </div>
          </div>
          <p className="wellness-stage-instruction">{idle ? 'Sit comfortably with your feet supported. Let the count guide you, never force you.' : frame.instruction}</p>
        </div>
      ) : (
        <div className="wellness-stage wellness-meditation-stage">
          <div className="wellness-step-track" aria-label={`Step ${idle ? 1 : frame.index + 1} of ${practice.steps.length}`}>
            {practice.steps.map((step, index) => (
              <span key={step.title} className={index <= (idle ? 0 : frame.index) ? 'is-current' : ''} aria-hidden="true" />
            ))}
          </div>
          <span className="wellness-meditation-icon"><Flower2 size={29} strokeWidth={1.5} aria-hidden="true" /></span>
          <p className="wellness-step-label">{idle ? 'A guided practice' : `Step ${frame.index + 1} of ${practice.steps.length}`}</p>
          <div aria-live={voice.enabled ? 'off' : 'polite'} aria-atomic="true">
            <h3>{frame.title}</h3>
            <p className="wellness-meditation-copy">{frame.text}</p>
          </div>
          <p className="wellness-stage-note">{idle ? 'Start when you are ready. Written prompts will guide each step.' : 'Quiet between prompts is intentional. Nothing to get right.'}</p>
        </div>
      )}

      <div className="wellness-controls">
        <div className="wellness-progress-copy">
          <div><strong>{completed ? 'Practice complete' : running ? 'Stay with this moment' : idle ? 'Ready when you are' : 'Take all the time you need'}</strong><span>{Math.round(progress)}% complete</span></div>
          <p className="tabular-nums"><span role="timer" aria-live="off" aria-label="Time remaining">{formatSessionTime(session.remainingMs)}</span> remaining</p>
        </div>
        <div className="wellness-progress-track" role="progressbar" aria-label="Session progress" aria-valuemin={0} aria-valuemax={durationMs / 1000} aria-valuenow={Math.floor(session.elapsedMs / 1000)} aria-valuetext={`${formatSessionTime(session.elapsedMs, 'down')} of ${formatSessionTime(durationMs)}`}>
          <div style={{ width: `${progress}%` }} />
        </div>
        <div className="wellness-control-buttons">
          {!completed && (
            <button type="button" onClick={running ? session.pause : session.start} className="primary-button">
              {running ? <Pause size={17} /> : <Play size={17} />}
              {running ? 'Pause session' : idle ? 'Start session' : 'Resume session'}
            </button>
          )}
          <button type="button" onClick={session.reset} className="secondary-button" disabled={idle}>
            <RotateCcw size={16} /> {completed ? 'Practise again' : 'Reset session'}
          </button>
        </div>
        {voice.error && <p className="mt-4 text-sm text-amber-800" role="status">{voice.error}</p>}
        <p className="wellness-session-note">
          {voice.available ? 'Optional spoken prompts use a voice on this device.' : 'Written guidance is available. This browser has no local English voice.'}
          <span>Switching tabs pauses the timer. Leaving this page ends the practice.</span>
        </p>
      </div>

      {!breathing && (
        <details className="wellness-full-guide">
          <summary>Preview the full session guide <span>{practice.steps.length} steps</span></summary>
          <ol>
            {practice.steps.map((step, index) => (
              <li key={step.title} className={index === frame.index && !completed ? 'is-current' : ''} aria-current={!completed && index === frame.index ? 'step' : undefined}>
                <span className="wellness-guide-number">{index + 1}</span>
                <div><h3>{step.title}</h3><p>{step.text}</p></div>
                <span className="wellness-guide-time">{step.seconds}s</span>
              </li>
            ))}
          </ol>
        </details>
      )}
    </section>
  );
}
