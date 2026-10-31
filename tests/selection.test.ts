import { analyzeSelection } from '@/utils/similarityAlgorithms';

const opts = (o = {}) => ({
  ignoreCase: true,
  ignorePunctuation: false,
  semanticSimilarity: false,
  ...o,
});

describe('analyzeSelection', () => {
  const text = 'The tool is fast. the TOOL is fast! A tool, is fast.';

  it('finds every other occurrence, case-insensitively, at exact offsets', () => {
    const range = { index: 0, length: 16 }; // "The tool is fast"
    const a = analyzeSelection('The tool is fast', range, text, opts());
    expect(a.exactMatches.map(m => [m.index, m.text])).toEqual([
      [18, 'the TOOL is fast'],
    ]);
    expect(a.exactMatches[0]?.similarity).toBe(100);
  });

  it('respects case when asked', () => {
    const range = { index: 0, length: 16 };
    const a = analyzeSelection(
      'The tool is fast',
      range,
      text,
      opts({ ignoreCase: false })
    );
    expect(a.exactMatches).toEqual([]);
  });

  it('maps matches found without punctuation back to the original text', () => {
    const a = analyzeSelection(
      'tool is fast',
      { index: 4, length: 12 },
      text,
      opts({ ignorePunctuation: true })
    );
    expect(a.exactMatches.map(m => m.text)).toEqual([
      'TOOL is fast',
      'tool, is fast',
    ]);
  });

  it('adds semantic matches only when enabled', () => {
    const doc =
      'Writers repeat themselves often. Editors catch repeated phrases quickly. Good writers rarely repeat themselves.';
    const range = { index: 0, length: 31 };
    const off = analyzeSelection(
      'Writers repeat themselves often',
      range,
      doc,
      opts()
    );
    const on = analyzeSelection(
      'Writers repeat themselves often',
      range,
      doc,
      opts({ semanticSimilarity: true })
    );
    expect(off.semanticMatches).toEqual([]);
    expect(on.semanticMatches.map(m => m.text)).toEqual([
      'Good writers rarely repeat themselves.',
    ]);
  });
});
