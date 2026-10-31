import fs from 'node:fs';
import path from 'node:path';

/**
 * Loads the legacy detection functions straight from public/ref.html, so the
 * parity tests compare against the code users relied on, not a copy of it.
 */
export interface LegacyRepetition {
  text: string;
  fullText: string;
  count: number;
  indices: number[];
  paragraphCount?: number;
}

type Find = (text: string) => LegacyRepetition[];

export interface Legacy {
  paragraph: Find;
  sentence: Find;
  phrase: Find;
  word: Find;
  setMinLength: (n: number) => void;
}

/** The source of `function name(...) { ... }`, found by brace matching. */
function extract(html: string, name: string): string {
  const start = html.indexOf(`function ${name}(`);
  if (start === -1) throw new Error(`legacy function ${name} not found`);
  let depth = 0;
  for (let i = html.indexOf('{', start); i < html.length; i++) {
    if (html[i] === '{') depth++;
    else if (html[i] === '}' && --depth === 0) return html.slice(start, i + 1);
  }
  throw new Error(`unbalanced legacy function ${name}`);
}

export function loadLegacy(): Legacy {
  const html = fs.readFileSync(
    path.join(__dirname, '..', 'public', 'ref.html'),
    'utf8'
  );
  const names = [
    'findParagraphRepetitions',
    'findSentenceRepetitions',
    'findPhraseRepetitions',
    'findWordRepetitions',
  ];
  const source = names.map(n => extract(html, n)).join('\n');
  const state = { minLength: 3 };
  // The legacy code reads the minimum length from a slider in the page.
  const document = {
    getElementById: () => ({ value: String(state.minLength) }),
  };
  const mod = new Function(
    'document',
    `${source}\nreturn { paragraph: findParagraphRepetitions, sentence: findSentenceRepetitions, phrase: findPhraseRepetitions, word: findWordRepetitions };`
  )(document) as Omit<Legacy, 'setMinLength'>;
  return { ...mod, setMinLength: n => (state.minLength = n) };
}
