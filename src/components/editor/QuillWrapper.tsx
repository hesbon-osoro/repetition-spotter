// src/components/editor/QuillWrapper.tsx
import { useRef, forwardRef, useImperativeHandle } from 'react';
import dynamic from 'next/dynamic';

const ReactQuill = dynamic(() => import('react-quill-new'), {
  ssr: false,
}) as React.ComponentType<any>;

interface QuillWrapperProps {
  value: string | any[];
  onChange: (value: string | any[]) => void;
  onSelectionChange?: (range: { index: number; length: number } | null) => void;
  placeholder?: string;
}

export interface QuillWrapperRef {
  getEditor: () => any;
  getText: (index?: number, length?: number) => string;
}

const QuillWrapper = forwardRef<QuillWrapperRef, QuillWrapperProps>(
  ({ value, onChange, onSelectionChange, placeholder }, ref) => {
    const quillRef = useRef<any>(null);

    useImperativeHandle(ref, () => ({
      getEditor: () => quillRef.current?.getEditor?.(),
      getText: (index?: number, length?: number) => {
        const editor = quillRef.current?.getEditor?.();
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
