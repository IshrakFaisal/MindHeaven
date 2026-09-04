import { useState } from 'react';
import {
  Check,
  Clock3,
  Flower2,
  Headphones,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Timer,
  Wind,
} from 'lucide-react';
import { PageHeader } from '../components/Ui';
import WellnessPlayer from '../components/WellnessPlayer';
import { BREATHING_EXERCISES, MEDITATION_SESSIONS, meditationDuration } from '../lib/wellness';

const PRACTICE_TYPES = [
  {
    id: 'breathing',
    shortLabel: 'Breathing',
    Icon: Wind,
  },
  {
    id: 'meditation',
    shortLabel: 'Meditation',
    Icon: Flower2,
  },
];

export default function WellnessPage({ onNavigate, preferences }) {
  const [kind, setKind] = useState('breathing');
  const [breathingId, setBreathingId] = useState(BREATHING_EXERCISES[0].id);
  const [meditationId, setMeditationId] = useState(MEDITATION_SESSIONS[0].id);
  const [minutes, setMinutes] = useState(3);
  const breathing = kind === 'breathing';
  const practices = breathing ? BREATHING_EXERCISES : MEDITATION_SESSIONS;
  const selectedId = breathing ? breathingId : meditationId;
  const practice = practices.find((item) => item.id === selectedId);
  const durationSeconds = breathing ? minutes * 60 : meditationDuration(practice);
  const durationMs = durationSeconds * 1000;
  const selectedType = PRACTICE_TYPES.find((item) => item.id === kind);
  const selectPractice = (id) => breathing ? setBreathingId(id) : setMeditationId(id);

  return (
    <div className="page-enter app-page wellness-page">
      <PageHeader
        eyebrow="Wellness studio"
        title="Take a pause that meets you where you are."
        description="Choose a short, gentle practice and follow it at your own pace. Nothing here needs to be done perfectly."
        action={<span className="page-header-badge"><Timer size={17} /> {durationSeconds / 60} min selected</span>}
      />

      <section className="wellness-start-card" aria-labelledby="wellness-start-title">
        <div className="wellness-start-copy">
          <span className="wellness-start-icon" aria-hidden="true"><Sparkles size={20} /></span>
          <div>
            <p className="eyebrow">Start with what feels manageable</p>
            <h2 id="wellness-start-title">What kind of pause would help right now?</h2>
          </div>
        </div>
        <div className="wellness-mode-switch" role="group" aria-label="Wellness practice type">
          {PRACTICE_TYPES.map(({ id, shortLabel, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setKind(id)}
              aria-pressed={kind === id}
              className="wellness-mode-button"
            >
              <Icon size={17} aria-hidden="true" />
              {shortLabel}
              {kind === id && <Check size={15} className="wellness-mode-check" aria-hidden="true" />}
            </button>
          ))}
        </div>
      </section>

      <div className="wellness-trust-strip" aria-label="Session information">
        <span><LockKeyhole size={16} aria-hidden="true" /><strong>Private by default</strong><small>Session progress is not stored</small></span>
        <span><Headphones size={16} aria-hidden="true" /><strong>Voice is optional</strong><small>Prompts can stay on screen</small></span>
        <span><ShieldCheck size={16} aria-hidden="true" /><strong>You stay in control</strong><small>Pause or stop at any time</small></span>
      </div>

      <div className="wellness-workspace">
        <aside className="card wellness-library" aria-labelledby="wellness-library-title">
          <div className="wellness-library-heading">
            <span className="wellness-library-icon" aria-hidden="true"><selectedType.Icon size={20} /></span>
            <div>
              <p className="eyebrow">Your session</p>
              <h2 id="wellness-library-title">Choose {breathing ? 'a breathing rhythm' : 'a guided practice'}</h2>
            </div>
          </div>

          <div className="wellness-practice-list" role="group" aria-label={breathing ? 'Breathing exercise' : 'Meditation session'}>
            {practices.map((item) => {
              const selected = item.id === selectedId;
              const itemDuration = breathing ? `${item.phases[0].seconds}s in · ${item.phases[1].seconds}s out` : `${meditationDuration(item) / 60} min`;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => selectPractice(item.id)}
                  className="wellness-practice-card"
                >
                  <span className="wellness-practice-marker" aria-hidden="true">{selected ? <Check size={15} /> : null}</span>
                  <span className="wellness-practice-copy">
                    <span className="wellness-practice-title">{item.title}</span>
                    <span className="wellness-practice-description">{item.description}</span>
                    <span className="wellness-practice-meta"><Clock3 size={12} aria-hidden="true" /> {itemDuration}{!breathing && ` · ${item.tag}`}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {breathing && (
            <fieldset className="wellness-duration-fieldset">
              <legend>Choose a comfortable length</legend>
              <div className="wellness-duration-options">
                {[1, 3, 5].map((value) => (
                  <button key={value} type="button" onClick={() => setMinutes(value)} aria-pressed={minutes === value}>
                    <strong>{value}</strong><span>min</span>
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          <div className="wellness-selected-summary" aria-label="Selected session summary">
            <div>
              <span>Selected practice</span>
              <strong>{practice.title}</strong>
            </div>
            <span className="wellness-selected-duration"><Timer size={14} aria-hidden="true" /> {durationSeconds / 60} min</span>
          </div>

          <div className="wellness-comfort-note">
            <ShieldCheck size={18} aria-hidden="true" />
            <div>
              <p>Your comfort comes first</p>
              <span>Keep your eyes open if you prefer. If you feel dizzy, breathless, or more distressed, stop and breathe normally.</span>
            </div>
          </div>
        </aside>

        <WellnessPlayer
          key={`${kind}-${practice.id}-${durationMs}`}
          kind={kind}
          practice={practice}
          durationMs={durationMs}
          compactMotion={preferences?.compactMotion}
          onNavigate={onNavigate}
        />
      </div>

      <footer className="wellness-disclaimer">
        <div>
          <p className="eyebrow">Use with care</p>
          <h2>A small practice, not a prescription.</h2>
          <p>These general wellbeing tools do not diagnose or treat a condition and are not a replacement for professional care. Practise somewhere safe, never while driving, and remember that stopping is always okay.</p>
        </div>
        <div className="wellness-sources">
          <p>Evidence-informed reading</p>
          <a href="https://www.nhs.uk/mental-health/self-help/guides-tools-and-activities/breathing-exercises-for-stress/" target="_blank" rel="noreferrer">NHS breathing guidance <span aria-hidden="true">↗</span></a>
          <a href="https://www.nhs.uk/mental-health/self-help/tips-and-support/mindfulness/" target="_blank" rel="noreferrer">NHS mindfulness guidance <span aria-hidden="true">↗</span></a>
        </div>
      </footer>
    </div>
  );
}
