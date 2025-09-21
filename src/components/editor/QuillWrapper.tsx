// src/components/editor/QuillWrapper.tsx
import { useRef, forwardRef, useImperativeHandle } from 'react';
import dynamic from 'next/dynamic';
import { QuillEditor, QuillRange } from '../../types';

const ReactQuill = dynamic(() => import('react-quill-new'), {
  ssr: false,
}) as React.ComponentType<{
  ref: React.RefObject<QuillEditor>;
  value: string | QuillDelta[];
  onChange: (value: string | QuillDelta[]) => void;
  onSelectionChange?: (range: QuillRange | null) => void;
  placeholder?: string;
  modules: object;
  theme: string;
}>;

interface QuillDelta {
  insert: string;
  attributes?: Record<string, unknown>;
}

interface QuillWrapperProps {
  value: string | QuillDelta[];
  onChange: (value: string | QuillDelta[]) => void;
  onSelectionChange?: (range: QuillRange | null) => void;
  placeholder?: string;
}

export interface QuillWrapperRef {
  getEditor: () => QuillEditor | null;
  getText: (index?: number, length?: number) => string;
}

const QuillWrapper = forwardRef<QuillWrapperRef, QuillWrapperProps>(
  ({ value, onChange, onSelectionChange, placeholder }, ref) => {
    const quillRef = useRef<QuillEditor>(null);

    useImperativeHandle(ref, () => ({
      getEditor: () => quillRef.current || null,
      getText: (index?: number, length?: number) => {
        const editor = quillRef.current;
        if (!editor) return '';
        if (index !== undefined && length !== undefined) {
          return editor.getText(index, length);
        }
        return editor.getText();
      },
    }));

    const modules = {
      toolbar: [
        ['bold', 'italic', 'underline', 'strike'],
        ['blockquote', 'code-block'],
        [{ header: 1 }, { header: 2 }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ script: 'sub' }, { script: 'super' }],
        [{ indent: '-1' }, { indent: '+1' }],
        [{ direction: 'rtl' }],
        [{ size: ['small', false, 'large', 'huge'] }],
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        [{ color: [] }, { background: [] }],
        [{ font: [] }],
        [{ align: [] }],
        ['clean'],
      ],
    };

    return (
      <ReactQuill
        ref={quillRef}
        value={value}
        onChange={onChange}
        modules={modules}
        theme="snow"
        placeholder={placeholder}
        onSelectionChange={onSelectionChange}
      />
    );
  }
);

QuillWrapper.displayName = 'QuillWrapper';

export default QuillWrapper;
