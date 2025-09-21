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
