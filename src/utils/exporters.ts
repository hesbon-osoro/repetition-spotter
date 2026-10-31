import { Repetition, RepetitionStats } from '../types';
import { TextStats } from './textStats';

/** Repetition reports as plain text, JSON and CSV. Pure; tested directly. */

export interface Report {
  level: string;
  repetitions: Repetition[];
  stats: RepetitionStats;
  textStats: TextStats;
  generatedAt?: Date;
}

const csvCell = (value: string | number) => {
  const s = String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function reportAsCsv({ repetitions }: Report): string {
  const rows: (string | number)[][] = [
    ['level', 'count', 'text', 'positions'],
    ...repetitions.map(r => [
      r.level,
      r.count,
      r.fullText,
      r.occurrences.map(o => o.start).join(' '),
    ]),
  ];
  return rows.map(row => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
}

export function reportAsJson(report: Report): string {
  const { level, repetitions, stats, textStats } = report;
  return JSON.stringify(
    {
      generatedAt: (report.generatedAt ?? new Date()).toISOString(),
      level,
      stats,
      textStats: {
        ...textStats,
        keywords: textStats.keywords.map(({ word, count, density }) => ({
          word,
          count,
          density,
        })),
        longSentences: textStats.longSentences.length,
      },
      repetitions: repetitions.map(r => ({
        level: r.level,
        count: r.count,
        text: r.fullText,
        occurrences: r.occurrences,
      })),
    },
    null,
    2
  );
}

export function reportAsText(report: Report): string {
  const { level, repetitions, stats, textStats: t } = report;
  const lines = [
    'RepetitionSpotter report',
    `Generated: ${(report.generatedAt ?? new Date()).toISOString()}`,
    '',
    `Words: ${t.words}   Characters: ${t.characters} (${t.charactersNoSpaces} without spaces)`,
    `Sentences: ${t.sentences}   Paragraphs: ${t.paragraphs}`,
    `Reading ease: ${t.readingEase}   Grade level: ${t.gradeLevel}`,
    `Unique words: ${t.uniqueWords} (${t.lexicalDiversity}%)`,
    '',
    `Level: ${level}   Repetitions: ${stats.repetitionCount}   Instances: ${stats.instanceCount}   Efficiency: ${stats.efficiencyScore}%`,
    '',
    ...repetitions.map(
      (r, i) => `${i + 1}. [${r.count}×] ${r.fullText.replace(/\s+/g, ' ')}`
    ),
  ];
  return lines.join('\n') + '\n';
}

/** Save a string as a file in the browser. */
export function download(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
