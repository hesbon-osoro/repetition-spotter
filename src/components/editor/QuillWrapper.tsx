// src/components/editor/QuillWrapper.tsx
import { useRef, forwardRef, useImperativeHandle } from 'react';
import dynamic from 'next/dynamic';
import EditorLoader from '@/components/ui/EditorLoader';
import { QuillEditor, QuillRange } from '../../types';

// Use a loose typing for ReactQuill since its ref is the component which exposes getEditor()
type ReactQuillLikeProps = {
  value: string | QuillDelta[];
  onChange: (value: string | QuillDelta[]) => void;
  modules?: unknown;
  theme?: string;
  placeholder?: string | undefined;
  onChangeSelection?: ((range: QuillRange | null) => void) | undefined;
};

type ReactQuillHandle = { getEditor?: () => QuillEditor };

// next/dynamic does not forward refs, so the ref travels as a normal prop.
const ReactQuill = dynamic(
  async () => {
    const { default: RQ } = await import('react-quill-new');
    const Forwarded = ({
      forwardedRef,
      ...props
    }: ReactQuillLikeProps & {
      forwardedRef: React.Ref<ReactQuillHandle>;
    }) => (
      <RQ
        ref={forwardedRef as React.Ref<never>}
        {...(props as React.ComponentProps<typeof RQ>)}
      />
    );
    return Forwarded;
  },
  { ssr: false, loading: () => <EditorLoader /> }
);

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
    // ReactQuill assigns the component instance to this ref, which has getEditor()
    const reactQuillRef = useRef<{ getEditor?: () => QuillEditor } | null>(
      null
    );

    useImperativeHandle(ref, () => ({
      getEditor: (): QuillEditor | null => {
        const rq = reactQuillRef.current;
        const editor: QuillEditor | null = rq?.getEditor
          ? rq.getEditor()
          : null;
        return editor || null;
      },
      getText: (index?: number, length?: number) => {
        const rq = reactQuillRef.current;
        const editor: QuillEditor | null = rq?.getEditor
          ? rq.getEditor()
          : null;
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
        forwardedRef={reactQuillRef}
        value={value}
        onChange={onChange}
        modules={modules}
        theme="snow"
        placeholder={placeholder}
        // react-quill-new calls this onChangeSelection, not onSelectionChange
        onChangeSelection={onSelectionChange}
      />
    );
  }
);

QuillWrapper.displayName = 'QuillWrapper';

export default QuillWrapper;
