export const BODY_AREAS = [
  { id: 'head', label: 'Head' },
  { id: 'jaw', label: 'Jaw' },
  { id: 'shoulders', label: 'Shoulders' },
  { id: 'chest', label: 'Chest' },
  { id: 'stomach', label: 'Stomach' },
  { id: 'limbs', label: 'Arms or legs' },
  { id: 'all-over', label: 'All over' },
];

export const SENSATIONS = [
  { id: 'tight', label: 'Tight', glyph: '()' },
  { id: 'heavy', label: 'Heavy', glyph: '↓' },
  { id: 'fluttery', label: 'Fluttery', glyph: '≈' },
  { id: 'restless', label: 'Restless', glyph: '↝' },
  { id: 'warm', label: 'Warm', glyph: '○' },
  { id: 'tingly', label: 'Tingly', glyph: '··' },
  { id: 'achy', label: 'Achy', glyph: '~' },
  { id: 'numb', label: 'Numb', glyph: '—' },
  { id: 'light', label: 'Light', glyph: '↑' },
  { id: 'steady', label: 'Steady', glyph: '•' },
];

export const EMOTIONS = [
  { id: 'calm', label: 'Calm' },
  { id: 'uneasy', label: 'Uneasy' },
  { id: 'low', label: 'Low' },
  { id: 'irritated', label: 'Irritated' },
  { id: 'overwhelmed', label: 'Overwhelmed' },
  { id: 'energized', label: 'Energized' },
];

export const TRIGGERS = [
  { id: 'work-study', label: 'Work or study' },
  { id: 'people', label: 'People' },
  { id: 'rest', label: 'Rest or sleep' },
  { id: 'food-caffeine', label: 'Food or caffeine' },
  { id: 'movement', label: 'Movement' },
  { id: 'not-sure', label: 'Not sure' },
];

export const INTENSITIES = [
  { id: 'gentle', label: 'Gentle' },
  { id: 'noticeable', label: 'Noticeable' },
  { id: 'strong', label: 'Strong' },
];

const labelMaps = [BODY_AREAS, SENSATIONS, EMOTIONS, TRIGGERS, INTENSITIES]
  .flat()
  .reduce((labels, item) => ({ ...labels, [item.id]: item.label }), {});

export const bodySignalLabel = (value) => labelMaps[value] || value || '';

const topCount = (counts) => [...counts.entries()]
  .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))[0] || null;

export const buildBodySignalPatterns = (entries = []) => {
  const connectedEntries = entries.filter((entry) =>
    Array.isArray(entry.sensations) && entry.sensations.length > 0,
  );
  const sensationTotals = new Map();
  const emotionPairs = new Map();
  const triggerPairs = new Map();
  const areaTotals = new Map();

  connectedEntries.forEach((entry) => {
    entry.sensations.forEach((sensation) => {
      sensationTotals.set(sensation, (sensationTotals.get(sensation) || 0) + 1);
      if (entry.emotion) {
        const key = `${sensation}|${entry.emotion}`;
        emotionPairs.set(key, (emotionPairs.get(key) || 0) + 1);
      }
      if (entry.trigger) {
        const key = `${entry.trigger}|${sensation}`;
        triggerPairs.set(key, (triggerPairs.get(key) || 0) + 1);
      }
    });
    (entry.bodyAreas || []).forEach((area) => {
      areaTotals.set(area, (areaTotals.get(area) || 0) + 1);
    });
  });

  const observations = [];
  const emotionPair = topCount(emotionPairs);
  if (emotionPair?.[1] >= 2) {
    const [sensation, emotion] = emotionPair[0].split('|');
    const total = sensationTotals.get(sensation);
    observations.push({
      id: 'emotion',
      eyebrow: 'Sensation + mood',
      statement: `${bodySignalLabel(sensation)} showed up with ${bodySignalLabel(emotion).toLowerCase()} in ${emotionPair[1]} of ${total} ${bodySignalLabel(sensation).toLowerCase()} logs.`,
    });
  }

  const triggerPair = topCount(triggerPairs);
  if (triggerPair?.[1] >= 2) {
    const [trigger, sensation] = triggerPair[0].split('|');
    observations.push({
      id: 'trigger',
      eyebrow: 'Context + sensation',
      statement: `${bodySignalLabel(sensation)} appeared ${triggerPair[1]} times around ${bodySignalLabel(trigger).toLowerCase()}.`,
    });
  }

  const area = topCount(areaTotals);
  if (area?.[1] >= 2) {
    observations.push({
      id: 'area',
      eyebrow: 'Where you notice it',
      statement: `${bodySignalLabel(area[0])} was the most repeated area, appearing in ${area[1]} check-ins.`,
    });
  }

  return {
    sampleSize: connectedEntries.length,
    minimumSampleSize: 3,
    observations: observations.slice(0, 3),
  };
};
