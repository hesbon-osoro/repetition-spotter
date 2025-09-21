import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Repetition,
  RepetitionStats,
  DetectionLevel,
  AnalysisOptions,
  QuillEditor,
  QuillRange,
} from '../types';
import { analyzeText, clearHighlights } from '../utils/textProcessing';
import { useSelectionAnalysis } from './useSelectionAnalysis';

interface QuillDelta {
  insert: string;
  attributes?: Record<string, unknown>;
}

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
  const [content, setContent] = useState<string | QuillDelta[]>('');
  const [repetitions, setRepetitions] = useState<Repetition[]>([]);
  const [stats, setStats] = useState<RepetitionStats>(initialStats);
  const [detectionLevel, setDetectionLevel] =
    useState<DetectionLevel>('paragraph');
  const [options, setOptions] = useState<AnalysisOptions>(initialOptions);
  const quillRef = useRef<QuillEditor>(null);

  const { analyzeSelection, clearSelectionAnalysis, selectionAnalysis } =
    useSelectionAnalysis();

  // Auto-analyze when content changes (with debounce)
  useEffect(() => {
    const textContent = extractPlainText(content);

    if (textContent.trim().length > 0) {
      const timer = setTimeout(() => {
        const result = analyzeText(textContent, detectionLevel, options);
        setRepetitions(result.repetitions);
        setStats(result.stats);

        // Apply highlights to the editor after analysis with a small delay
        // to ensure the editor is fully loaded
        setTimeout(() => {
          if (quillRef.current && result.repetitions.length > 0) {
            const editor = quillRef.current.getEditor();
            if (editor) {
              // Clear existing highlights first
              clearHighlights(editor);

              // Apply highlights for each repetition
              result.repetitions.forEach((repetition, index) => {
                if (repetition.text) {
                  const color = getColorForRepetition(index);
                  const fullText = editor.getText();
                  const searchText = repetition.text;

                  // Find and highlight all occurrences
                  let textIndex = 0;
                  while (
                    (textIndex = fullText.indexOf(searchText, textIndex)) !== -1
                  ) {
                    editor.formatText(
                      textIndex,
                      searchText.length,
                      'background',
                      color
                    );
                    textIndex += searchText.length;
                  }
                }
              });
            }
          }
        }, 1000); // Increased delay to ensure editor is ready
      }, 500); // Reduced debounce for faster response

      return () => clearTimeout(timer);
    }
  }, [content, detectionLevel, options, quillRef]);

  const analyze = useCallback(() => {
    // Convert content to string for analysis
    const textContent = extractPlainText(content);

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
          if (repetition.text) {
            const color = getColorForRepetition(index);
            const fullText = editor.getText();
            const searchText = repetition.text;

            // Find and highlight all occurrences
            let textIndex = 0;
            while (
              (textIndex = fullText.indexOf(searchText, textIndex)) !== -1
            ) {
              editor.formatText(
                textIndex,
                searchText.length,
                'background',
                color
              );
              textIndex += searchText.length;
            }
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
    (selectedText: string, range: QuillRange) => {
      if (quillRef.current) {
        // Convert content to string for analysis
        const textContent = extractPlainText(content);
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

// Helper function to extract plain text from Quill content
const extractPlainText = (content: string | QuillDelta[]): string => {
  if (typeof content === 'string') {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map(item => {
        if (typeof item === 'string') {
          return item;
        }
        if (item && typeof item === 'object' && item.insert) {
          // Handle Quill Delta format
          if (typeof item.insert === 'string') {
            return item.insert;
          }
          // Handle embedded objects (images, etc.)
          return '';
        }
        return '';
      })
      .join('')
      .replace(/<[^>]*>/g, '') // Remove any remaining HTML tags
      .replace(/\n\s*\n/g, '\n\n') // Normalize paragraph breaks
      .trim();
  }

  return '';
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
