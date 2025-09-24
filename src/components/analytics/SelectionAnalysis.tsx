import { SelectionAnalysis as SelectionAnalysisType } from '@/hooks/useSelectionAnalysis';

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
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <svg
            className="w-5 h-5 text-green-600 mr-2"
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
          <span className="text-sm font-medium text-green-800">
            Selection Analysis
          </span>
        </div>
        <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded">
          {analysis.matches.length + 1} total
        </span>
      </div>

      <p className="text-sm text-green-700 mb-2">
        &quot;
        {analysis.selectedText.length > 100
          ? analysis.selectedText.substring(0, 100) + '...'
          : analysis.selectedText}
        &quot;
      </p>

      <div className="flex items-center space-x-4 text-xs text-green-600 mb-3">
        <span className="capitalize">{analysis.level} level</span>
        <span>{analysis.wordCount} words</span>
        <span>{analysis.charCount} chars</span>
      </div>

      {analysis.exactMatches.length > 0 && (
        <>
          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
            <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
            Exact Matches ({analysis.exactMatches.length})
          </h4>
          {analysis.exactMatches.map((match, index) => (
            <div
              key={`exact-${match.index}-${match.text.length}`}
              className="w-full p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors mb-2"
              onClick={() => onScrollToMatch(match.index, match.text.length)}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-500">
                  Match {index + 1}
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                    {match.similarity}%
                  </span>
                  <span className="text-xs text-gray-400">
                    Pos {match.index}
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-600 italic">{match.context}</p>
            </div>
          ))}
        </>
      )}

      {analysis.semanticMatches.length > 0 && (
        <>
          <h4 className="text-sm font-medium text-gray-700 mb-2 mt-4 flex items-center">
            <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
            Similar Content ({analysis.semanticMatches.length})
          </h4>
          {analysis.semanticMatches.map((match, index) => (
            <div
              key={`semantic-${match.index}-${match.text.length}`}
              className="w-full p-3 border border-blue-200 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors mb-2"
              onClick={() => onScrollToMatch(match.index, match.text.length)}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-blue-600">
                  Similar {index + 1}
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-blue-600 bg-blue-200 px-2 py-1 rounded">
                    {Math.round(match.similarity)}%
                  </span>
                  <span className="text-xs text-blue-400">
                    Pos {match.index}
                  </span>
                </div>
              </div>
              <p className="text-xs text-blue-600 italic">{match.context}</p>
            </div>
          ))}
        </>
      )}
    </div>
  );
};

export default SelectionAnalysis;
