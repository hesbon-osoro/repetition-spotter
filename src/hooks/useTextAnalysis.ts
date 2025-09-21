import { useState, useCallback, useRef } from 'react';
import {
  Repetition,
  RepetitionStats,
  DetectionLevel,
  AnalysisOptions,
} from '../types';
import { analyzeText, clearHighlights } from '../utils/textProcessing';
import { useSelectionAnalysis } from './useSelectionAnalysis';

const initialStats: RepetitionStats = {
  wordCount: 0,
  repetitionCount: 0,
  instanceCount: 0,
  efficiencyScore: 100,
};

const initialOptions: AnalysisOptions = {
  minLength: 3,
  similarityThreshold: 80,
  ignoreCase: true,
  ignorePunctuation: false,
  semanticSimilarity: false,
};

export const useTextAnalysis = () => {
  const [content, setContent] = useState<string | any[]>('');
  const [repetitions, setRepetitions] = useState<Repetition[]>([]);
  const [stats, setStats] = useState<RepetitionStats>(initialStats);
  const [detectionLevel, setDetectionLevel] =
    useState<DetectionLevel>('paragraph');
  const [options, setOptions] = useState<AnalysisOptions>(initialOptions);
  const quillRef = useRef<any>(null);

  const { analyzeSelection, clearSelectionAnalysis, selectionAnalysis } =
    useSelectionAnalysis();

  const analyze = useCallback(() => {
    // Convert content to string for analysis
    const textContent = Array.isArray(content)
      ? content.map(item => item.insert || '').join('')
      : content;

    if (!textContent.trim()) return;

    const result = analyzeText(textContent, detectionLevel, options);
    setRepetitions(result.repetitions);
    setStats(result.stats);
  }, [content, detectionLevel, options]);

  const updateOption = useCallback((key: keyof AnalysisOptions, value: any) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearHighlightsHandler = useCallback(() => {
    if (quillRef.current) {
      const editor = quillRef.current.getEditor();
      clearHighlights(editor);
    }
    clearSelectionAnalysis();
  }, [clearSelectionAnalysis]);

  const clearText = useCallback(() => {
    setContent('');
    setRepetitions([]);
    setStats(initialStats);
    clearHighlightsHandler();
  }, [clearHighlightsHandler]);

  const handleSelectionAnalysis = useCallback(
    (selectedText: string, range: any) => {
      if (quillRef.current) {
        // Convert content to string for analysis
        const textContent = Array.isArray(content)
          ? content.map(item => item.insert || '').join('')
          : content;
        analyzeSelection(selectedText, range, textContent, options);
      }
    },
    [analyzeSelection, content, options]
  );

  const scrollToMatch = useCallback((index: number, length: number) => {
    if (quillRef.current) {
      // Implementation for scrolling to match
    }
  }, []);

  return {
    content,
    setContent,
    repetitions,
    stats,
    detectionLevel,
    setDetectionLevel,
    options,
    updateOption,
    analyze,
    clearHighlights: clearHighlightsHandler,
    clearText,
    quillRef,
    handleSelectionAnalysis,
    scrollToMatch,
    selectionAnalysis,
  };
};
