export const JOURNAL_TEMPLATES = Object.freeze([
  {
    id: 'free',
    label: 'Free reflection',
    description: 'Start with a blank page and write what matters.',
    title: '',
    note: '',
  },
  {
    id: 'difficult-moment',
    label: 'Difficult moment',
    description: 'Separate what happened from what you felt and needed.',
    title: 'A difficult moment',
    note: 'What happened:\n\nWhat I felt:\n\nWhat I needed in that moment:',
  },
  {
    id: 'small-win',
    label: 'Small win',
    description: 'Notice progress that might otherwise pass quietly.',
    title: 'A small win today',
    note: 'What went a little better:\n\nWhat helped:\n\nWhat I want to remember:',
  },
  {
    id: 'gratitude',
    label: 'Gratitude',
    description: 'Capture something meaningful without forcing positivity.',
    title: 'Something I appreciated',
    note: 'What I appreciated:\n\nWhy it mattered to me:\n\nHow I noticed it in my body or mood:',
  },
  {
    id: 'trigger-pattern',
    label: 'Trigger & response',
    description: 'Record the sequence so a pattern can become clearer.',
    title: 'A pattern I noticed',
    note: 'What happened just before:\n\nMy first thought or reaction:\n\nWhat I did next:\n\nWhat might support me next time:',
  },
]);

export const applyJournalTemplate = (templateId, currentForm) => {
  const template = JOURNAL_TEMPLATES.find((item) => item.id === templateId) || JOURNAL_TEMPLATES[0];
  return { ...currentForm, title: template.title, note: template.note };
};

