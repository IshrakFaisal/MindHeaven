// Original short practices, informed by the NHS self-help resources linked in the UI.
// These are optional wellbeing exercises, not treatment or diagnostic tools.
export const BREATHING_EXERCISES = [
  {
    id: 'easy',
    title: 'An easy rhythm',
    description: 'A shorter count to ease into the practice.',
    phases: [
      { label: 'Breathe in', seconds: 3, direction: 'in', instruction: 'Let your breath arrive gently. No need to fill your lungs.' },
      { label: 'Breathe out', seconds: 3, direction: 'out', instruction: 'Let the breath leave softly, without pushing.' },
    ],
  },
  {
    id: 'steady',
    title: 'Slow & steady',
    description: 'A longer, even count. Choose it only if comfortable.',
    phases: [
      { label: 'Breathe in', seconds: 5, direction: 'in', instruction: 'Follow a gentle breath in, at a comfortable depth.' },
      { label: 'Breathe out', seconds: 5, direction: 'out', instruction: 'Let your breath flow out. Keep your shoulders easy.' },
    ],
  },
];

export const MEDITATION_SESSIONS = [
  {
    id: 'mindful-pause',
    title: 'A mindful pause',
    description: 'A small space between you and a busy day.',
    tag: 'Start here',
    steps: [
      { seconds: 30, title: 'Arrive', text: 'Sit comfortably. Rest your hands. Keep your eyes open or soften your gaze.' },
      { seconds: 30, title: 'Find an anchor', text: 'Notice one natural breath. There is no need to change its rhythm.' },
      { seconds: 30, title: 'Stay curious', text: 'Notice where breathing feels easiest to sense. Stay with that small movement.' },
      { seconds: 30, title: 'Let thoughts pass', text: 'If a thought arrives, acknowledge it. You do not need to follow it.' },
      { seconds: 30, title: 'Begin again', text: 'Return gently to your anchor. Wandering and returning are part of the practice.' },
      { seconds: 30, title: 'Return to your day', text: 'Notice the room again. Take your time before choosing your next step.' },
    ],
  },
  {
    id: 'body-scan',
    title: 'A gentle body scan',
    description: 'Notice physical sensations without trying to fix them.',
    tag: 'Body awareness',
    steps: [
      { seconds: 45, title: 'Feel supported', text: 'Find a supported position. Let the chair or surface hold your weight.' },
      { seconds: 45, title: 'Feet and legs', text: 'Notice contact beneath your feet and legs. Neutral sensations count too.' },
      { seconds: 60, title: 'Hands and arms', text: 'Bring attention to your hands. Notice temperature, pressure, or stillness.' },
      { seconds: 60, title: 'Shoulders and face', text: 'Notice your shoulders and face. You can leave any uncomfortable area alone.' },
      { seconds: 45, title: 'The whole body', text: 'Notice your body as a whole, supported here, breathing naturally.' },
      { seconds: 45, title: 'Reconnect', text: 'Move gently if you wish. Look around and reconnect with your surroundings.' },
    ],
  },
  {
    id: 'open-awareness',
    title: 'Room to be present',
    description: 'A longer practice with generous quiet between prompts.',
    tag: 'Unhurried',
    steps: [
      { seconds: 60, title: 'Settle here', text: 'Choose a comfortable seat. Let your gaze rest on something nearby.' },
      { seconds: 90, title: 'Listen', text: 'Notice nearby and distant sounds, without needing to name each one.' },
      { seconds: 90, title: 'Notice contact', text: 'Feel your hands resting. Let that simple sensation anchor your attention.' },
      { seconds: 90, title: 'Make room', text: 'Notice a thought or feeling. Allow it to be present without judging it.' },
      { seconds: 90, title: 'Return gently', text: 'When attention wanders, return to sounds or contact. Choose what feels comfortable.' },
      { seconds: 60, title: 'Carry the pause', text: 'Notice the room. Choose one small thing to do next, at your own pace.' },
    ],
  },
];

export const meditationDuration = (session) => session.steps.reduce((sum, step) => sum + step.seconds, 0);

export function formatSessionTime(milliseconds, rounding = 'up') {
  const seconds = Math.max(0, (rounding === 'down' ? Math.floor : Math.ceil)(milliseconds / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export function getBreathingFrame(exercise, elapsedMs) {
  const cycleMs = exercise.phases.reduce((sum, phase) => sum + phase.seconds * 1000, 0);
  const elapsed = Math.max(0, elapsedMs);
  let position = elapsed % cycleMs;
  for (let index = 0; index < exercise.phases.length; index += 1) {
    const phase = exercise.phases[index];
    const length = phase.seconds * 1000;
    if (position < length) {
      const progress = position / length;
      return {
        ...phase, index, progress,
        key: `${Math.floor(elapsed / cycleMs)}-${index}`,
        remainingMs: length - position,
        scale: phase.direction === 'in' ? 0.76 + progress * 0.24 : 1 - progress * 0.24,
        cycle: Math.floor(elapsed / cycleMs) + 1,
      };
    }
    position -= length;
  }
}

export function getMeditationFrame(session, elapsedMs) {
  const elapsed = Math.max(0, elapsedMs);
  let startMs = 0;
  for (let index = 0; index < session.steps.length; index += 1) {
    const step = session.steps[index];
    const endMs = startMs + step.seconds * 1000;
    if (elapsed < endMs || index === session.steps.length - 1) {
      return { ...step, index, key: `${session.id}-${index}`, remainingMs: Math.max(0, endMs - elapsed), startMs };
    }
    startMs = endMs;
  }
}

// Read elapsed wall-clock time instead of counting interval ticks: delayed timers
// must not slow a practice down. A supplied clock makes boundaries testable.
export function createSessionClock(durationMs, now = () => performance.now()) {
  if (!Number.isFinite(durationMs) || durationMs <= 0) throw new RangeError('A positive session duration is required.');
  let status = 'idle';
  let accumulated = 0;
  let startedAt = 0;

  const snapshot = () => {
    const elapsedMs = Math.min(durationMs, accumulated + (status === 'running' ? Math.max(0, now() - startedAt) : 0));
    if (elapsedMs >= durationMs) {
      accumulated = durationMs;
      status = 'completed';
    }
    return { status, elapsedMs, durationMs, remainingMs: Math.max(0, durationMs - elapsedMs) };
  };

  return {
    snapshot,
    start() {
      snapshot();
      if (status === 'idle' || status === 'paused') {
        startedAt = now();
        status = 'running';
      }
      return snapshot();
    },
    pause() {
      const current = snapshot();
      if (status === 'running') {
        accumulated = current.elapsedMs;
        status = 'paused';
      }
      return snapshot();
    },
    reset() {
      accumulated = 0;
      status = 'idle';
      return snapshot();
    },
  };
}
