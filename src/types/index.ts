// types/index.ts
export type DetectionLevel = 'paragraph' | 'sentence' | 'phrase' | 'word';

/** A character span in the analysed text: [start, end). */
export interface Occurrence {
  start: number;
  end: number;
}

export interface Repetition {
  id: string;
  /** Display text (truncated for long paragraphs). */
  text: string;
  /** The first occurrence exactly as written. */
  fullText: string;
  count: number;
  level: DetectionLevel;
  paragraphCount?: number;
  /** Unit indices (paragraph, sentence or word positions), as in the legacy tool. */
  indices: number[];
  /** Where each occurrence sits in the analysed text, for highlighting. */
  occurrences: Occurrence[];
  matches?: MatchInfo[];
  isSelection?: boolean;
}

export interface MatchInfo {
  index: number;
  text: string;
  context: string;
  similarity: number;
  isSemantic?: boolean;
}

// Quill Editor Types
export interface QuillEditor {
  getText: (index?: number, length?: number) => string;
  getLength: () => number;
  formatText: (
    index: number,
    length: number,
    format: string,
    value: string | boolean
  ) => void;
  setSelection: (index: number, length: number, source?: string) => void;
  getBounds: (
    index: number,
    length: number
  ) => { top: number; left: number; height: number; width: number } | null;
  getLine: (index: number) => Array<{ domNode: HTMLElement }> | null;
  getLeaf: (index: number) => [{ domNode: Node } | null, number];
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  off: (event: string, handler: (...args: unknown[]) => void) => void;
  focus: () => void;
  container: HTMLElement;
}

// QuillInstance is actually the QuillEditor itself
export type QuillInstance = QuillEditor;

export interface QuillRange {
  index: number;
  length: number;
}

export interface RepetitionStats {
  wordCount: number;
  repetitionCount: number;
  instanceCount: number;
  efficiencyScore: number;
}

export interface AnalysisOptions {
  minLength: number;
  similarityThreshold: number;
  ignoreCase: boolean;
  ignorePunctuation: boolean;
  semanticSimilarity: boolean;
}
