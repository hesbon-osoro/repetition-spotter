import {
  AnalysisOptions,
  DetectionLevel,
  MatchInfo,
  QuillRange,
} from '@/types';
import { sentencesOf } from './textProcessing';

/**
 * Selection analysis, as in the legacy tool: every other occurrence of the
 * selected text, plus "semantic" sentences that share most of its words.
 */

export interface SelectionAnalysis {
  selectedText: string;
  range: QuillRange;
  matches: MatchInfo[];
  level: DetectionLevel;
  wordCount: number;
  charCount: number;
  exactMatches: MatchInfo[];
  semanticMatches: MatchInfo[];
}

/** Share of words in common, over the longer text (legacy formula). */
export const calculateSimilarity = (text1: string, text2: string): number => {
  const words1 = text1.toLowerCase().split(/\s+/);
  const words2 = text2.toLowerCase().split(/\s+/);
  const commonWords = words1.filter(word => words2.includes(word));
  return Math.round(
    (commonWords.length / Math.max(words1.length, words2.length)) * 100
  );
};

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const PUNCTUATION = /[^\p{L}\p{N}_\s]/u;

export const getContext = (text: string, index: number, length: number) => {
  const start = Math.max(0, index - 30);
  const end = Math.min(text.length, index + length + 30);
  return (
    (start > 0 ? '...' : '') +
    text.substring(start, end) +
    (end < text.length ? '...' : '')
  );
};

const overlaps = (a: number, b: number, range: QuillRange) =>
  a < range.index + range.length && b > range.index;

export const analyzeSelection = (
  selectedText: string,
  range: QuillRange,
  fullText: string,
  options: Pick<
    AnalysisOptions,
    'ignoreCase' | 'ignorePunctuation' | 'semanticSimilarity'
  >
): SelectionAnalysis => {
  // Search a punctuation-free copy when asked, mapping hits back to the
  // original offsets.
  let needle = selectedText;
  let haystack = fullText;
  let toOriginal: number[] | null = null;
  if (options.ignorePunctuation) {
    needle = needle.replace(new RegExp(PUNCTUATION, 'gu'), '');
    toOriginal = [];
    haystack = '';
    for (let i = 0; i < fullText.length; i++) {
      const ch = fullText.charAt(i);
      if (PUNCTUATION.test(ch)) continue;
      haystack += ch;
      toOriginal.push(i);
    }
    toOriginal.push(fullText.length);
  }

  const exactMatches: MatchInfo[] = [];
  if (needle.trim()) {
    const regex = new RegExp(
      escapeRegExp(needle),
      options.ignoreCase ? 'giu' : 'gu'
    );
    for (const m of haystack.matchAll(regex)) {
      const start = toOriginal ? (toOriginal[m.index] ?? 0) : m.index;
      const end = toOriginal
        ? (toOriginal[m.index + m[0].length - 1] ?? start) + 1
        : m.index + m[0].length;
      if (overlaps(start, end, range)) continue; // the selection itself
      const text = fullText.slice(start, end);
      exactMatches.push({
        index: start,
        text,
        context: getContext(fullText, start, text.length),
        similarity: calculateSimilarity(selectedText, text),
      });
    }
  }

  const semanticMatches =
    options.semanticSimilarity && exactMatches.length < 10
      ? findSemanticMatches(selectedText, fullText, range)
      : [];

  return {
    selectedText,
    range,
    matches: [...exactMatches, ...semanticMatches],
    level: determineSelectionLevel(selectedText),
    wordCount: selectedText.split(/\s+/).length,
    charCount: selectedText.length,
    exactMatches,
    semanticMatches,
  };
};

/**
 * Sentences sharing at least min(3, 60%) of the selection's words, matched
 * loosely (substring either way), as the legacy tool did. At most five.
 */
export const findSemanticMatches = (
  selectedText: string,
  fullText: string,
  range: QuillRange
): MatchInfo[] => {
  const words = selectedText.toLowerCase().split(/\s+/);
  const matches: MatchInfo[] = [];

  for (const s of sentencesOf(fullText)) {
    if (overlaps(s.start, s.end, range)) continue;
    const sentence = fullText.slice(s.start, s.end);
    const sentenceWords = sentence.toLowerCase().split(/\s+/);
    const commonWords = words.filter(
      word =>
        word.length > 3 &&
        sentenceWords.some(sw => sw.includes(word) || word.includes(sw))
    );
    if (commonWords.length >= Math.min(3, words.length * 0.6)) {
      matches.push({
        index: s.start,
        text: sentence,
        context: getContext(fullText, s.start, sentence.length),
        similarity: Math.round((commonWords.length / words.length) * 100),
        isSemantic: true,
      });
      if (matches.length === 5) break;
    }
  }

  return matches;
};

const determineSelectionLevel = (text: string): DetectionLevel => {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  const paragraphs = text.split(/\n+/).filter(p => p.trim().length > 0);
  const words = text.match(/[\p{L}\p{N}_]+/gu) || [];

  if (paragraphs.length > 1) return 'paragraph';
  if (sentences.length >= 1) return 'sentence';
  if (words.length > 5) return 'phrase';
  return 'word';
};
