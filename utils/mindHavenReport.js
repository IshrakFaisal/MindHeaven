const { SimplePdfDocument } = require('./simplePdf');

const COLORS = {
  ink: [0.1, 0.17, 0.16],
  muted: [0.36, 0.43, 0.41],
  primary: [0.11, 0.39, 0.33],
  accent: [0.89, 0.54, 0.31],
  pale: [0.93, 0.97, 0.95],
  border: [0.78, 0.85, 0.82],
};

const formatDate = (value) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(value));

const displayValue = (value, suffix = '') =>
  value === null || value === undefined ? 'No data' : `${value}${suffix}`;

const addPageChrome = (page, pageNumber) => {
  page.rectangle(0, 0, 612, 792, { fill: [0.985, 0.988, 0.982] });
  page.rectangle(0, 760, 612, 32, { fill: COLORS.primary });
  page.text('MINDHAVEN', 48, 771, { size: 11, bold: true, color: [1, 1, 1] });
  page.text(`Wellness report  |  Page ${pageNumber}`, 414, 771, {
    size: 8,
    color: [0.91, 0.96, 0.94],
  });
  page.text(
    'For wellness tracking only. This report is not a diagnosis or a substitute for professional care.',
    48,
    24,
    { size: 7.5, color: COLORS.muted },
  );
};

const addMetricCard = (page, x, y, width, label, value) => {
  page.rectangle(x, y, width, 58, { fill: COLORS.pale, stroke: COLORS.border });
  page.text(label.toUpperCase(), x + 14, y + 38, { size: 7.5, bold: true, color: COLORS.muted });
  page.text(value, x + 14, y + 14, { size: 18, bold: true, color: COLORS.primary });
};

const drawTrendChart = (page, analytics) => {
  const chartX = 58;
  const chartY = 275;
  const chartWidth = 496;
  const chartHeight = 138;
  const populated = analytics.series.filter((point) => point.average !== null);

  page.rectangle(chartX, chartY, chartWidth, chartHeight, {
    fill: [1, 1, 1],
    stroke: COLORS.border,
  });

  [1, 4, 7, 10].forEach((score) => {
    const y = chartY + ((score - 1) / 9) * chartHeight;
    page.line(chartX, y, chartX + chartWidth, y, {
      width: 0.35,
      color: [0.88, 0.91, 0.89],
    });
    page.text(String(score), 42, y - 3, { size: 7, color: COLORS.muted });
  });

  if (!populated.length) {
    page.text('No mood entries in this period.', 208, chartY + 64, {
      size: 11,
      color: COLORS.muted,
    });
    return;
  }

  const step = analytics.series.length > 1 ? chartWidth / (analytics.series.length - 1) : 0;
  const points = analytics.series
    .map((point, index) =>
      point.average === null
        ? null
        : {
            x: chartX + index * step,
            y: chartY + ((point.average - 1) / 9) * chartHeight,
          },
    )
    .filter(Boolean);

  page.polyline(points, { width: 2.2, color: COLORS.primary });
  points.forEach((point) => {
    page.rectangle(point.x - 2.5, point.y - 2.5, 5, 5, { fill: COLORS.accent });
  });

  const labelEvery = Math.max(1, Math.ceil(analytics.series.length / 6));
  analytics.series.forEach((point, index) => {
    if (index % labelEvery === 0 || index === analytics.series.length - 1) {
      page.text(point.label, chartX + index * step - 13, chartY - 14, {
        size: 6.5,
        color: COLORS.muted,
      });
    }
  });
};

const buildInsight = (analytics) => {
  if (!analytics.totalEntries) {
    return 'No mood entries were recorded during this reporting period.';
  }

  if (analytics.trend.direction === 'not-enough-data') {
    return 'More than one logging period is needed before a mood direction can be calculated.';
  }

  const directionText = {
    improving: 'improved',
    declining: 'decreased',
    steady: 'remained steady',
  }[analytics.trend.direction];

  const changeText = analytics.trend.change === 0 ? '' : ` by ${Math.abs(analytics.trend.change)} points`;
  return `Recorded mood ${directionText}${changeText} from the first active period to the latest.`;
};

const buildCorrelationText = (correlations) => {
  const ready = correlations?.insights?.find((insight) => insight.status === 'ready');
  if (ready) return `${ready.statement} Based on ${ready.sampleSize} paired days.`;
  return 'More paired mood, sleep, and symptom check-ins are needed before a personal correlation can be shown.';
};

const buildMindHavenReport = (data) => {
  const document = new SimplePdfDocument();
  const overview = document.addPage();
  addPageChrome(overview, 1);

  overview.text('Mood & wellness report', 48, 720, {
    size: 23,
    bold: true,
    color: COLORS.ink,
  });
  overview.text(data.analytics.rangeLabel, 48, 697, { size: 10, color: COLORS.primary, bold: true });
  overview.text(`Prepared for ${data.user.name}`, 48, 673, { size: 10, color: COLORS.ink });
  overview.text(data.user.email, 48, 657, { size: 9, color: COLORS.muted });
  overview.text(`Generated ${formatDate(data.generatedAt)}`, 390, 673, {
    size: 9,
    color: COLORS.muted,
  });
  overview.text(
    `${formatDate(data.analytics.startDate)} - ${formatDate(data.analytics.endDate)}`,
    390,
    657,
    { size: 9, color: COLORS.muted },
  );

  addMetricCard(overview, 48, 567, 120, 'Mood entries', String(data.analytics.totalEntries));
  addMetricCard(
    overview,
    180,
    567,
    120,
    'Average mood',
    displayValue(data.analytics.averageMood, '/10'),
  );
  addMetricCard(
    overview,
    312,
    567,
    120,
    'Average sleep',
    displayValue(data.averages.sleepDuration, 'h'),
  );
  addMetricCard(overview, 444, 567, 120, 'Symptom logs', String(data.symptomLogs.length));

  overview.text('Mood trend', 48, 526, { size: 14, bold: true, color: COLORS.ink });
  overview.text('Scores are shown on a 1-10 scale.', 48, 509, { size: 8.5, color: COLORS.muted });
  drawTrendChart(overview, data.analytics);

  overview.text('Period insight', 48, 224, { size: 13, bold: true, color: COLORS.ink });
  overview.rectangle(48, 140, 516, 68, { fill: [0.98, 0.95, 0.91] });
  overview.wrappedText(buildInsight(data.analytics), 62, 190, 84, {
    size: 9.5,
    lineHeight: 13,
    color: COLORS.ink,
  });
  overview.wrappedText(buildCorrelationText(data.correlations), 62, 158, 84, {
    size: 8,
    lineHeight: 11,
    color: COLORS.muted,
  });
  overview.text('Wellness context', 48, 116, { size: 13, bold: true, color: COLORS.ink });
  overview.wrappedText(
    `Average sleep quality: ${displayValue(data.averages.sleepQuality, '/10')}  |  Average anxiety: ${displayValue(data.averages.anxietyLevel, '/10')}  |  Average energy: ${displayValue(data.averages.energyLevel, '/10')}`,
    48,
    94,
    92,
    { size: 9, color: COLORS.muted, lineHeight: 13 },
  );

  const details = document.addPage();
  addPageChrome(details, 2);
  details.text('Detailed records', 48, 720, { size: 23, bold: true, color: COLORS.ink });
  details.text('Latest mood entries in the selected period', 48, 693, {
    size: 10,
    color: COLORS.muted,
  });

  const columns = [48, 135, 198, 254];
  details.rectangle(48, 650, 516, 25, { fill: COLORS.primary });
  ['DATE', 'SCORE', 'TYPE', 'NOTE'].forEach((heading, index) => {
    details.text(heading, columns[index] + 7, 659, { size: 7.5, bold: true, color: [1, 1, 1] });
  });

  const recentMoods = data.moods.slice(0, 12);
  if (!recentMoods.length) {
    details.text('No mood entries recorded for this period.', 56, 625, {
      size: 9,
      color: COLORS.muted,
    });
  } else {
    recentMoods.forEach((mood, index) => {
      const y = 625 - index * 27;
      if (index % 2 === 0) {
        details.rectangle(48, y - 8, 516, 25, { fill: [0.96, 0.98, 0.97] });
      }
      details.text(formatDate(mood.createdAt), columns[0] + 7, y, { size: 8, color: COLORS.ink });
      details.text(`${mood.moodValue}/10`, columns[1] + 7, y, { size: 8, color: COLORS.ink });
      details.text(mood.moodType || 'numeric', columns[2] + 7, y, { size: 8, color: COLORS.ink });
      const note = mood.note ? String(mood.note).slice(0, 52) : '-';
      details.text(note, columns[3] + 7, y, { size: 8, color: COLORS.ink });
    });
  }

  const sectionY = 286;
  details.text('Symptoms and sleep', 48, sectionY, { size: 13, bold: true, color: COLORS.ink });
  details.rectangle(48, sectionY - 79, 248, 62, { fill: COLORS.pale, stroke: COLORS.border });
  details.text(`Anxiety average: ${displayValue(data.averages.anxietyLevel, '/10')}`, 62, sectionY - 39, {
    size: 9,
    color: COLORS.ink,
  });
  details.text(`Energy average: ${displayValue(data.averages.energyLevel, '/10')}`, 62, sectionY - 58, {
    size: 9,
    color: COLORS.ink,
  });
  details.rectangle(308, sectionY - 79, 256, 62, { fill: COLORS.pale, stroke: COLORS.border });
  details.text(`Sleep duration: ${displayValue(data.averages.sleepDuration, ' hours')}`, 322, sectionY - 39, {
    size: 9,
    color: COLORS.ink,
  });
  details.text(`Sleep quality: ${displayValue(data.averages.sleepQuality, '/10')}`, 322, sectionY - 58, {
    size: 9,
    color: COLORS.ink,
  });

  details.text('Medication list', 48, 177, { size: 13, bold: true, color: COLORS.ink });
  const medicationSummary = data.medications.length
    ? data.medications
        .slice(0, 5)
        .map((medication) =>
          [medication.medicationName, medication.dosage, medication.schedule]
            .filter(Boolean)
            .join(' - '),
        )
        .join('  |  ')
        .slice(0, 260)
    : 'No medications recorded.';
  details.wrappedText(medicationSummary, 48, 153, 92, {
    size: 9,
    lineHeight: 14,
    color: COLORS.muted,
  });

  details.text('Discussion prompt', 48, 95, { size: 12, bold: true, color: COLORS.ink });
  details.wrappedText(
    'Consider reviewing meaningful changes, recurring triggers, sleep patterns, and any medication concerns with a qualified healthcare professional.',
    48,
    75,
    96,
    { size: 8.5, lineHeight: 12, color: COLORS.muted },
  );

  return document.toBuffer();
};

module.exports = { buildMindHavenReport };
