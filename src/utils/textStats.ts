import { Occurrence } from '../types';
import { paragraphsOf, sentencesOf, wordsOf } from './textProcessing';

/**
 * Document statistics in the style of word counters and readability tools:
 * counts, timings, Flesch scores, vocabulary and keyword density. Pure, so it
 * can run anywhere and is tested directly.
 */

export interface Keyword {
  word: string;
  count: number;
  /** share of all words, in percent */
  density: number;
  occurrences: Occurrence[];
}

export interface TextStats {
  characters: number;
  charactersNoSpaces: number;
  words: number;
  sentences: number;
  paragraphs: number;
  avgWordLength: number;
  avgSentenceLength: number;
  /** seconds, silent reading */
  readingTime: number;
  /** seconds, reading aloud */
  speakingTime: number;
  syllables: number;
  /** Flesch reading ease, 0 (hard) to 100 (easy) */
  readingEase: number;
  /** Flesch–Kincaid grade level */
  gradeLevel: number;
  uniqueWords: number;
  /** unique words / words, in percent */
  lexicalDiversity: number;
  /** content (non-function) words / words, in percent */
  lexicalDensity: number;
  keywords: Keyword[];
  /** sentences longer than LONG_SENTENCE words */
  longSentences: Occurrence[];
}

export const READING_WPM = 238;
export const SPEAKING_WPM = 150;
export const LONG_SENTENCE = 25;

// Function words: they carry grammar, not content.
export const STOP_WORDS = new Set(
  `a about above after again against all am an and any are as at be because
  been before being below between both but by can could did do does doing down
  during each few for from further had has have having he her here hers herself
  him himself his how i if in into is it its itself just me more most my myself
  no nor not now of off on once only or other our ours ourselves out over own
  same she should so some such than that the their theirs them themselves then
  there these they this those through to too under until up very was we were
  what when where which while who whom why will with would you your yours
  yourself yourselves also may might must shall us let it's i'm don't can't
  won't isn't aren't wasn't weren't doesn't didn't hasn't haven't i've you're
  we're they're that's there's`.split(/\s+/)
);

const round = (n: number, places = 1) => {
  const f = 10 ** places;
  return Math.round(n * f) / f;
};

/** Syllables in an English word, by the usual vowel-group heuristic. */
export function syllablesIn(word: string): number {
  let w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return /\d/.test(word) ? 1 : 0;
  if (w.length <= 3) return 1;
  w = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '');
  const groups = w.match(/[aeiouy]+/g);
  return Math.max(1, groups?.length ?? 1);
}

export function computeTextStats(text: string, keywordLimit = 10): TextStats {
  const wordSpans = wordsOf(text);
  const sentenceSpans = sentencesOf(text);
  const words = wordSpans.map(w => text.slice(w.start, w.end));
  const lower = words.map(w => w.toLowerCase());
  const wordCount = words.length;
  // A trailing newline is Quill's, not the writer's.
  const body = text.replace(/\n$/, '');

  const letters = words.reduce((n, w) => n + w.length, 0);
  const syllables = words.reduce((n, w) => n + syllablesIn(w), 0);
  const sentences = wordCount ? Math.max(1, sentenceSpans.length) : 0;

  const wordsPerSentence = sentences ? wordCount / sentences : 0;
  const syllablesPerWord = wordCount ? syllables / wordCount : 0;
  const readingEase = wordCount
    ? Math.min(
        100,
        Math.max(
          0,
          206.835 - 1.015 * wordsPerSentence - 84.6 * syllablesPerWord
        )
      )
    : 0;
  const gradeLevel = wordCount
    ? Math.max(0, 0.39 * wordsPerSentence + 11.8 * syllablesPerWord - 15.59)
    : 0;

  const counts = new Map<string, Occurrence[]>();
  let contentWords = 0;
  lower.forEach((w, i) => {
    const span = wordSpans[i];
    if (STOP_WORDS.has(w) || /^\d+$/.test(w)) return;
    contentWords++;
    if (w.length < 3 || !span) return;
    const list = counts.get(w);
    if (list) list.push(span);
    else counts.set(w, [span]);
  });

  const keywords: Keyword[] = [...counts.entries()]
    .filter(([, list]) => list.length > 1)
    .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))
    .slice(0, keywordLimit)
    .map(([word, occurrences]) => ({
      word,
      count: occurrences.length,
      density: round((occurrences.length / wordCount) * 100),
      occurrences,
    }));

  const longSentences = sentenceSpans.filter(
    s => wordsOf(text.slice(s.start, s.end)).length > LONG_SENTENCE
  );

  const unique = new Set(lower).size;

  return {
    characters: body.length,
    charactersNoSpaces: body.replace(/\s/g, '').length,
    words: wordCount,
    sentences,
    paragraphs: paragraphsOf(text).length,
    avgWordLength: wordCount ? round(letters / wordCount) : 0,
    avgSentenceLength: round(wordsPerSentence),
    readingTime: Math.round((wordCount / READING_WPM) * 60),
    speakingTime: Math.round((wordCount / SPEAKING_WPM) * 60),
    syllables,
    readingEase: round(readingEase),
    gradeLevel: round(gradeLevel),
    uniqueWords: unique,
    lexicalDiversity: wordCount ? round((unique / wordCount) * 100) : 0,
    lexicalDensity: wordCount ? round((contentWords / wordCount) * 100) : 0,
    keywords,
    longSentences,
  };
}

/** "45 sec", "3 min", "1 h 5 min". */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} sec`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}

/** The usual Flesch bands. */
export function readingEaseLabel(score: number): string {
  if (score >= 90) return 'Very easy';
  if (score >= 80) return 'Easy';
  if (score >= 70) return 'Fairly easy';
  if (score >= 60) return 'Plain English';
  if (score >= 50) return 'Fairly difficult';
  if (score >= 30) return 'Difficult';
  return 'Very difficult';
}
