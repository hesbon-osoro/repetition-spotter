// types/index.ts
export type DetectionLevel =
  | 'paragraph'
  | 'paragraphs'
  | 'sentence'
  | 'phrase'
  | 'word';

export interface Repetition {
  id: string;
  text: string;
  fullText: string;
  count: number;
  level: DetectionLevel;
  paragraphCount?: number;
  indices: number[];
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
