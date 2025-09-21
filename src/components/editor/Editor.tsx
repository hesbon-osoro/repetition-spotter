// src/components/editor/Editor.tsx
import { useRef, useEffect, useCallback, useState } from 'react';
import QuillWrapper, { QuillWrapperRef } from './QuillWrapper';
import { useSelectionAnalysis } from '../../hooks/useSelectionAnalysis';
import { applyHighlights } from '../../utils/textProcessing';
import EditorLoader from '@/components/ui/EditorLoader';
import { sampleText } from '@/lib/sampleText';

interface EditorProps {
  content: string | any[];
  onChange: (content: string | any[]) => void;
  quillRef?: React.RefObject<any>;
}

const Editor: React.FC<EditorProps> = ({ content, onChange, quillRef: externalQuillRef }) => {
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
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      setIsLoading(false);
    }
  }, [content, onChange]);

  const handleSelectionChange = useCallback(
    (range: any) => {
      if (range && range.length > 0 && quillRef.current) {
        try {
          const selectedText = quillRef.current
            .getText(range.index, range.length)
            .trim();
          if (selectedText.length > 0) {
            // Convert content to string for analysis
            const textContent = Array.isArray(content)
              ? content.map(item => item.insert || '').join('')
              : content;
            
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
    [analyzeSelection, content]
  );

  if (isLoading) {
    return <EditorLoader message="Loading editor with sample text..." />;
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
