import { MatchInfo, QuillRange } from '@/types';

export const calculateSimilarity = (text1: string, text2: string): number => {
  const words1 = text1
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 3);
  const words2 = text2
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 3);

  if (words1.length === 0 || words2.length === 0) return 0;

  const commonWords = words1.filter(word => words2.includes(word));
  const similarity =
    (commonWords.length / Math.max(words1.length, words2.length)) * 100;

  return Math.round(similarity);
};

export const findSemanticMatches = (
  selectedText: string,
  fullText: string,
  range: QuillRange,
  similarityThreshold: number = 60
): MatchInfo[] => {
  const matches: MatchInfo[] = [];
  const sentences = fullText.match(/[^.!?]+[.!?]+/g) || [];
  const selectedWords = selectedText
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 3);

  if (selectedWords.length === 0) return matches;

  sentences.forEach(sentence => {
    const sentenceStart = fullText.indexOf(sentence);
    if (
      sentenceStart === -1 ||
      (sentenceStart >= range.index &&
        sentenceStart < range.index + range.length)
    ) {
      return; // Skip the selection itself
    }

    const sentenceWords = sentence.toLowerCase().split(/\s+/);
    const commonWords = selectedWords.filter(word =>
      sentenceWords.some(sw => sw.includes(word) || word.includes(sw))
    );

    if (commonWords.length >= Math.min(3, selectedWords.length * 0.6)) {
      const similarity = (commonWords.length / selectedWords.length) * 100;

      if (similarity >= similarityThreshold) {
        matches.push({
          index: sentenceStart,
          text: sentence.trim(),
          context: getContext(fullText, sentenceStart, sentence.length),
          similarity: Math.round(similarity),
          isSemantic: true,
        });
      }
    }
  });

  return matches.slice(0, 5); // Limit to top 5 matches
};

export const jaccardSimilarity = (text1: string, text2: string): number => {
  const set1 = new Set(
    text1
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2)
  );
  const set2 = new Set(
    text2
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2)
  );

  if (set1.size === 0 || set2.size === 0) return 0;

  const intersection = new Set([...set1].filter(word => set2.has(word)));
  const union = new Set([...set1, ...set2]);

  return (intersection.size / union.size) * 100;
};

const getContext = (text: string, index: number, length: number): string => {
  const start = Math.max(0, index - 30);
  const end = Math.min(text.length, index + length + 30);
  const context = text.substring(start, end);

  return (start > 0 ? '...' : '') + context + (end < text.length ? '...' : '');
};
