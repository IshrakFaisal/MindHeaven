import { useId } from 'react';

const moodChoices = [
  { value: 2, emoji: '😣', label: 'Rough' },
  { value: 4, emoji: '😕', label: 'Low' },
  { value: 6, emoji: '😐', label: 'Okay' },
  { value: 8, emoji: '🙂', label: 'Good' },
  { value: 10, emoji: '😁', label: 'Great' },
];

export default function MoodSlider({ value, onChange, disabled = false }) {
  const id = useId();
  const mood = moodChoices.find((choice) => value <= choice.value) ?? moodChoices[4];
  const progress = `${((value - 1) / 9) * 100}%`;

  return (
    <div className="mood-selector">
      <div className="mood-selector-preview">
        <div className="flex items-center gap-3">
          <span className="mood-selector-face" aria-hidden="true">
            {mood.emoji}
          </span>
          <div>
            <label htmlFor={id} className="sr-only">Mood score</label>
            <p className="mood-selector-label">{mood.label}</p>
            <p id={`${id}-hint`} className="mood-selector-hint">
              Drag or tap to match your mood.
              <span className="sr-only"> You can also use the arrow keys to adjust the score.</span>
            </p>
          </div>
        </div>
        <span className="mood-selector-score" aria-hidden="true">
          {value}<span>/10</span>
        </span>
      </div>

      <input
        id={id}
        className="mood-range"
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
      <div className="mood-selector-endpoints" aria-hidden="true">
        <span>1 · Rough</span>
        <span>10 · Great</span>
      </div>
    </div>
  );
}
