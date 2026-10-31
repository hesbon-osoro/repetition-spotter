import { useState } from 'react';
import { Repetition } from '@/types';
import Card from '../ui/Card';
import { getColorForLevel } from '@/utils/highlightUtils';

interface RepetitionListProps {
  repetitions: Repetition[];
  onHighlight?: (repetition: Repetition) => void;
  /** The repetition being shown, and which occurrence is in view. */
  focused?: { id: string; at: number } | null;
}

const RepetitionList: React.FC<RepetitionListProps> = ({
  repetitions,
  onHighlight,
  focused,
}) => {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const shown = q
    ? repetitions.filter(r => r.fullText.toLowerCase().includes(q))
    : repetitions;

  const handleRepetitionClick = (repetition: Repetition) => {
    if (onHighlight) {
      onHighlight(repetition);
    }
  };

  if (repetitions.length === 0) {
    return (
      <Card title="Detected Repetitions">
        <div className="py-8 text-center text-ink-2">
          <svg
            className="mx-auto mb-4 h-12 w-12 text-muted"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-sm">No repetitions found!</p>
          <p className="mt-1 text-xs text-muted">Your text looks good</p>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Detected Repetitions">
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search repetitions..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          aria-label="Search repetitions"
          className="w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none"
        />
      </div>

      <div className="thin-scroll max-h-96 space-y-2 overflow-y-auto pr-1">
        {shown.map(repetition => (
          <button
            type="button"
            key={repetition.id}
            className={`group block w-full rounded-lg border p-3 text-left transition-all duration-200 hover:translate-x-0.5 ${
              focused?.id === repetition.id
                ? 'border-accent bg-accent-soft'
                : 'border-line hover:border-accent/60 hover:bg-accent-soft'
            }`}
            onClick={() => handleRepetitionClick(repetition)}
            title="Click to highlight; click again for the next occurrence"
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className="h-4 w-4 rounded-sm"
                style={{ backgroundColor: getColorForLevel(repetition.level) }}
              />
              <span className="text-xs font-medium tabular-nums text-ink-2">
                {focused?.id === repetition.id
                  ? `${focused.at + 1} of ${repetition.count}`
                  : `${repetition.count} times`}
              </span>
            </div>
            <p className="truncate text-sm font-medium text-ink">
              &quot;{repetition.text}&quot;
            </p>
            <p className="mt-1 text-xs capitalize text-muted">
              {repetition.level} level
              {repetition.paragraphCount &&
                repetition.paragraphCount > 1 &&
                ` (${repetition.paragraphCount} paragraphs)`}
            </p>
          </button>
        ))}
        {shown.length === 0 && (
          <p className="py-4 text-center text-sm text-ink-2">
            No repetitions match “{query}”.
          </p>
        )}
      </div>
    </Card>
  );
};

export default RepetitionList;
