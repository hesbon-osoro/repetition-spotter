import { useCallback } from 'react';
import { DetectionLevel, AnalysisOptions } from '@/types';
import { analyzeText } from '@/utils/textProcessing';

export const useRepetitionDetection = () => {
  const detectRepetitions = useCallback(
    (text: string, level: DetectionLevel, options: AnalysisOptions) => {
      return analyzeText(text, level, options);
    },
    []
  );

  const findParagraphRepetitions = useCallback(
    (text: string, options: AnalysisOptions) => {
      return analyzeText(text, 'paragraph', options);
    },
    []
  );

  const findSentenceRepetitions = useCallback(
    (text: string, options: AnalysisOptions) => {
      return analyzeText(text, 'sentence', options);
    },
    []
  );

  const findPhraseRepetitions = useCallback(
    (text: string, options: AnalysisOptions) => {
      return analyzeText(text, 'phrase', options);
    },
    []
  );

  const findWordRepetitions = useCallback(
    (text: string, options: AnalysisOptions) => {
      return analyzeText(text, 'word', options);
    },
    []
  );

  return {
    detectRepetitions,
    findParagraphRepetitions,
    findSentenceRepetitions,
    findPhraseRepetitions,
    findWordRepetitions,
  };
};
