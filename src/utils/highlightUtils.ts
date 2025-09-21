import { QuillEditor, QuillRange, MatchInfo } from '../types';

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

export const getColorForLevel = (level: string): string => {
  const colors: Record<string, string> = {
    paragraph: 'rgba(239, 68, 68, 0.2)',
    sentence: 'rgba(245, 158, 11, 0.2)',
    phrase: 'rgba(16, 185, 129, 0.2)',
    word: 'rgba(59, 130, 246, 0.2)',
  };
  return colors[level] || 'rgba(156, 163, 175, 0.2)';
};

export const getColorForMatch = (index: number): string => {
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
