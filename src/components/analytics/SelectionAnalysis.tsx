import type { SelectionAnalysis as SelectionAnalysisType } from '@/utils/similarityAlgorithms';

interface SelectionAnalysisProps {
  analysis: SelectionAnalysisType;
  onScrollToMatch: (index: number, length: number) => void;
}

const SelectionAnalysis: React.FC<SelectionAnalysisProps> = ({
  analysis,
  onScrollToMatch,
}) => {
  if (!analysis) return null;

  return (
    <div className="mb-4 rounded-2xl border border-green-200 bg-green-50 p-4 dark:border-green-500/30 dark:bg-green-500/10">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <svg
            className="mr-2 h-5 w-5 text-green-600 dark:text-green-400"
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
          <span className="text-sm font-medium text-green-800 dark:text-green-200">
            Selection Analysis
          </span>
        </div>
        <span className="rounded-sm bg-green-100 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-500/20 dark:text-green-300">
          {analysis.matches.length + 1} total
        </span>
      </div>

      <p className="mb-2 text-sm break-words text-green-800 dark:text-green-200">
        &quot;
        {analysis.selectedText.length > 100
          ? analysis.selectedText.substring(0, 100) + '...'
          : analysis.selectedText}
        &quot;
      </p>

      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-green-700 dark:text-green-300">
        <span className="capitalize">{analysis.level} level</span>
        <span>{analysis.wordCount} words</span>
        <span>{analysis.charCount} chars</span>
      </div>

      {analysis.exactMatches.length > 0 && (
        <>
          <h4 className="mb-2 flex items-center text-sm font-medium text-ink-2">
            <span className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></span>
            Exact Matches ({analysis.exactMatches.length})
          </h4>
          {analysis.exactMatches.map((match, index) => (
            <button
              type="button"
              key={`exact-${match.index}-${match.text.length}`}
              className="mb-2 block w-full rounded-lg border border-line bg-surface p-3 text-left transition-colors hover:bg-surface-2"
              onClick={() => onScrollToMatch(match.index, match.text.length)}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-ink-2">
                  Match {index + 1}
                </span>
                <div className="flex items-center space-x-2">
                  <span className="rounded-sm bg-green-100 px-2 py-1 text-xs text-green-700 dark:bg-green-500/20 dark:text-green-300">
                    {match.similarity}%
                  </span>
                  <span className="text-xs text-muted">Pos {match.index}</span>
                </div>
              </div>
              <p className="text-xs italic text-ink-2">{match.context}</p>
            </button>
          ))}
        </>
      )}

      {analysis.semanticMatches.length > 0 && (
        <>
          <h4 className="mt-4 mb-2 flex items-center text-sm font-medium text-ink-2">
            <span className="w-3 h-3 bg-violet-500 rounded-full mr-2"></span>
            Similar Content ({analysis.semanticMatches.length})
          </h4>
          {analysis.semanticMatches.map((match, index) => (
            <button
              type="button"
              key={`semantic-${match.index}-${match.text.length}`}
              className="mb-2 block w-full rounded-lg border border-violet-200 bg-violet-50 p-3 text-left transition-colors hover:bg-violet-100 dark:border-violet-500/30 dark:bg-violet-500/10 dark:hover:bg-violet-500/20"
              onClick={() => onScrollToMatch(match.index, match.text.length)}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-violet-700 dark:text-violet-300">
                  Similar {index + 1}
                </span>
                <div className="flex items-center space-x-2">
                  <span className="rounded-sm bg-violet-200 px-2 py-1 text-xs text-violet-700 dark:bg-violet-500/25 dark:text-violet-200">
                    {Math.round(match.similarity)}%
                  </span>
                  <span className="text-xs text-violet-500 dark:text-violet-300">
                    Pos {match.index}
                  </span>
                </div>
              </div>
              <p className="text-xs italic text-violet-700 dark:text-violet-200">
                {match.context}
              </p>
            </button>
          ))}
        </>
      )}
    </div>
  );
};

export default SelectionAnalysis;
