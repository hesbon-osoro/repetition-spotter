import {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
  useDeferredValue,
} from 'react';
import {
  Repetition,
  RepetitionStats,
  DetectionLevel,
  AnalysisOptions,
  Occurrence,
  QuillRange,
} from '../types';
import type { QuillWrapperRef } from '@/components/editor/QuillWrapper';
import { analyzeText } from '../utils/textProcessing';
import {
  analyzeSelection,
  type SelectionAnalysis,
} from '../utils/similarityAlgorithms';
import { clear, paint, reveal, type Layer } from '../utils/highlightUtils';
import { computeTextStats } from '../utils/textStats';
import { sampleText } from '../lib/sampleText';

export interface QuillDelta {
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

const levelLayer = (level: DetectionLevel): Layer => `rs-${level}`;

const FOCUS_LAYERS: Layer[] = [
  'rs-paragraph',
  'rs-sentence',
  'rs-phrase',
  'rs-word',
  'rs-keyword',
  'rs-long',
];

export const DRAFT_KEY = 'rs:draft';

interface Draft {
  content: string | QuillDelta[];
  savedAt: number;
}

function readDraft(): Draft | null {
  try {
    const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? 'null');
    return draft?.content ? draft : null;
  } catch {
    return null;
  }
}

export const useTextAnalysis = () => {
  const [content, setContent] = useState<string | QuillDelta[]>('');
  const [repetitions, setRepetitions] = useState<Repetition[]>([]);
  const [stats, setStats] = useState<RepetitionStats>(initialStats);
  const [detectionLevel, setDetectionLevel] =
    useState<DetectionLevel>('paragraph');
  const [options, setOptions] = useState<AnalysisOptions>(initialOptions);
  const [selectionAnalysis, setSelectionAnalysis] =
    useState<SelectionAnalysis | null>(null);
  const [focused, setFocused] = useState<{ id: string; at: number } | null>(
    null
  );
  const quillRef = useRef<QuillWrapperRef>(null);
  /** When the draft on screen was restored from the last visit. */
  const [restoredAt, setRestoredAt] = useState<number | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [ready, setReady] = useState(false);

  // Open the last draft, or the sample text on a first visit.
  useEffect(() => {
    const draft = readDraft();
    if (draft) {
      setContent(draft.content);
      setRestoredAt(draft.savedAt);
    } else setContent(sampleText);
    setReady(true);
  }, []);

  // Autosave shortly after typing stops; an empty editor clears the draft.
  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(() => {
      try {
        if (plainTextOf(content).trim()) {
          const now = Date.now();
          localStorage.setItem(
            DRAFT_KEY,
            JSON.stringify({ content, savedAt: now } satisfies Draft)
          );
          setSavedAt(now);
        } else {
          localStorage.removeItem(DRAFT_KEY);
          setSavedAt(null);
        }
      } catch {
        // storage full or blocked: the draft just isn't kept
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [content, ready]);

  const editor = () => quillRef.current?.getEditor() ?? null;

  /** The text exactly as the editor holds it, so offsets match. */
  const currentText = useCallback(
    () => editor()?.getText() ?? plainTextOf(content),
    [content]
  );

  // Live document statistics, a beat behind typing.
  const [text, setText] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setText(currentText()), 120);
    return () => clearTimeout(timer);
  }, [currentText]);
  const deferredText = useDeferredValue(text);
  const textStats = useMemo(
    () => computeTextStats(deferredText),
    [deferredText]
  );

  // Analysis runs in a worker when the browser allows it; only the newest
  // request's answer is used.
  const worker = useRef<Worker | null>(null);
  const latest = useRef(0);
  useEffect(() => {
    try {
      worker.current = new Worker(
        new URL('../workers/analyze.worker.ts', import.meta.url)
      );
    } catch {
      worker.current = null;
    }
    return () => worker.current?.terminate();
  }, []);

  const run = useCallback(() => {
    const text = currentText();
    clear();
    setFocused(null);
    const id = ++latest.current;
    if (!text.trim()) {
      setRepetitions([]);
      setStats(initialStats);
      return;
    }
    const apply = (result: ReturnType<typeof analyzeText>) => {
      if (id !== latest.current) return;
      setRepetitions(result.repetitions);
      setStats(result.stats);
    };
    const w = worker.current;
    if (!w) {
      apply(analyzeText(text, detectionLevel, options));
      return;
    }
    w.onmessage = (
      e: MessageEvent<{ id: number } & ReturnType<typeof analyzeText>>
    ) => {
      if (e.data.id === id) apply(e.data);
    };
    w.onerror = () => apply(analyzeText(text, detectionLevel, options));
    w.postMessage({ id, text, level: detectionLevel, options });
  }, [currentText, detectionLevel, options]);

  // Re-analyse shortly after edits, a level change or an option change.
  useEffect(() => {
    const timer = setTimeout(run, 400);
    return () => clearTimeout(timer);
  }, [run]);

  // Offsets go stale as soon as the text changes, so drop highlights on edit.
  useEffect(() => {
    clear();
  }, [content]);

  useEffect(() => () => clear(), []);

  /**
   * Highlight a set of spans; clicking the same set again moves to its next
   * span. `at` jumps straight to one span.
   */
  const showSpans = useCallback(
    (id: string, layer: Layer, spans: Occurrence[], at?: number) => {
      const quill = editor();
      if (!quill || !spans.length) return;
      const index =
        at ?? (focused?.id === id ? (focused.at + 1) % spans.length : 0);
      const current = spans[index];
      if (!current) return;
      clear(...FOCUS_LAYERS);
      paint(quill, layer, spans);
      paint(quill, 'rs-current', [current]);
      reveal(quill, current);
      setFocused({ id, at: index });
    },
    [focused]
  );

  /** Highlight every occurrence; each further click moves to the next one. */
  const highlightRepetition = useCallback(
    (repetition: Repetition) =>
      showSpans(
        repetition.id,
        levelLayer(repetition.level),
        repetition.occurrences
      ),
    [showSpans]
  );

  const handleSelection = useCallback(
    (range: QuillRange | null) => {
      const quill = editor();
      if (!quill) return;
      if (!range || range.length === 0) {
        clear('rs-selection', 'rs-match', 'rs-semantic');
        setSelectionAnalysis(null);
        return;
      }
      const selectedText = quill.getText(range.index, range.length).trim();
      if (!selectedText) return;
      const analysis = analyzeSelection(
        selectedText,
        range,
        quill.getText(),
        options
      );
      paint(quill, 'rs-selection', [
        { start: range.index, end: range.index + range.length },
      ]);
      paint(
        quill,
        'rs-match',
        analysis.exactMatches.map(m => ({
          start: m.index,
          end: m.index + m.text.length,
        }))
      );
      paint(
        quill,
        'rs-semantic',
        analysis.semanticMatches.map(m => ({
          start: m.index,
          end: m.index + m.text.length,
        }))
      );
      setSelectionAnalysis(analysis);
    },
    [options]
  );

  const updateOption = useCallback(
    <K extends keyof AnalysisOptions>(key: K, value: AnalysisOptions[K]) => {
      setOptions(prev => ({ ...prev, [key]: value }));
    },
    []
  );

  const clearHighlights = useCallback(() => {
    clear();
    setFocused(null);
    setSelectionAnalysis(null);
  }, []);

  const clearText = useCallback(() => {
    setContent('');
    setRestoredAt(null);
    setRepetitions([]);
    setStats(initialStats);
    clearHighlights();
  }, [clearHighlights]);

  const scrollToMatch = useCallback((index: number, length: number) => {
    const span: Occurrence = { start: index, end: index + length };
    paint(editor(), 'rs-current', [span]);
    reveal(editor(), span);
  }, []);

  const loadSample = useCallback(() => {
    setContent(sampleText);
    setRestoredAt(null);
  }, []);

  return {
    content,
    setContent,
    ready,
    restoredAt,
    savedAt,
    loadSample,
    currentText,
    textStats,
    statsText: deferredText,
    showSpans,
    repetitions,
    stats,
    detectionLevel,
    setDetectionLevel,
    options,
    updateOption,
    analyze: run,
    highlightRepetition,
    focused,
    clearHighlights,
    clearText,
    quillRef,
    handleSelection,
    scrollToMatch,
    selectionAnalysis,
  };
};

const decode = (s: string) =>
  s
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');

/**
 * Plain text the way Quill's getText() would give it, for when the editor is
 * not mounted yet: one "\n" per block, whitespace inside lines kept.
 */
export const plainTextOf = (content: string | QuillDelta[]): string => {
  if (Array.isArray(content))
    return content
      .map(op => (typeof op.insert === 'string' ? op.insert : ''))
      .join('');
  return decode(
    content
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|h[1-6]|li|blockquote|pre|div|tr)>/gi, '\n')
      .replace(/<[^>]*>/g, '')
  );
};
