import { useId } from 'react';
import { moodColor } from '../lib/format';

const moodChoices = [
  { value: 2, emoji: '😣', label: 'Rough' },
  { value: 4, emoji: '😕', label: 'Low' },
  { value: 6, emoji: '😐', label: 'Okay' },
  { value: 8, emoji: '🙂', label: 'Good' },
  { value: 10, emoji: '😁', label: 'Great' },
];

function SliderInput({ id, value, onChange, disabled, mood, className = '' }) {
  const progress = `${((value - 1) / 9) * 100}%`;
  return (
    <>
      <input
        id={id}
        className={`mood-range ${className}`}
        type="range"
        min="1"
        max="10"
        step="1"
        value={value}
        disabled={disabled}
        aria-valuetext={`${value} out of 10 — ${mood.label}`}
        aria-describedby={`${id}-hint`}
        style={{ '--range-progress': progress }}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <div className="mood-selector-ticks" aria-hidden="true">
        {Array.from({ length: 10 }, (_, index) => <span key={index} className={index + 1 <= value ? 'is-filled' : ''} />)}
      </div>
      <div className="mood-selector-endpoints" aria-hidden="true"><span>1 · Rough</span><span>10 · Great</span></div>
    </>
  );
}

export default function MoodSlider({ value, onChange, disabled = false, mode = 'hybrid' }) {
  const id = useId();
  const mood = moodChoices.find((choice) => value <= choice.value) ?? moodChoices[4];

  if (mode === 'emoji') {
    return (
      <div className="mood-selector mood-selector-emoji">
        <div className="mood-mode-heading">
          <div><p className="mood-mode-kicker">Emoji scale</p><h3>{mood.emoji} {mood.label}</h3><p id={`${id}-hint`}>Choose the expression that feels closest.</p></div>
          <span className="mood-mode-current">{value}<small>/10</small></span>
        </div>
        <div className="mood-emoji-options" role="group" aria-label="Choose mood by emoji" aria-describedby={`${id}-hint`}>
          {moodChoices.map((choice) => {
            const selected = mood.value === choice.value;
            return (
              <button key={choice.value} type="button" aria-pressed={selected} disabled={disabled} onClick={() => onChange(choice.value)}>
                <span aria-hidden="true">{choice.emoji}</span><strong>{choice.label}</strong><small>{choice.value}/10</small>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (mode === 'color') {
    return (
      <div className="mood-selector mood-selector-color">
        <div className="mood-mode-heading">
          <div><p className="mood-mode-kicker">Color scale</p><h3>{mood.label}</h3><p id={`${id}-hint`}>Choose the color tone that matches this moment.</p></div>
          <span className="mood-color-current" style={{ backgroundColor: moodColor(value) }}><b>{value}</b><small>/10</small></span>
        </div>
        <div className="mood-color-options" role="group" aria-label="Choose mood by color" aria-describedby={`${id}-hint`}>
          {Array.from({ length: 10 }, (_, index) => index + 1).map((score) => (
            <button
              key={score}
              type="button"
              aria-pressed={value === score}
              aria-label={`${score} out of 10`}
              disabled={disabled}
              onClick={() => onChange(score)}
              style={{ backgroundColor: moodColor(score) }}
            >
              <span>{score}</span>
            </button>
          ))}
        </div>
        <div className="mood-color-endpoints" aria-hidden="true"><span>Rough</span><span>Great</span></div>
      </div>
    );
  }

  return (
    <div className={`mood-selector ${mode === 'numeric' ? 'mood-selector-numeric' : 'mood-selector-hybrid'}`}>
      <div className="mood-selector-preview">
        <div className="flex items-center gap-3">
          <span className={mode === 'numeric' ? 'mood-numeric-emblem' : 'mood-selector-face'} aria-hidden="true">{mode === 'numeric' ? value : mood.emoji}</span>
          <div>
            <label htmlFor={id} className="sr-only">Mood score</label>
            <p className="mood-selector-label">{mood.label}</p>
            <p id={`${id}-hint`} className="mood-selector-hint">{mode === 'numeric' ? 'Drag or tap for a precise score.' : 'Drag or tap to match your mood.'}<span className="sr-only"> You can also use the arrow keys to adjust it.</span></p>
          </div>
        </div>
        <span className="mood-selector-score" aria-hidden="true">{value}<span>/10</span></span>
      </div>
      <SliderInput id={id} value={value} onChange={onChange} disabled={disabled} mood={mood} />
    </div>
  );
}
