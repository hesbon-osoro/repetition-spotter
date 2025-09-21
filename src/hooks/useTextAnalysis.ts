import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Repetition,
  RepetitionStats,
  DetectionLevel,
  AnalysisOptions,
} from '../types';
import {
  analyzeText,
  clearHighlights,
  applyHighlights,
} from '../utils/textProcessing';
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

  // Auto-analyze when content changes (with debounce)
  useEffect(() => {
    const textContent = Array.isArray(content)
      ? content.map(item => item.insert || '').join('')
      : content;

    if (textContent.trim().length > 0) {
      const timer = setTimeout(() => {
        const result = analyzeText(textContent, detectionLevel, options);
        setRepetitions(result.repetitions);
        setStats(result.stats);
      }, 1000); // 1 second debounce

      return () => clearTimeout(timer);
    }
  }, [content, detectionLevel, options]);

  const analyze = useCallback(() => {
    // Convert content to string for analysis
    const textContent = Array.isArray(content)
      ? content.map(item => item.insert || '').join('')
      : content;

    if (!textContent.trim()) return;

    const result = analyzeText(textContent, detectionLevel, options);
    setRepetitions(result.repetitions);
    setStats(result.stats);

    // Apply highlights to the editor
    if (quillRef.current && result.repetitions.length > 0) {
      const editor = quillRef.current.getEditor();
      if (editor) {
        // Clear existing highlights first
        clearHighlights(editor);

        // Apply highlights for each repetition
        result.repetitions.forEach((repetition, index) => {
          if (repetition.indices && repetition.indices.length > 0) {
            const color = getColorForRepetition(index);

            // For each occurrence of this repetition, apply highlighting
            repetition.indices.forEach(occurrenceIndex => {
              // Find the actual text position in the editor
              const textPosition = findTextPositionInEditor(
                editor,
                repetition.text,
                occurrenceIndex
              );
              if (textPosition !== -1) {
                editor.formatText(
                  textPosition,
                  repetition.text.length,
                  'background',
                  color
                );
              }
            });
          }
        });
      }
    }
  }, [content, detectionLevel, options, quillRef]);

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
      const editor = quillRef.current.getEditor();

      // Move caret to the match
      editor.setSelection(index, length, 'user');

      // Find the DOM node for the selection
      const bounds = editor.getBounds(index, length);
      const editorContainer = quillRef.current.container;

      if (bounds && editorContainer) {
        editorContainer.scrollTo({
          top: bounds.top + editorContainer.scrollTop - 50, // add some padding
          behavior: 'smooth',
        });
      }
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

// Helper function to get colors for repetitions
const getColorForRepetition = (index: number): string => {
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

// Helper function to find text position in Quill editor
const findTextPositionInEditor = (
  editor: any,
  searchText: string,
  occurrenceIndex: number
): number => {
  if (!editor || !searchText) return -1;

  const fullText = editor.getText();
  let currentIndex = 0;
  let foundOccurrences = 0;

  while (currentIndex < fullText.length) {
    const index = fullText.indexOf(searchText, currentIndex);
    if (index === -1) break;

    if (foundOccurrences === occurrenceIndex) {
      return index;
    }

    foundOccurrences++;
    currentIndex = index + 1;
  }

  return -1;
};
