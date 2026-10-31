import { analyzeText } from '@/utils/textProcessing';
import { sampleText } from '@/lib/sampleText';
import type { AnalysisOptions, DetectionLevel } from '@/types';
import { loadLegacy } from './legacy';

const legacy = loadLegacy();

const options = (minLength = 3): AnalysisOptions => ({
  minLength,
  similarityThreshold: 80,
  ignoreCase: true,
  ignorePunctuation: false,
  semanticSimilarity: false,
});

const fixtures: Record<string, string> = {
  sample: sampleText.map(op => op.insert).join(''),
  quarterly:
    'The quarterly report shows strong growth in every region. Analysts said the quarterly report shows strong growth despite headwinds.',
  shouting:
    'The committee approved the budget today. THE COMMITTEE APPROVED THE BUDGET TODAY.',
  essay: [
    'Our mission is to deliver reliable, affordable energy to every household in the region by the end of the decade.',
    'We will invest in solar, wind and storage, and we will publish our progress every quarter.',
    'Our mission is to deliver reliable, affordable energy to every household in the region by the end of the decade.',
    'We will invest in solar, wind and storage, and we will publish our progress every quarter.',
    'Questions are welcome. Questions are welcome at any time, and every question gets an answer.',
  ].join('\n\n'),
};

/** What a user sees in the list: count and the (lowercased) text, in order. */
const visible = (reps: { count: number; text: string }[]) =>
  reps.map(r => `${r.count}× ${r.text.toLowerCase()}`);

describe('parity with the legacy tool (public/ref.html)', () => {
  const levels: DetectionLevel[] = ['paragraph', 'sentence', 'phrase', 'word'];

  describe.each(Object.keys(fixtures))('fixture: %s', name => {
    const text = fixtures[name] ?? '';

    it.each(levels)('finds the same %s repetitions', level => {
      for (const min of [1, 3, 5]) {
        legacy.setMinLength(min);
        const expected = visible(legacy[level](text));
        const actual = visible(
          analyzeText(text, level, options(min)).repetitions
        );
        expect({ min, groups: actual }).toEqual({ min, groups: expected });
      }
    });

    it.each(['phrase', 'word'] as const)(
      'reports the same word positions at the %s level',
      level => {
        legacy.setMinLength(3);
        expect(
          analyzeText(text, level, options()).repetitions.map(r => r.indices)
        ).toEqual(legacy[level](text).map(r => r.indices));
      }
    );
  });

  it('finds paragraph repetitions in the sample text (14 groups)', () => {
    expect(
      analyzeText(fixtures.sample ?? '', 'paragraph', options()).repetitions
    ).toHaveLength(14);
  });
});

describe('deliberate improvements over the legacy tool', () => {
  it('treats single line breaks as paragraph breaks, as Quill writes them', () => {
    const p =
      'A paragraph long enough to clear the fifty character detection threshold.';
    const text = `${p}\nSomething else entirely.\n${p}\n`;
    legacy.setMinLength(3);
    expect(legacy.paragraph(text)).toHaveLength(0);
    expect(analyzeText(text, 'paragraph', options()).repetitions).toHaveLength(
      1
    );
  });

  it('counts a repeated heading or list item without final punctuation', () => {
    const text =
      'Install the dependencies first\nThen run it.\nInstall the dependencies first\n';
    const reps = analyzeText(text, 'sentence', options()).repetitions;
    expect(visible(reps)).toEqual(['2× install the dependencies first']);
  });

  it('keeps contractions and accented words whole', () => {
    const text = "Don't be naïve about it. Don't be naïve about it.";
    const reps = analyzeText(text, 'phrase', options(3)).repetitions;
    expect(reps[0]?.fullText).toBe("Don't be naïve");
  });
});

describe('occurrence offsets', () => {
  const text =
    'Repetition hurts clarity. Some words repeat. Repetition hurts clarity.';

  it.each(['sentence', 'phrase', 'word'] as const)(
    'point at the original text at the %s level',
    level => {
      for (const rep of analyzeText(text, level, options()).repetitions) {
        for (const o of rep.occurrences) {
          expect(text.slice(o.start, o.end).toLowerCase()).toBe(
            rep.fullText.toLowerCase()
          );
        }
      }
    }
  );

  it('keep the original casing in fullText', () => {
    const rep = analyzeText(text, 'sentence', options()).repetitions[0];
    expect(rep?.fullText).toBe('Repetition hurts clarity.');
    expect(rep?.occurrences).toEqual([
      { start: 0, end: 25 },
      { start: 45, end: 70 },
    ]);
  });
});
