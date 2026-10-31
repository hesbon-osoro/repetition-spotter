import {
  Repetition,
  RepetitionStats,
  DetectionLevel,
  AnalysisOptions,
  Occurrence,
} from '../types';

/**
 * Repetition detection, following the legacy tool (public/ref.html) rule for
 * rule, but working on character offsets so every occurrence can be
 * highlighted exactly in the editor.
 *
 * `text` must be the editor's own plain text (Quill's getText()), so offsets
 * line up with editor positions.
 *
 * Deliberate differences from the legacy tool, each covered by a test:
 * - paragraphs are separated by any line break, since Quill writes one "\n" per
 *   paragraph (legacy needed a blank line, so typed paragraphs never matched);
 * - sentences never run across a line break, and a line without final
 *   punctuation (a heading, a list item) still counts as a sentence;
 * - words are Unicode-aware and keep contractions whole ("don't", "naïve");
 * - ignoreCase and ignorePunctuation apply at every level (legacy always
 *   lowercased and never stripped punctuation, which equals the defaults).
 */

interface Unit extends Occurrence {
  key: string;
  index: number;
}

const WORD = /[\p{L}\p{N}_]+(?:['’][\p{L}\p{N}_]+)*/gu;

export const analyzeText = (
  text: string,
  level: DetectionLevel,
  options: AnalysisOptions
): { repetitions: Repetition[]; stats: RepetitionStats } => {
  let repetitions: Repetition[] = [];

  switch (level) {
    case 'paragraph':
      repetitions = findParagraphRepetitions(text, options);
      break;
    case 'sentence':
      repetitions = findSentenceRepetitions(text, options);
      break;
    case 'phrase':
      repetitions = findPhraseRepetitions(text, options);
      break;
    case 'word':
      repetitions = findWordRepetitions(text, options);
      break;
  }

  return { repetitions, stats: calculateStatistics(text, repetitions) };
};

/** Trimmed spans of the parts of `text` matched by `re`. */
const spans = (text: string, re: RegExp): Occurrence[] => {
  const out: Occurrence[] = [];
  for (const m of text.matchAll(re)) {
    const raw = m[0];
    const lead = raw.length - raw.trimStart().length;
    const body = raw.trim();
    if (body)
      out.push({ start: m.index + lead, end: m.index + lead + body.length });
  }
  return out;
};

/** Non-empty lines: Quill writes one per paragraph. */
export const paragraphsOf = (text: string) => spans(text, /[^\n]+/g);

/** Sentences ending in . ! ? or at a line break. */
export const sentencesOf = (text: string) =>
  spans(text, /[^.!?\n]+(?:[.!?]+|(?=\n)|$)/g);

export const wordsOf = (text: string): Occurrence[] =>
  Array.from(text.matchAll(WORD), m => ({
    start: m.index,
    end: m.index + m[0].length,
  }));

const normalizeText = (text: string, options: AnalysisOptions): string => {
  let normalized = text;
  if (options.ignoreCase) normalized = normalized.toLowerCase();
  if (options.ignorePunctuation)
    normalized = normalized.replace(/[^\p{L}\p{N}_\s]/gu, '');
  // Spacing differences never make two passages different.
  return normalized.replace(/\s+/g, ' ').trim();
};

const truncate = (s: string, n: number) =>
  s.length > n ? `${s.substring(0, n)}...` : s;

const occurrencesOf = (group: Unit[]) =>
  group.map(({ start, end }) => ({ start, end }));

/** Group units by key; keep groups seen more than once, most frequent first. */
function collect(
  units: Iterable<Unit>,
  build: (group: Unit[], key: string, first: Unit) => Repetition
): Repetition[] {
  const seen = new Map<string, Unit[]>();
  for (const u of units) {
    const group = seen.get(u.key);
    if (group) group.push(u);
    else seen.set(u.key, [u]);
  }
  const out: Repetition[] = [];
  seen.forEach((group, key) => {
    const [first] = group;
    if (first && group.length > 1) out.push(build(group, key, first));
  });
  // Stable sort keeps first-seen order among equal counts, as legacy did.
  return out.sort((a, b) => b.count - a.count);
}

const findParagraphRepetitions = (
  text: string,
  options: AnalysisOptions
): Repetition[] => {
  const paragraphs = paragraphsOf(text);
  const normalized = paragraphs.map(p =>
    normalizeText(text.slice(p.start, p.end), options)
  );

  function* units(): Generator<Unit> {
    // Single paragraphs
    for (const [i, p] of paragraphs.entries()) {
      const key = normalized[i] ?? '';
      if (key.length > 50) yield { ...p, key, index: i };
    }
    // Runs of 2–5 consecutive paragraphs
    for (let len = 2; len <= Math.min(5, paragraphs.length); len++) {
      for (let i = 0; i <= paragraphs.length - len; i++) {
        const key = normalized.slice(i, i + len).join('\n');
        const from = paragraphs[i];
        const to = paragraphs[i + len - 1];
        if (from && to && key.length > 100)
          yield {
            start: from.start,
            end: to.end,
            key: `multi_${len}_${key}`,
            index: i,
          };
      }
    }
  }

  return collect(units(), (group, key, head) => {
    const first = text.slice(head.start, head.end);
    const multi = /^multi_(\d+)_/.exec(key);
    return {
      id: `paragraph-${head.start}-${key.length}`,
      text: truncate(first, 150),
      fullText: first,
      count: group.length,
      level: 'paragraph',
      paragraphCount: multi ? Number(multi[1]) : 1,
      indices: group.map(u => u.index),
      occurrences: occurrencesOf(group),
    };
  });
};

const findSentenceRepetitions = (
  text: string,
  options: AnalysisOptions
): Repetition[] => {
  function* units(): Generator<Unit> {
    let index = 0;
    for (const s of sentencesOf(text)) {
      const key = normalizeText(text.slice(s.start, s.end), options);
      if (key.length > 20) yield { ...s, key, index };
      index++;
    }
  }

  return collect(units(), (group, _key, head) => {
    const first = text.slice(head.start, head.end);
    return {
      id: `sentence-${head.start}-${head.end}`,
      text: first,
      fullText: first,
      count: group.length,
      level: 'sentence',
      indices: group.map(u => u.index),
      occurrences: occurrencesOf(group),
    };
  });
};

/** Every run of `min`..`max` consecutive words, keyed by its words. */
function* wordRuns(
  text: string,
  words: Occurrence[],
  min: number,
  max: number,
  options: AnalysisOptions,
  minKeyLength = 0
): Generator<Unit> {
  const keys = words.map(w => {
    const word = text.slice(w.start, w.end);
    return options.ignoreCase ? word.toLowerCase() : word;
  });
  // runs[i] is the key of the run starting at word i, grown one word per
  // length instead of re-joined from scratch.
  const first = Math.max(1, min);
  const runs = keys.map((_, i) => keys.slice(i, i + first - 1).join(' '));
  for (let len = first; len <= Math.min(max, words.length); len++) {
    for (let i = 0; i <= words.length - len; i++) {
      const prev = runs[i];
      const next = keys[i + len - 1] ?? '';
      const key = prev ? `${prev} ${next}` : next;
      runs[i] = key;
      const from = words[i];
      const to = words[i + len - 1];
      if (from && to && key.length > minKeyLength)
        yield {
          start: from.start,
          end: to.end,
          key,
          index: i,
        };
    }
  }
}

const findPhraseRepetitions = (
  text: string,
  options: AnalysisOptions
): Repetition[] =>
  collect(
    wordRuns(text, wordsOf(text), options.minLength, 10, options),
    (group, key, head) => ({
      id: `phrase-${head.start}-${key.length}`,
      text: key,
      fullText: text.slice(head.start, head.end),
      count: group.length,
      level: 'phrase',
      indices: group.map(u => u.index),
      occurrences: occurrencesOf(group),
    })
  );

/**
 * Legacy "Words" level: repeated runs of `minLength`..20 words longer than ten
 * characters, plus single words longer than three characters when the minimum
 * length is 1.
 */
const findWordRepetitions = (
  text: string,
  options: AnalysisOptions
): Repetition[] => {
  const words = wordsOf(text);
  const { minLength } = options;

  const singles = (keep: (word: string) => boolean) =>
    function* (): Generator<Unit> {
      for (const [i, w] of words.entries()) {
        const word = text.slice(w.start, w.end);
        if (keep(word))
          yield {
            ...w,
            key: options.ignoreCase ? word.toLowerCase() : word,
            index: i,
          };
      }
    };

  function* units(): Generator<Unit> {
    if (minLength !== 1) {
      yield* wordRuns(text, words, minLength, 20, options, 10);
      return;
    }
    // Legacy listed one-word runs (words over ten characters) first, then
    // longer runs, then the remaining words over three characters; the order
    // matters for groups with equal counts.
    yield* singles(w => w.length > 10)();
    yield* wordRuns(text, words, 2, 20, options, 10);
    yield* singles(w => w.length > 3 && w.length <= 10)();
  }

  return collect(units(), (group, key, head) => {
    return {
      id: `word-${head.start}-${key.length}`,
      text: truncate(key, 100),
      fullText: text.slice(head.start, head.end),
      count: group.length,
      level: 'word',
      indices: group.map(u => u.index),
      occurrences: occurrencesOf(group),
    };
  });
};

const calculateStatistics = (
  text: string,
  repetitions: Repetition[]
): RepetitionStats => {
  const wordCount = wordsOf(text).length;
  const totalInstances = repetitions.reduce((sum, rep) => sum + rep.count, 0);
  const efficiency = Math.max(
    0,
    100 - (totalInstances / Math.max(1, wordCount)) * 100
  );

  return {
    wordCount,
    repetitionCount: repetitions.length,
    instanceCount: totalInstances,
    efficiencyScore: Math.round(efficiency),
  };
};
