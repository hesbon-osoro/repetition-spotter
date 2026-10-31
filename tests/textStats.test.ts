import {
  computeTextStats,
  formatDuration,
  readingEaseLabel,
  syllablesIn,
} from '../src/utils/textStats';
import {
  reportAsCsv,
  reportAsJson,
  reportAsText,
} from '../src/utils/exporters';
import { analyzeText } from '../src/utils/textProcessing';

describe('syllablesIn', () => {
  it.each([
    ['cat', 1],
    ['table', 2],
    ['water', 2],
    ['beautiful', 3],
    ['readability', 5],
    ['jumped', 1],
    ['42', 1],
    ['—', 0],
  ])('%s has %i', (word, n) => expect(syllablesIn(word)).toBe(n));
});

describe('computeTextStats', () => {
  it('counts an empty document as zero', () => {
    const s = computeTextStats('\n');
    expect(s).toMatchObject({
      characters: 0,
      words: 0,
      sentences: 0,
      paragraphs: 0,
      readingEase: 0,
      gradeLevel: 0,
      lexicalDiversity: 0,
    });
  });

  it('counts characters, words, sentences and paragraphs', () => {
    const text = 'The cat sat. The cat ran!\nA new line here.\n';
    const s = computeTextStats(text);
    expect(s.characters).toBe(text.length - 1); // Quill's final newline
    expect(s.charactersNoSpaces).toBe(text.replace(/\s/g, '').length);
    expect(s.words).toBe(10);
    expect(s.sentences).toBe(3);
    expect(s.paragraphs).toBe(2);
    expect(s.uniqueWords).toBe(8);
    expect(s.avgSentenceLength).toBe(3.3);
  });

  it('keeps contractions as one word', () => {
    expect(computeTextStats("Don't stop, it's fine.").words).toBe(4);
  });

  it('times reading at 238 wpm and speaking at 150 wpm', () => {
    const text = 'word '.repeat(300);
    const s = computeTextStats(text);
    expect(s.readingTime).toBe(Math.round((300 / 238) * 60));
    expect(s.speakingTime).toBe(120);
  });

  it('scores simple text as easy and dense text as hard', () => {
    const easy = computeTextStats('The cat sat on the mat. It was a big cat.');
    const hard = computeTextStats(
      'Notwithstanding considerable institutional resistance, comprehensive organisational transformation necessitates sustained interdisciplinary collaboration and deliberate administrative reconfiguration.'
    );
    expect(easy.readingEase).toBeGreaterThan(90);
    expect(easy.gradeLevel).toBeLessThan(3);
    expect(hard.readingEase).toBeLessThan(10);
    expect(hard.gradeLevel).toBeGreaterThan(18);
  });

  it('ranks repeated content words as keywords, ignoring function words', () => {
    const text =
      'The editor saves drafts. The editor exports drafts. The editor imports text.';
    const s = computeTextStats(text);
    expect(s.keywords.map(k => [k.word, k.count])).toEqual([
      ['editor', 3],
      ['drafts', 2],
    ]);
    const [editor] = s.keywords;
    expect(editor?.density).toBe(25);
    expect(editor?.occurrences.map(o => text.slice(o.start, o.end))).toEqual([
      'editor',
      'editor',
      'editor',
    ]);
    expect(s.lexicalDensity).toBe(75);
  });

  it('flags sentences over 25 words with their exact span', () => {
    const long = `${'word '.repeat(30).trim()}.`;
    const text = `Short one. ${long} Another short one.`;
    const s = computeTextStats(text);
    expect(s.longSentences).toHaveLength(1);
    const [span] = s.longSentences;
    expect(text.slice(span!.start, span!.end)).toBe(long);
  });
});

describe('formatting', () => {
  it('formats durations', () => {
    expect(formatDuration(45)).toBe('45 sec');
    expect(formatDuration(180)).toBe('3 min');
    expect(formatDuration(3900)).toBe('1 h 5 min');
  });

  it('labels Flesch bands', () => {
    expect(readingEaseLabel(95)).toBe('Very easy');
    expect(readingEaseLabel(65)).toBe('Plain English');
    expect(readingEaseLabel(10)).toBe('Very difficult');
  });
});

describe('report exporters', () => {
  const text =
    'Repeat this sentence, "please", now. Repeat this sentence, "please", now.\n';
  const { repetitions, stats } = analyzeText(text, 'sentence', {
    minLength: 3,
    similarityThreshold: 80,
    ignoreCase: true,
    ignorePunctuation: false,
    semanticSimilarity: false,
  });
  const report = {
    level: 'sentence',
    repetitions,
    stats,
    textStats: computeTextStats(text),
    generatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  it('writes CSV with quoted cells', () => {
    expect(reportAsCsv(report)).toBe(
      'level,count,text,positions\r\n' +
        'sentence,2,"Repeat this sentence, ""please"", now.",0 37\r\n'
    );
  });

  it('writes JSON without highlight spans in the keyword list', () => {
    const json = JSON.parse(reportAsJson(report));
    expect(json.generatedAt).toBe('2026-01-01T00:00:00.000Z');
    expect(json.repetitions).toEqual([
      {
        level: 'sentence',
        count: 2,
        text: 'Repeat this sentence, "please", now.',
        occurrences: [
          { start: 0, end: 36 },
          { start: 37, end: 73 },
        ],
      },
    ]);
    expect(json.textStats.keywords[0]).toEqual({
      word: 'please',
      count: 2,
      density: 20,
    });
  });

  it('writes a readable text report', () => {
    const txt = reportAsText(report);
    expect(txt).toContain('Words: 10');
    expect(txt).toContain('1. [2×] Repeat this sentence, "please", now.');
  });
});
