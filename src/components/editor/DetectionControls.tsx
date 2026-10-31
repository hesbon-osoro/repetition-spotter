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

// Full class names, so Tailwind can find them when it scans the source.
const levels: {
  key: DetectionLevel;
  label: string;
  idle: string;
  active: string;
}[] = [
  {
    key: 'paragraph',
    label: '📄 Paragraphs',
    idle: 'bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20',
    active:
      'bg-red-100 text-red-800 border-red-300 dark:bg-red-500/25 dark:text-red-200 dark:border-red-400/60',
  },
  {
    key: 'sentence',
    label: '📝 Sentences',
    idle: 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/20',
    active:
      'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/25 dark:text-amber-200 dark:border-amber-400/60',
  },
  {
    key: 'phrase',
    label: '🔤 Phrases',
    idle: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20',
    active:
      'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/25 dark:text-emerald-200 dark:border-emerald-400/60',
  },
  {
    key: 'word',
    label: '🔤 Words',
    idle: 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-300 dark:hover:bg-blue-500/20',
    active:
      'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-500/25 dark:text-blue-200 dark:border-blue-400/60',
  },
];

const checks: { key: keyof AnalysisOptions; label: string }[] = [
  { key: 'semanticSimilarity', label: '🧠 Semantic Similarity' },
  { key: 'ignoreCase', label: '🔤 Ignore Case' },
  { key: 'ignorePunctuation', label: '📝 Ignore Punctuation' },
];

const DetectionControls: React.FC<DetectionControlsProps> = ({
  detectionLevel,
  setDetectionLevel,
  options,
  updateOption,
}) => {
  return (
    <Card title="Detection Levels & Advanced Options" className="mb-6">
      <div
        className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4"
        role="radiogroup"
        aria-label="Detection level"
      >
        {levels.map(({ key, label, idle, active }) => {
          const isActive = detectionLevel === key;
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={isActive}
              className={`rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? `${active} scale-[1.03] shadow-md`
                  : `${idle} border-transparent`
              }`}
              onClick={() => setDetectionLevel(key)}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="border-t border-line pt-4">
        <h4 className="mb-3 text-sm font-semibold text-ink-2">
          Advanced Detection
        </h4>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {checks.map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={Boolean(options[key])}
                onChange={e => updateOption(key, e.target.checked)}
                className="h-4 w-4 rounded"
              />
              <span className="text-sm text-ink-2">{label}</span>
            </label>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default DetectionControls;
