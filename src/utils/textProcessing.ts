import {
  Repetition,
  RepetitionStats,
  DetectionLevel,
  AnalysisOptions,
  QuillEditor,
  QuillRange,
  MatchInfo,
} from '../types';

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
    case 'paragraphs':
      repetitions = findParagraphsRepetitions(text, options);
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

  const stats = calculateStatistics(text, repetitions);

  return { repetitions, stats };
};

const findParagraphRepetitions = (
  text: string,
  options: AnalysisOptions
): Repetition[] => {
  // Split by multiple newlines, HTML paragraph tags, or other paragraph indicators
  const paragraphs = text
    .split(/\n\s*\n|<\/p>\s*<p[^>]*>|<\/p>\s*<br\s*\/?>\s*<p[^>]*>/i)
    .map(p => p.replace(/<[^>]*>/g, '').trim()) // Remove HTML tags
    .filter(p => p.length > 0);

  const repetitions: Repetition[] = [];
  const seen = new Map<string, number[]>();

  paragraphs.forEach((paragraph, index) => {
    const normalized = normalizeText(paragraph, options);
    if (normalized.length > 50) {
      if (seen.has(normalized)) {
        seen.get(normalized)!.push(index);
      } else {
        seen.set(normalized, [index]);
      }
    }
  });

  // Multi-paragraph combinations
  for (let len = 2; len <= Math.min(5, paragraphs.length); len++) {
    for (let i = 0; i <= paragraphs.length - len; i++) {
      const combination = paragraphs
        .slice(i, i + len)
        .map(p => p.trim())
        .join('\n\n');

      const normalized = normalizeText(combination, options);

      if (normalized.length > 100) {
        const key = `multi_${len}_${normalized}`;
        if (seen.has(key)) {
          seen.get(key)!.push(i);
        } else {
          seen.set(key, [i]);
        }
      }
    }
  }

  seen.forEach((indices, content) => {
    if (indices.length > 1) {
      const isMulti = content.startsWith('multi_');
      const actualContent = isMulti
        ? content.substring(content.indexOf('_', 6) + 1)
        : content;
      const paragraphCount = isMulti ? parseInt(content.split('_')[1]) : 1;

      repetitions.push({
        id: `para-${Date.now()}-${Math.random()}`,
        text:
          actualContent.substring(0, 150) +
          (actualContent.length > 150 ? '...' : ''),
        fullText: actualContent,
        count: indices.length,
        level: 'paragraph',
        paragraphCount,
        indices,
      });
    }
  });

  return repetitions.sort((a, b) => b.count - a.count);
};

const findSentenceRepetitions = (
  text: string,
  options: AnalysisOptions
): Repetition[] => {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  const repetitions: Repetition[] = [];
  const seen = new Map<string, number[]>();

  sentences.forEach((sentence, index) => {
    const normalized = normalizeText(sentence, options);
    if (normalized.length > 20) {
      if (seen.has(normalized)) {
        seen.get(normalized)!.push(index);
      } else {
        seen.set(normalized, [index]);
      }
    }
  });

  seen.forEach((indices, sentence) => {
    if (indices.length > 1) {
      repetitions.push({
        id: `sent-${Date.now()}-${Math.random()}`,
        text: sentence.trim(),
        fullText: sentence.trim(),
        count: indices.length,
        level: 'sentence',
        indices,
      });
    }
  });

  return repetitions.sort((a, b) => b.count - a.count);
};

const findPhraseRepetitions = (
  text: string,
  options: AnalysisOptions
): Repetition[] => {
  const minLength = options.minLength;
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  const repetitions: Repetition[] = [];
  const seen = new Map<string, number[]>();

  for (let len = minLength; len <= Math.min(10, words.length); len++) {
    for (let i = 0; i <= words.length - len; i++) {
      const phrase = words.slice(i, i + len).join(' ');
      if (seen.has(phrase)) {
        seen.get(phrase)!.push(i);
      } else {
        seen.set(phrase, [i]);
      }
    }
  }

  seen.forEach((indices, phrase) => {
    if (indices.length > 1) {
      repetitions.push({
        id: `phrase-${Date.now()}-${Math.random()}`,
        text: phrase,
        fullText: phrase,
        count: indices.length,
        level: 'phrase',
        indices,
      });
    }
  });

  return repetitions.sort((a, b) => b.count - a.count);
};

const findWordRepetitions = (
  text: string,
  options: AnalysisOptions
): Repetition[] => {
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  const wordCount: Record<string, number> = {};
  const repetitions: Repetition[] = [];

  words.forEach(word => {
    if (word.length > 3) {
      wordCount[word] = (wordCount[word] || 0) + 1;
    }
  });

  Object.entries(wordCount).forEach(([word, count]) => {
    if (count > 1) {
      repetitions.push({
        id: `word-${Date.now()}-${Math.random()}`,
        text: word,
        fullText: word,
        count: count,
        level: 'word',
        indices: [],
      });
    }
  });

  return repetitions.sort((a, b) => b.count - a.count);
};

const normalizeText = (text: string, options: AnalysisOptions): string => {
  let normalized = text;

  if (options.ignoreCase) {
    normalized = normalized.toLowerCase();
  }

  if (options.ignorePunctuation) {
    normalized = normalized.replace(/[^\w\s]/g, '');
  }

  return normalized.trim();
};

const calculateStatistics = (
  text: string,
  repetitions: Repetition[]
): RepetitionStats => {
  const words = text.match(/\b\w+\b/g) || [];
  const totalInstances = repetitions.reduce((sum, rep) => sum + rep.count, 0);
  const efficiency = Math.max(
    0,
    100 - (totalInstances / Math.max(1, words.length)) * 100
  );

  return {
    wordCount: words.length,
    repetitionCount: repetitions.length,
    instanceCount: totalInstances,
    efficiencyScore: Math.round(efficiency),
  };
};

// Enhanced paragraph detection that properly handles multiple paragraphs
export const findParagraphsRepetitions = (
  text: string,
  options: AnalysisOptions
): Repetition[] => {
  // Split by multiple newlines, HTML paragraph tags, or other paragraph indicators
  const paragraphs = text
    .split(/\n\s*\n|<\/p>\s*<p[^>]*>|<\/p>\s*<br\s*\/?>\s*<p[^>]*>/i)
    .map(p => p.replace(/<[^>]*>/g, '').trim()) // Remove HTML tags
    .filter(p => p.length > 0);
  const repetitions: Repetition[] = [];
  const seen = new Map<string, { indices: number[]; text: string }>();

  // Process single paragraphs
  paragraphs.forEach((paragraph, index) => {
    const normalized = normalizeText(paragraph, options);
    if (normalized.length > 50) {
      if (seen.has(normalized)) {
        seen.get(normalized)!.indices.push(index);
      } else {
        seen.set(normalized, { indices: [index], text: paragraph });
      }
    }
  });

  // Process multi-paragraph sequences (2-4 paragraphs)
  for (
    let seqLength = 2;
    seqLength <= Math.min(4, paragraphs.length);
    seqLength++
  ) {
    for (let i = 0; i <= paragraphs.length - seqLength; i++) {
      const sequence = paragraphs.slice(i, i + seqLength);
      const sequenceText = sequence.map(p => p.trim()).join('\n\n');
      const normalized = normalizeText(sequenceText, options);

      if (normalized.length > 100) {
        if (seen.has(normalized)) {
          seen.get(normalized)!.indices.push(i);
        } else {
          seen.set(normalized, { indices: [i], text: sequenceText });
        }
      }
    }
  }

  // Convert to repetition objects
  seen.forEach((value, key) => {
    if (value.indices.length > 1) {
      const paragraphCount = key.split('\n\n').length;

      repetitions.push({
        id: `para-${Date.now()}-${Math.random()}`,
        text:
          value.text.substring(0, 150) + (value.text.length > 150 ? '...' : ''),
        fullText: value.text,
        count: value.indices.length,
        level: 'paragraph',
        paragraphCount,
        indices: value.indices,
      });
    }
  });

  return repetitions.sort((a, b) => b.count - a.count);
};

// Function to apply highlights with different colors for each match
export const applyHighlights = (
  quill: QuillEditor | null,
  matches: MatchInfo[],
  selectedText: string,
  selectionRange: QuillRange
) => {
  if (!quill || typeof quill.getLength !== 'function') return;

  try {
    // Clear existing highlights
    const length = quill.getLength();
    if (length > 0) {
      quill.formatText(0, length, 'background', false);
    }

    // Highlight the selection itself
    quill.formatText(
      selectionRange.index,
      selectionRange.length,
      'background',
      '#93c5fd'
    );

    // Highlight each match with a different color
    matches.forEach((match, index) => {
      const color = getColorForMatch(index);
      quill.formatText(match.index, match.text.length, 'background', color);
    });
  } catch (error) {
    console.warn('Error applying highlights:', error);
  }
};

export const clearHighlights = (quill: QuillEditor | null) => {
  if (!quill || typeof quill.getLength !== 'function') return;

  try {
    const length = quill.getLength();
    if (length > 0) {
      quill.formatText(0, length, 'background', false);
      quill.formatText(0, length, 'border', false);
    }
  } catch (error) {
    console.warn('Error clearing highlights:', error);
  }
};

const getColorForMatch = (index: number): string => {
  const colors = [
    'rgba(59, 130, 246, 0.4)', // blue
    'rgba(16, 185, 129, 0.4)', // green
    'rgba(245, 158, 11, 0.4)', // yellow
    'rgba(139, 92, 246, 0.4)', // purple
    'rgba(236, 72, 153, 0.4)', // pink
    'rgba(249, 115, 22, 0.4)', // orange
    'rgba(6, 182, 212, 0.4)', // cyan
  ];
  return colors[index % colors.length];
};

export const scrollToMatch = (
  quill: QuillEditor | null,
  index: number,
  length: number
) => {
  if (!quill || typeof quill.setSelection !== 'function') return;

  try {
    quill.setSelection(index, length);
    quill.focus();

    // Scroll to the match
    const line = quill.getLine(index);
    if (line?.[0]?.domNode) {
      line[0].domNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  } catch (error) {
    console.warn('Error scrolling to match:', error);
  }
};
