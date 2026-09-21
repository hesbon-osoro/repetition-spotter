import { analyzeText } from '@/utils/textProcessing';
import type { AnalysisOptions, DetectionLevel } from '@/types';

const options = (overrides: Partial<AnalysisOptions> = {}): AnalysisOptions => ({
  minLength: 3,
  similarityThreshold: 80,
  ignoreCase: true,
  ignorePunctuation: false,
  semanticSimilarity: false,
  ...overrides,
});

/**
 * Characterisation tests for the live detection levels.
 *
 * These pin the behaviour the app actually exposes through the UI, so that
 * removing unreachable code cannot silently change what a user sees. They
 * intentionally avoid asserting on ids and other non-deterministic fields.
 */
describe('analyzeText', () => {
  describe('levels reachable from the UI', () => {
    const reachable: DetectionLevel[] = [
      'paragraph',
      'sentence',
      'phrase',
      'word',
    ];

    it.each(reachable)('returns repetitions and stats for %s', level => {
      const text =
        'The quick brown fox jumps over the lazy dog. ' +
        'The quick brown fox jumps over the lazy dog. ' +
        'A different sentence follows here.';

      const result = analyzeText(text, level, options());

      expect(result).toHaveProperty('repetitions');
      expect(result).toHaveProperty('stats');
      expect(Array.isArray(result.repetitions)).toBe(true);
      expect(result.stats.wordCount).toBeGreaterThan(0);
    });

    it.each(reachable)('handles empty input at %s', level => {
      const result = analyzeText('', level, options());

      expect(result.repetitions).toEqual([]);
      expect(result.stats).toEqual({
        wordCount: 0,
        repetitionCount: 0,
        instanceCount: 0,
        efficiencyScore: 100,
      });
    });

    it.each(reachable)('handles whitespace-only input at %s', level => {
      expect(analyzeText('   \n\n   ', level, options()).repetitions).toEqual([]);
    });
  });

  describe('paragraph level', () => {
    const repeated =
      'A paragraph long enough to clear the fifty character detection threshold.';

    it('detects a duplicated paragraph', () => {
      const text = [repeated, 'Something else entirely.', repeated].join(
        '\n\n'
      );

      const { repetitions } = analyzeText(text, 'paragraph', options());

      expect(repetitions).toHaveLength(1);
      expect(repetitions[0]?.count).toBe(2);
      expect(repetitions[0]?.level).toBe('paragraph');
    });

    it('honours ignoreCase when deciding what counts as a duplicate', () => {
      const lower = repeated.toLowerCase();
      const upper = repeated.toUpperCase();
      const text = [upper, 'Unrelated middle paragraph goes here.', lower].join(
        '\n\n'
      );

      const caseInsensitive = analyzeText(text, 'paragraph', options());
      const caseSensitive = analyzeText(
        text,
        'paragraph',
        options({ ignoreCase: false })
      );

      expect(caseInsensitive.repetitions[0]?.count).toBe(2);
      expect(caseSensitive.repetitions).toHaveLength(0);
    });

    it('honours ignorePunctuation', () => {
      const withPunctuation =
        'Hello, world! This paragraph is long enough to pass the threshold.';
      const withoutPunctuation =
        'Hello world This paragraph is long enough to pass the threshold';
      const text = [withPunctuation, 'Filler paragraph in between here.', withoutPunctuation].join(
        '\n\n'
      );

      const strict = analyzeText(text, 'paragraph', options());
      const lenient = analyzeText(
        text,
        'paragraph',
        options({ ignorePunctuation: true })
      );

      expect(strict.repetitions).toHaveLength(0);
      expect(lenient.repetitions.length).toBeGreaterThan(0);
    });

    it('does not treat paragraphs shorter than the threshold as duplicates', () => {
      const short = 'Too short.';
      const text = [short, 'Another short one.', short].join('\n\n');

      expect(analyzeText(text, 'paragraph', options()).repetitions).toEqual([]);
    });
  });

  describe('sentence level', () => {
    it('detects a duplicated sentence', () => {
      const sentence = 'This is a duplicated sentence that is long enough.';
      const text = `${sentence} Something else follows. ${sentence}`;

      const { repetitions } = analyzeText(text, 'sentence', options());

      expect(repetitions.length).toBeGreaterThan(0);
      expect(repetitions[0]?.count).toBe(2);
      expect(repetitions[0]?.level).toBe('sentence');
    });
  });

  describe('phrase level', () => {
    it('detects a duplicated phrase using the configured minimum length', () => {
      const text =
        'alpha beta gamma delta alpha beta gamma delta epsilon zeta';

      const { repetitions } = analyzeText(
        text,
        'phrase',
        options({ minLength: 3 })
      );

      expect(repetitions.length).toBeGreaterThan(0);
      expect(repetitions[0]?.level).toBe('phrase');
    });
  });

  describe('word level', () => {
    it('counts repeated words and ignores short ones', () => {
      const text = 'apple banana apple cherry apple an to be';

      const { repetitions } = analyzeText(text, 'word', options());

      const apple = repetitions.find(r => r.text === 'apple');
      expect(apple?.count).toBe(3);
      // Words of three characters or fewer are excluded.
      expect(repetitions.find(r => r.text === 'an')).toBeUndefined();
    });
  });

  describe('statistics', () => {
    it('reports a full efficiency score when nothing repeats', () => {
      const { stats } = analyzeText(
        'alpha bravo charlie delta echo foxtrot golf hotel',
        'word',
        options()
      );

      expect(stats.repetitionCount).toBe(0);
      expect(stats.instanceCount).toBe(0);
      expect(stats.efficiencyScore).toBe(100);
    });

    it('lowers the efficiency score as repetition increases', () => {
      const clean = analyzeText(
        'alpha bravo charlie delta echo foxtrot',
        'word',
        options()
      );
      const repetitive = analyzeText(
        'alpha alpha alpha alpha alpha bravo',
        'word',
        options()
      );

      expect(repetitive.stats.efficiencyScore).toBeLessThan(
        clean.stats.efficiencyScore
      );
    });

    it('counts words in the source text', () => {
      const { stats } = analyzeText('one two three four five', 'word', options());
      expect(stats.wordCount).toBe(5);
    });

    it('never reports a negative efficiency score', () => {
      const { stats } = analyzeText(
        'alpha alpha alpha alpha alpha alpha alpha',
        'word',
        options()
      );

      expect(stats.efficiencyScore).toBeGreaterThanOrEqual(0);
    });
  });
});
