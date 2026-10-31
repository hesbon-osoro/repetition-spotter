import { AnalysisOptions } from '@/types';
import Button from '../ui/Button';
import SliderControl from './SliderControl';
import { useRef, useState } from 'react';
import { parseFile } from '@/utils/fileParsers';
import { useToast } from '@/context/ToastContext';
import {
  download,
  reportAsCsv,
  reportAsJson,
  reportAsText,
  type Report,
} from '@/utils/exporters';
import {
  FONTS,
  LEADINGS,
  SIZES,
  usePreferences,
  type EditorFont,
} from '@/hooks/usePreferences';
import {
  CopyIcon,
  DownloadIcon,
  EraserIcon,
  MaximizeIcon,
  MinimizeIcon,
  SearchIcon,
  TrashIcon,
  TypeIcon,
  UploadIcon,
} from '../ui/icons';

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
  /** The editor's plain text, for copy and export. */
  getText: () => string;
  /** The current analysis, for the report exports. */
  getReport: () => Report;
  focus: boolean;
  onToggleFocus: () => void;
  savedAt: number | null;
  restoredAt: number | null;
  onLoadSample: () => void;
}

const time = (t: number) =>
  new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const stamp = () => new Date().toISOString().slice(0, 10);

const Toolbar: React.FC<ToolbarProps> = ({
  onAnalyze,
  onClearHighlights,
  onClearText,
  onUpload,
  options,
  updateOption,
  getText,
  getReport,
  focus,
  onToggleFocus,
  savedAt,
  restoredAt,
  onLoadSample,
}) => {
  const { prefs, update } = usePreferences();
  const [showType, setShowType] = useState(false);
  const exportMenu = useRef<HTMLDetailsElement | null>(null);
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

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(getText().replace(/\n$/, ''));
      addToast('Text copied to the clipboard', 'success');
    } catch {
      addToast('The browser blocked clipboard access', 'error');
    }
  };

  const exportAs = (kind: 'text' | 'txt' | 'json' | 'csv') => {
    if (exportMenu.current) exportMenu.current.open = false;
    const name = `repetition-spotter-${stamp()}`;
    if (kind === 'text') {
      download(`${name}.txt`, getText(), 'text/plain;charset=utf-8');
      return;
    }
    const report = getReport();
    if (kind === 'txt')
      download(
        `${name}-report.txt`,
        reportAsText(report),
        'text/plain;charset=utf-8'
      );
    else if (kind === 'json')
      download(`${name}-report.json`, reportAsJson(report), 'application/json');
    else download(`${name}-report.csv`, reportAsCsv(report), 'text/csv');
  };

  return (
    <div className="border-b border-line px-4 py-4 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-ink">Editor</h2>
          <p className="text-xs text-muted" aria-live="polite">
            {restoredAt ? (
              <>
                Draft restored from {time(restoredAt)} ·{' '}
                <button
                  type="button"
                  onClick={onLoadSample}
                  className="underline decoration-dotted underline-offset-2 hover:text-accent"
                >
                  load the sample instead
                </button>
              </>
            ) : savedAt ? (
              `Saved in this browser at ${time(savedAt)}`
            ) : (
              'Drafts are saved in this browser as you type'
            )}
            {lastFileName && (
              <span className="ml-1" title={lastFileName}>
                · Last upload: {lastFileName}
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.csv,.json,.pdf,.docx,.doc,.xls,.xlsx,.rtf,.html,.htm,text/plain,text/markdown,text/html,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleUploadClick}
            disabled={isUploading}
            title="Open a .txt, .md, .docx, .pdf, .html, .csv or .xlsx file"
          >
            <UploadIcon />
            {isUploading ? 'Opening…' : 'Open'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={copyText}
            title="Copy the plain text"
          >
            <CopyIcon />
            Copy
          </Button>
          <details ref={exportMenu} className="group relative">
            <summary
              className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink [&::-webkit-details-marker]:hidden"
              title="Download the text or the analysis"
            >
              <DownloadIcon />
              Export
            </summary>
            <div className="absolute right-0 z-20 mt-1 w-52 overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-xl">
              {(
                [
                  ['text', 'Text (.txt)'],
                  ['txt', 'Report (.txt)'],
                  ['json', 'Report (.json)'],
                  ['csv', 'Report (.csv)'],
                ] as const
              ).map(([kind, label]) => (
                <button
                  key={kind}
                  type="button"
                  onClick={() => exportAs(kind)}
                  className="block w-full px-4 py-2 text-left text-sm text-ink hover:bg-surface-2"
                >
                  {label}
                </button>
              ))}
            </div>
          </details>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowType(v => !v)}
            aria-pressed={showType}
            title="Font, size and line spacing"
          >
            <TypeIcon />
            Aa
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleFocus}
            aria-pressed={focus}
            title={focus ? 'Leave focus mode (Esc)' : 'Focus mode'}
          >
            {focus ? <MinimizeIcon /> : <MaximizeIcon />}
            {focus ? 'Exit focus' : 'Focus'}
          </Button>
          {!focus && (
            <>
              <Button
                onClick={onClearHighlights}
                variant="ghost"
                size="sm"
                title="Clear highlights"
              >
                <EraserIcon />
                <span className="hidden sm:inline">Highlights</span>
              </Button>
              <Button
                onClick={onClearText}
                variant="ghost"
                size="sm"
                title="Clear the text"
              >
                <TrashIcon />
                <span className="hidden sm:inline">Clear</span>
              </Button>
              <Button onClick={onAnalyze} variant="primary" size="sm">
                <SearchIcon />
                Analyze
              </Button>
            </>
          )}
        </div>
      </div>

      {showType && (
        <div className="mt-4 grid animate-fade-in-up grid-cols-1 gap-4 rounded-xl border border-line bg-surface-2 p-4 md:grid-cols-3">
          <div>
            <span className="mb-2 block text-sm font-medium text-ink-2">
              Font
            </span>
            <div
              className="flex flex-wrap gap-1.5"
              role="radiogroup"
              aria-label="Editor font"
            >
              {(Object.keys(FONTS) as EditorFont[]).map(font => (
                <button
                  key={font}
                  type="button"
                  role="radio"
                  aria-checked={prefs.font === font}
                  onClick={() => update({ font })}
                  style={{ fontFamily: FONTS[font].stack }}
                  className={`rounded-lg border px-2.5 py-1 text-sm transition-colors ${
                    prefs.font === font
                      ? 'border-accent bg-accent-soft text-accent'
                      : 'border-line bg-surface text-ink hover:border-accent/60'
                  }`}
                >
                  {FONTS[font].label}
                </button>
              ))}
            </div>
          </div>
          <SliderControl
            label="Size"
            value={prefs.size}
            min={SIZES.min}
            max={SIZES.max}
            onChange={size => update({ size })}
            suffix="px"
          />
          <SliderControl
            label="Line spacing"
            value={prefs.leading}
            min={LEADINGS.min}
            max={LEADINGS.max}
            step={0.1}
            onChange={leading => update({ leading })}
          />
        </div>
      )}

      {!focus && (
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <SliderControl
            label="Minimum Length"
            value={options.minLength}
            min={1}
            max={20}
            onChange={value => updateOption('minLength', value)}
            suffix=" words"
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
      )}
    </div>
  );
};

export default Toolbar;
