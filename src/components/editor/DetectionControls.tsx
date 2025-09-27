import { DetectionLevel, AnalysisOptions } from '@/types';
import Card from '../ui/Card';

interface DetectionControlsProps {
  detectionLevel: DetectionLevel;
  setDetectionLevel: (level: DetectionLevel) => void;
  options: AnalysisOptions;
  updateOption: (
    key: keyof AnalysisOptions,
    value: AnalysisOptions[keyof AnalysisOptions]
  ) => void;
}

const DetectionControls: React.FC<DetectionControlsProps> = ({
  detectionLevel,
  setDetectionLevel,
  options,
  updateOption,
}) => {
  const levels = [
    { key: 'paragraph', label: '📄 Paragraphs', color: 'red' },
    { key: 'sentence', label: '📝 Sentences', color: 'yellow' },
    { key: 'phrase', label: '🔤 Phrases', color: 'green' },
    { key: 'word', label: '🔤 Words', color: 'blue' },
  ] as const;

  const getButtonClass = (level: string, color: string) => {
    const isActive = detectionLevel === level;
    const baseClass = `detection-level-btn px-4 py-3 rounded-lg font-medium transition-colors`;
    const colorClass = isActive
      ? `bg-${color}-100 text-${color}-800 border-2 border-${color}-300`
      : `bg-${color}-50 hover:bg-${color}-100 text-${color}-700`;

    return `${baseClass} ${colorClass} ${isActive ? 'active' : ''}`;
  };

  return (
    <Card title="Detection Levels & Advanced Options" className="mb-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {levels.map(({ key, label, color }) => (
          <button
            key={key}
            className={getButtonClass(key, color)}
            onClick={() => setDetectionLevel(key as DetectionLevel)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="border-t border-gray-200 pt-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">
          Advanced Detection
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={options.semanticSimilarity}
              onChange={e =>
                updateOption('semanticSimilarity', e.target.checked)
              }
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              🧠 Semantic Similarity
            </span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={options.ignoreCase}
              onChange={e => updateOption('ignoreCase', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">🔤 Ignore Case</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={options.ignorePunctuation}
              onChange={e =>
                updateOption('ignorePunctuation', e.target.checked)
              }
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">📝 Ignore Punctuation</span>
          </label>
        </div>
      </div>
    </Card>
  );
};

export default DetectionControls;
