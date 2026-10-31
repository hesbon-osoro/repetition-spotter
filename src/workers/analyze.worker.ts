// Runs repetition analysis off the main thread, so typing stays smooth on
// long documents.
import { analyzeText } from '../utils/textProcessing';
import type { AnalysisOptions, DetectionLevel } from '../types';

export interface AnalyzeRequest {
  id: number;
  text: string;
  level: DetectionLevel;
  options: AnalysisOptions;
}

self.onmessage = (e: MessageEvent<AnalyzeRequest>) => {
  const { id, text, level, options } = e.data;
  self.postMessage({ id, ...analyzeText(text, level, options) });
};
