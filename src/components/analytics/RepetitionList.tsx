import { Repetition } from '@/types';
import Card from '../ui/Card';
import { getColorForLevel } from '@/utils/highlightUtils';

interface RepetitionListProps {
  repetitions: Repetition[];
  onHighlight?: (repetition: Repetition) => void;
}

const RepetitionList: React.FC<RepetitionListProps> = ({
  repetitions,
  onHighlight,
}) => {
  const handleRepetitionClick = (repetition: Repetition) => {
    if (onHighlight) {
      onHighlight(repetition);
    }
  };

  if (repetitions.length === 0) {
    return (
      <Card title="Detected Repetitions">
        <div className="text-center text-gray-500 py-8">
          <svg
            className="w-12 h-12 mx-auto mb-4 text-gray-300"
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
          <p className="text-xs text-gray-400 mt-1">Your text looks good</p>
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
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        />
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto repetition-list">
        {repetitions.map(repetition => (
          <div
            key={repetition.id}
            className="repetition-item cursor-pointer p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group"
            onClick={() => handleRepetitionClick(repetition)}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className="w-4 h-4 rounded"
                style={{ backgroundColor: getColorForLevel(repetition.level) }}
              />
              <span className="text-xs font-medium text-gray-500">
                {repetition.count} times
              </span>
            </div>
            <p className="text-sm font-medium text-gray-900 truncate">
              &quot;{repetition.text}&quot;
            </p>
            <p className="text-xs text-gray-500 mt-1 capitalize">
              {repetition.level} level
              {repetition.paragraphCount &&
                repetition.paragraphCount > 1 &&
                ` (${repetition.paragraphCount} paragraphs)`}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default RepetitionList;
