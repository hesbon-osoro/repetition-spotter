import { useState, useCallback } from 'react';
import { MatchInfo, DetectionLevel, QuillRange } from '@/types';
import { findSemanticMatches } from '@/utils/similarityAlgorithms';

export interface SelectionAnalysis {
  selectedText: string;
  matches: MatchInfo[];
  level: DetectionLevel;
  wordCount: number;
  charCount: number;
  exactMatches: MatchInfo[];
  semanticMatches: MatchInfo[];
}

export const useSelectionAnalysis = () => {
  const [selectionAnalysis, setSelectionAnalysis] =
    useState<SelectionAnalysis | null>(null);

  const analyzeSelection = useCallback(
    (
      selectedText: string,
      range: QuillRange,
      fullText: string,
      options: {
        ignoreCase?: boolean;
        ignorePunctuation?: boolean;
        semanticSimilarity?: boolean;
        similarityThreshold?: number;
      } = {}
    ) => {
      const {
        ignoreCase = true,
        ignorePunctuation = false,
        semanticSimilarity = false,
        similarityThreshold = 60,
      } = options;

      let processedText = selectedText;
      if (ignorePunctuation) {
        processedText = processedText.replace(/[^\w\s]/g, '');
      }
      if (ignoreCase) {
        processedText = processedText.toLowerCase();
      }

      const flags = ignoreCase ? 'gi' : 'g';
      const regex = new RegExp(escapeRegExp(processedText), flags);
      const matches: MatchInfo[] = [];

      let searchText = fullText;
      if (ignorePunctuation) {
        searchText = searchText.replace(/[^\w\s]/g, '');
      }
      if (ignoreCase) {
        searchText = searchText.toLowerCase();
      }

      let match;
      while ((match = regex.exec(searchText)) !== null) {
        const originalIndex = findOriginalIndex(
          fullText,
          match.index,
          ignorePunctuation,
          ignoreCase
        );

        if (originalIndex !== range.index) {
          matches.push({
            index: originalIndex,
            text: match[0],
            context: getContext(fullText, originalIndex, match[0].length),
            similarity: 100,
          });
        }
      }

      let semanticMatches: MatchInfo[] = [];
      if (semanticSimilarity) {
        semanticMatches = findSemanticMatches(
          selectedText,
          fullText,
          range,
          similarityThreshold
        );
      }

      const exactMatches = matches.filter(m => !m.isSemantic);
      const allMatches = [...exactMatches, ...semanticMatches];

      const analysis: SelectionAnalysis = {
        selectedText,
        matches: allMatches,
        level: determineSelectionLevel(selectedText),
        wordCount: selectedText.split(/\s+/).length,
        charCount: selectedText.length,
        exactMatches,
        semanticMatches,
      };

      setSelectionAnalysis(analysis);
      return analysis;
    },
    []
  );

  const clearSelectionAnalysis = useCallback(() => {
    setSelectionAnalysis(null);
  }, []);

  return {
    selectionAnalysis,
    analyzeSelection,
    clearSelectionAnalysis,
  };
};

const escapeRegExp = (string: string): string => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const findOriginalIndex = (
  originalText: string,
  processedIndex: number,
  ignorePunctuation: boolean,
  ignoreCase: boolean
): number => {
  if (!ignorePunctuation && !ignoreCase) return processedIndex;

  let originalIndex = 0;
  let processedCount = 0;

  for (
    let i = 0;
    i < originalText.length && processedCount < processedIndex;
    i++
  ) {
    const char = originalText[i];

    if (ignorePunctuation && /[^\w\s]/.test(char)) {
      continue;
    }

    processedCount++;
    originalIndex = i + 1;
  }

  return originalIndex;
};

const getContext = (text: string, index: number, length: number): string => {
  const start = Math.max(0, index - 30);
  const end = Math.min(text.length, index + length + 30);
  const context = text.substring(start, end);

  return (start > 0 ? '...' : '') + context + (end < text.length ? '...' : '');
};

const determineSelectionLevel = (text: string): DetectionLevel => {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);
  const words = text.match(/\b\w+\b/g) || [];

  if (paragraphs.length > 1) return 'paragraph';
  if (sentences.length >= 1) return 'sentence';
  if (words.length > 5) return 'phrase';
  return 'word';
};
