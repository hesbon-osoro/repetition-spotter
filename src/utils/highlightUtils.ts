import { Occurrence, QuillEditor } from '../types';

/**
 * Editor highlights painted with the CSS Custom Highlight API, so they never
 * become part of the document (the old background formats were saved into
 * the content and pushed back through onChange).
 */

export type Layer =
  | 'rs-paragraph'
  | 'rs-sentence'
  | 'rs-phrase'
  | 'rs-word'
  | 'rs-current'
  | 'rs-selection'
  | 'rs-match'
  | 'rs-semantic';

const LAYERS: Layer[] = [
  'rs-paragraph',
  'rs-sentence',
  'rs-phrase',
  'rs-word',
  'rs-current',
  'rs-selection',
  'rs-match',
  'rs-semantic',
];

// Injected at runtime: the CSS build pipeline drops ::highlight() rules.
const STYLES = `
::highlight(rs-paragraph) { background-color: rgba(239, 68, 68, 0.2); }
::highlight(rs-sentence) { background-color: rgba(245, 158, 11, 0.25); }
::highlight(rs-phrase) { background-color: rgba(16, 185, 129, 0.25); }
::highlight(rs-word) { background-color: rgba(59, 130, 246, 0.25); }
::highlight(rs-current) { background-color: rgba(220, 53, 69, 0.35); text-decoration: underline 2px rgb(220, 53, 69); }
::highlight(rs-selection) { background-color: #add8e6; }
::highlight(rs-match) { background-color: #ffeb3b; }
::highlight(rs-semantic) { background-color: rgba(139, 92, 246, 0.25); }
`;

function ensureStyles() {
  if (document.getElementById('rs-highlight-styles')) return;
  const style = document.createElement('style');
  style.id = 'rs-highlight-styles';
  style.textContent = STYLES;
  document.head.appendChild(style);
}

export const supportsHighlights = () =>
  typeof CSS !== 'undefined' &&
  'highlights' in CSS &&
  typeof Highlight !== 'undefined';

/** The DOM position of an editor index. */
function point(quill: QuillEditor, index: number, end: boolean) {
  // At a boundary Quill returns the following leaf, so ends are found from
  // the last character instead.
  const [leaf, offset] = quill.getLeaf(end ? Math.max(0, index - 1) : index);
  const node = leaf?.domNode;
  if (!node) return null;
  if (node.nodeType === Node.TEXT_NODE)
    return { node, offset: end ? offset + 1 : offset };
  return { node, offset: 0 };
}

export function rangeOf(quill: QuillEditor, span: Occurrence): Range | null {
  const a = point(quill, span.start, false);
  const b = point(quill, span.end, true);
  if (!a || !b) return null;
  try {
    const range = document.createRange();
    range.setStart(a.node, a.offset);
    range.setEnd(b.node, b.offset);
    return range;
  } catch {
    return null;
  }
}

export function paint(
  quill: QuillEditor | null,
  layer: Layer,
  spans: Occurrence[]
) {
  if (!quill || !supportsHighlights()) return;
  ensureStyles();
  const ranges = spans
    .map(s => rangeOf(quill, s))
    .filter((r): r is Range => r !== null);
  if (ranges.length) CSS.highlights.set(layer, new Highlight(...ranges));
  else CSS.highlights.delete(layer);
}

export function clear(...layers: Layer[]) {
  if (!supportsHighlights()) return;
  for (const l of layers.length ? layers : LAYERS) CSS.highlights.delete(l);
}

/** Bring a span into view without moving the editor selection. */
export function reveal(quill: QuillEditor | null, span: Occurrence) {
  if (!quill) return;
  const range = rangeOf(quill, span);
  const el =
    range?.startContainer.parentElement ??
    quill.getLine(span.start)?.[0]?.domNode;
  el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

export const getColorForLevel = (level: string): string => {
  const colors: Record<string, string> = {
    paragraph: 'rgba(239, 68, 68, 0.2)',
    sentence: 'rgba(245, 158, 11, 0.2)',
    phrase: 'rgba(16, 185, 129, 0.2)',
    word: 'rgba(59, 130, 246, 0.2)',
  };
  return colors[level] || 'rgba(156, 163, 175, 0.2)';
};
