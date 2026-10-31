// src/components/editor/Editor.tsx
import QuillWrapper, { QuillWrapperRef } from './QuillWrapper';
import EditorLoader from '@/components/ui/EditorLoader';
import type { QuillDelta } from '@/hooks/useTextAnalysis';
import { FONTS, usePreferences } from '@/hooks/usePreferences';
import { QuillRange } from '../../types';

interface EditorProps {
  content: string | QuillDelta[];
  onChange: (content: string | QuillDelta[]) => void;
  quillRef: React.RefObject<QuillWrapperRef | null>;
  onSelectionChange?: (range: QuillRange | null) => void;
  /** False until the saved draft or the sample text is in place. */
  ready: boolean;
  focus?: boolean;
}

const Editor: React.FC<EditorProps> = ({
  content,
  onChange,
  quillRef,
  onSelectionChange,
  ready,
  focus = false,
}) => {
  const { prefs } = usePreferences();

  if (!ready) return <EditorLoader message="Opening your draft..." />;

  return (
    <div
      className={`editor-shell ${focus ? 'is-focus' : ''}`}
      style={
        {
          '--editor-font': FONTS[prefs.font].stack,
          '--editor-size': `${prefs.size}px`,
          '--editor-leading': prefs.leading,
        } as React.CSSProperties
      }
    >
      <QuillWrapper
        ref={quillRef}
        value={content}
        onChange={onChange}
        placeholder="Paste or type your text, or upload a document, to find repetitions..."
        onSelectionChange={onSelectionChange}
      />
    </div>
  );
};

export default Editor;
