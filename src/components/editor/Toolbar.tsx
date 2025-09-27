import { AnalysisOptions } from '@/types';
import Button from '../ui/Button';
import SliderControl from './SliderControl';
import { useRef, useState } from 'react';
import { parseFile } from '@/utils/fileParsers';
import { useToast } from '@/context/ToastContext';

interface ToolbarProps {
  onAnalyze: () => void;
  onClearHighlights: () => void;
  onClearText: () => void;
  onUpload: (text: string) => void;
  options: AnalysisOptions;
  updateOption: (
    key: keyof AnalysisOptions,
    value: AnalysisOptions[keyof AnalysisOptions]
  ) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  onAnalyze,
  onClearHighlights,
  onClearText,
  onUpload,
  options,
  updateOption,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { addToast, updateToast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [lastFileName, setLastFileName] = useState<string | null>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange: React.ChangeEventHandler<
    HTMLInputElement
  > = async e => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic support for text-like files in the browser. For docx/pdf we can add libs later.
    const isTextLike =
      file.type.startsWith('text/') ||
      /\.(txt|md|csv|json|pdf|docx|xls|xlsx|doc|rtf|html|htm)$/i.test(
        file.name
      );

    if (!isTextLike) {
      // Fallback attempt: try reading as text anyway (some browsers leave type empty)
    }

    try {
      setIsUploading(true);
      const sizeKB = (file.size / 1024).toFixed(1);
      const toastId = addToast(
        `Parsing ${file.name} (${sizeKB} KB)...`,
        'info',
        true
      );
      const text = await parseFile(file, p => {
        if (p.progress != null) {
          const pct = Math.round(p.progress * 100);
          updateToast(toastId, `${p.phase} ${pct}%`);
        } else {
          updateToast(toastId, p.phase);
        }
      });
      onUpload(text);
      updateToast(toastId, `Parsed ${file.name} successfully`, 'success');
      setLastFileName(file.name);
    } catch (err) {
      console.warn('Failed to read file:', err);
      addToast(
        `Failed to parse file: ${(err as Error)?.message ?? 'Unknown error'}`,
        'error'
      );
    } finally {
      // Reset the input so selecting the same file again will trigger onChange
      if (fileInputRef.current) fileInputRef.current.value = '';
      setIsUploading(false);
    }
  };

  return (
    <div className="p-6 border-b border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">WYSIWYG Editor</h2>
        <div className="flex items-center space-x-4">
          {/* upload document button */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.csv,.json,.pdf,.docx,.doc,.xls,.xlsx,.rtf,.html,.htm,text/plain,text/markdown,text/html,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button variant="primary" size="sm" onClick={handleUploadClick}>
            {isUploading && (
              <svg
                className="animate-spin -ml-0.5 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                ></path>
              </svg>
            )}
            {isUploading ? 'Uploading…' : 'Upload Document'}
          </Button>
          {lastFileName && (
            <span className="text-xs text-gray-600 italic" title={lastFileName}>
              Last uploaded: {lastFileName}
            </span>
          )}
          <Button onClick={onClearHighlights} variant="secondary" size="sm">
            Clear Highlights
          </Button>
          <Button onClick={onClearText} variant="secondary" size="sm">
            Clear Text
          </Button>
          <Button onClick={onAnalyze} variant="primary" size="sm">
            🔍 Analyze
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SliderControl
          label="Minimum Length"
          value={options.minLength}
          min={1}
          max={20}
          onChange={value => updateOption('minLength', value)}
          suffix="words"
        />
        <SliderControl
          label="Similarity Threshold"
          value={options.similarityThreshold}
          min={50}
          max={100}
          onChange={value => updateOption('similarityThreshold', value)}
          suffix="%"
        />
      </div>
    </div>
  );
};

export default Toolbar;
