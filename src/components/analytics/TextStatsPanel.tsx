import { Occurrence } from '@/types';
import {
  LONG_SENTENCE,
  formatDuration,
  readingEaseLabel,
  type TextStats,
} from '@/utils/textStats';
import type { Layer } from '@/utils/highlightUtils';
import Card from '../ui/Card';

interface TextStatsPanelProps {
  stats: TextStats;
  /** Highlight spans in the editor (keywords, long sentences). */
  onShow: (id: string, layer: Layer, spans: Occurrence[], at?: number) => void;
  focused?: { id: string; at: number } | null;
  /** The editor text the spans point into, for previews. */
  text: string;
}

const nf = new Intl.NumberFormat();

const Stat = ({ label, value }: { label: string; value: string | number }) => (
  <div className="rounded-lg bg-surface-2 px-3 py-2">
    <dt className="text-[11px] font-medium tracking-wide text-muted uppercase">
      {label}
    </dt>
    <dd className="mt-0.5 text-base font-semibold tabular-nums text-ink">
      {typeof value === 'number' ? nf.format(value) : value}
    </dd>
  </div>
);

/** Reading ease 0..100 on a red → green bar. */
const EaseBar = ({ score }: { score: number }) => (
  <div
    className="relative mt-2 h-2 rounded-full bg-linear-to-r from-red-400 via-amber-400 to-emerald-400"
    aria-hidden="true"
  >
    <span
      className="absolute top-1/2 h-4 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-ink shadow"
      style={{ left: `${Math.min(100, Math.max(0, score))}%` }}
    />
  </div>
);

const TextStatsPanel: React.FC<TextStatsPanelProps> = ({
  stats: s,
  onShow,
  focused,
  text,
}) => {
  return (
    <Card title="Document Stats" className="mt-6">
      <dl className="grid grid-cols-2 gap-2">
        <Stat label="Words" value={s.words} />
        <Stat label="Characters" value={s.characters} />
        <Stat label="No spaces" value={s.charactersNoSpaces} />
        <Stat label="Sentences" value={s.sentences} />
        <Stat label="Paragraphs" value={s.paragraphs} />
        <Stat label="Unique words" value={s.uniqueWords} />
        <Stat label="Reading" value={formatDuration(s.readingTime)} />
        <Stat label="Speaking" value={formatDuration(s.speakingTime)} />
        <Stat label="Avg word" value={`${s.avgWordLength} ch`} />
        <Stat label="Avg sentence" value={`${s.avgSentenceLength} w`} />
      </dl>

      <section className="mt-5 border-t border-line pt-4">
        <div className="flex items-baseline justify-between gap-2">
          <h4 className="text-sm font-semibold text-ink">Readability</h4>
          <span className="text-xs text-ink-2">
            {s.words ? readingEaseLabel(s.readingEase) : '—'}
          </span>
        </div>
        <EaseBar score={s.readingEase} />
        <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-ink-2">
          <dt>Flesch reading ease</dt>
          <dd className="text-right font-medium tabular-nums text-ink">
            {s.readingEase}
          </dd>
          <dt>Grade level</dt>
          <dd className="text-right font-medium tabular-nums text-ink">
            {s.gradeLevel}
          </dd>
          <dt title="Unique words as a share of all words">
            Lexical diversity
          </dt>
          <dd className="text-right font-medium tabular-nums text-ink">
            {s.lexicalDiversity}%
          </dd>
          <dt title="Content words (not function words like 'the' or 'of') as a share of all words">
            Lexical density
          </dt>
          <dd className="text-right font-medium tabular-nums text-ink">
            {s.lexicalDensity}%
          </dd>
        </dl>
      </section>

      <section className="mt-5 border-t border-line pt-4">
        <h4 className="mb-2 text-sm font-semibold text-ink">Top keywords</h4>
        {s.keywords.length ? (
          <ul className="flex flex-wrap gap-1.5">
            {s.keywords.map(k => {
              const id = `kw-${k.word}`;
              const active = focused?.id === id;
              return (
                <li key={k.word}>
                  <button
                    type="button"
                    onClick={() => onShow(id, 'rs-keyword', k.occurrences)}
                    title={`${k.count} times, ${k.density}% of words. Click to highlight; click again for the next.`}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors ${
                      active
                        ? 'border-sky-400 bg-sky-100 text-sky-800 dark:border-sky-400/60 dark:bg-sky-500/20 dark:text-sky-200'
                        : 'border-line bg-surface-2 text-ink hover:border-sky-400/70'
                    }`}
                  >
                    {k.word}
                    <span className="tabular-nums text-muted">
                      {active ? `${focused.at + 1}/${k.count}` : k.count}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-xs text-muted">No repeated keywords yet.</p>
        )}
      </section>

      <section className="mt-5 border-t border-line pt-4">
        <h4 className="mb-2 flex items-baseline justify-between text-sm font-semibold text-ink">
          Long sentences
          <span className="text-xs font-normal text-muted">
            over {LONG_SENTENCE} words
          </span>
        </h4>
        {s.longSentences.length ? (
          <ul className="thin-scroll max-h-48 space-y-1.5 overflow-y-auto pr-1">
            {s.longSentences.map((span, i) => {
              const active = focused?.id === 'long' && focused.at === i;
              return (
                <li key={span.start}>
                  <button
                    type="button"
                    onClick={() =>
                      onShow('long', 'rs-long', s.longSentences, i)
                    }
                    className={`block w-full rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                      active
                        ? 'border-orange-400 bg-orange-50 text-orange-900 dark:border-orange-400/60 dark:bg-orange-500/15 dark:text-orange-100'
                        : 'border-line text-ink-2 hover:border-orange-400/70'
                    }`}
                  >
                    <span className="line-clamp-2">
                      {text.slice(span.start, span.end)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-xs text-muted">
            {s.words ? 'None. Nicely paced.' : 'Nothing to check yet.'}
          </p>
        )}
      </section>
    </Card>
  );
};

export default TextStatsPanel;
