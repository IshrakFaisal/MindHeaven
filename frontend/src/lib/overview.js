import { average, localDateKey, moodLabel } from './format.js';
import { bodySignalLabel } from './bodySignals.js';

export function buildMoodWeek(moods, now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(today);
    day.setDate(day.getDate() - (6 - index));
    const nextDay = new Date(day);
    nextDay.setDate(nextDay.getDate() + 1);
    const entries = moods.filter((entry) => {
      const createdAt = new Date(entry.createdAt);
      return createdAt >= day && createdAt < nextDay;
    });
    return {
      day,
      key: localDateKey(day),
      label: new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(day),
      average: average(entries.map((entry) => entry.moodValue)),
      count: entries.length,
    };
  });
}

export function buildTodayChecklist(data, now = new Date()) {
  const today = localDateKey(now);
  const latestToday = (entries) => entries
    .filter((entry) => localDateKey(new Date(entry.createdAt)) === today)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
  const mood = latestToday(data.moods);
  const sleep = latestToday(data.sleep);
  const symptoms = latestToday(data.symptoms);
  const activeMedications = data.medications.filter((entry) => entry.active !== false);
  const recordedMedications = activeMedications.filter((medication) =>
    data.medicationDoses.some((dose) =>
      dose.date === today &&
      String(dose.medication?._id ?? dose.medication) === String(medication._id),
    ),
  );
  const steps = [
    { id: 'mood', label: 'Mood journal', action: 'Check in with your mood', done: Boolean(mood),
      detail: mood ? `${mood.moodValue}/10 · ${moodLabel(mood.moodValue)}` : 'A score and a few words' },
    { id: 'sleep', label: 'Sleep', action: 'Log your sleep', done: Boolean(sleep),
      detail: sleep ? `${sleep.sleepDuration} hours · Quality ${sleep.sleepQuality ?? 'not rated'}` : 'Reflect on last night’s rest' },
    { id: 'symptoms', label: 'Body signals', action: 'Log body signals', done: Boolean(symptoms),
      detail: symptoms
        ? symptoms.sensations?.length
          ? `${symptoms.sensations.slice(0, 2).map(bodySignalLabel).join(' + ')}${symptoms.emotion ? ` · ${bodySignalLabel(symptoms.emotion)}` : ''}`
          : `Anxiety ${symptoms.anxietyLevel}/10 · Energy ${symptoms.energyLevel}/10`
        : 'Notice a sensation and its context' },
    { id: 'medications', label: 'Medication', action: 'Review medication',
      optional: activeMedications.length === 0,
      done: activeMedications.length > 0 && recordedMedications.length === activeMedications.length,
      detail: activeMedications.length ? `${recordedMedications.length} of ${activeMedications.length} dose decisions recorded` : 'No active schedules' },
  ];
  const activeSteps = steps.filter((step) => !step.optional);
  const completed = activeSteps.filter((step) => step.done).length;
  return {
    steps,
    completed,
    total: activeSteps.length,
    percent: Math.round((completed / activeSteps.length) * 100),
    nextStep: activeSteps.find((step) => !step.done),
  };
}
