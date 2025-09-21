// src/components/editor/Editor.tsx
import { useRef, useEffect, useCallback, useState } from 'react';
import QuillWrapper, { QuillWrapperRef } from './QuillWrapper';
import { useSelectionAnalysis } from '../../hooks/useSelectionAnalysis';
import { applyHighlights } from '../../utils/textProcessing';
import EditorLoader from '@/components/ui/EditorLoader';
import { sampleText } from '@/lib/sampleText';
import { QuillRange } from '../../types';

interface QuillDelta {
  insert: string;
  attributes?: Record<string, unknown>;
}

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
        if (item && typeof item === 'object' && 'insert' in item) {
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

interface EditorProps {
  content: string | QuillDelta[];
  onChange: (content: string | QuillDelta[]) => void;
  quillRef?: React.RefObject<QuillWrapperRef>;
}

const Editor: React.FC<EditorProps> = ({
  content,
  onChange,
  quillRef: externalQuillRef,
}) => {
  const internalQuillRef = useRef<QuillWrapperRef>(null);
  const quillRef = externalQuillRef || internalQuillRef;
  const [isLoading, setIsLoading] = useState(true);
  const { analyzeSelection } = useSelectionAnalysis();

  // Load sample text if empty
  useEffect(() => {
    if (!content) {
      const timer = setTimeout(() => {
        onChange(sampleText);
        setIsLoading(false);
      }, 2000); // Reduced from 3000ms to 2000ms

      return () => clearTimeout(timer);
    } else {
      setIsLoading(false);
    }
  }, [content, onChange]);

  const handleSelectionChange = useCallback(
    (range: QuillRange | null) => {
      if (range && range.length > 0 && quillRef.current) {
        try {
          const selectedText = quillRef.current
            .getText(range.index, range.length)
            .trim();
          if (selectedText.length > 0) {
            // Convert content to string for analysis
            const textContent = extractPlainText(content);

            // Analyze selection and get matches
            const analysis = analyzeSelection(selectedText, range, textContent);

            // Apply highlights to similar text
            if (analysis && analysis.matches.length > 0 && quillRef.current) {
              const editor = quillRef.current.getEditor();
              if (editor) {
                applyHighlights(editor, analysis.matches, selectedText, range);
              }
            }
          }
        } catch (error) {
          console.warn('Selection analysis error:', error);
        }
      }
    },
    [analyzeSelection, content, quillRef]
  );

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              WYSIWYG Editor
            </h2>
          </div>
        </div>
        <div className="p-6">
          <EditorLoader message="Loading editor with sample text..." />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            WYSIWYG Editor
          </h2>
          {!content && (
            <button
              onClick={() => onChange(sampleText)}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
            >
              Load Sample Text
            </button>
          )}
        </div>
      </div>

      <div className="p-6">
        <QuillWrapper
          ref={quillRef}
          value={content}
          onChange={onChange}
          placeholder="Paste your text here for VSCode-style repetition analysis..."
          onSelectionChange={handleSelectionChange}
        />
      </div>
    </div>
  );
};

export default Editor;
