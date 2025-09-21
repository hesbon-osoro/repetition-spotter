import { AnalysisOptions } from '@/types';
import Button from '../ui/Button';
import SliderControl from './SliderControl';

interface ToolbarProps {
  onAnalyze: () => void;
  onClearHighlights: () => void;
  onClearText: () => void;
  options: AnalysisOptions;
  updateOption: (
    key: keyof AnalysisOptions,
    value: AnalysisOptions[keyof AnalysisOptions]
  ) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  onAnalyze,
  onClearHighlights,
  onClearText,
  options,
  updateOption,
}) => {
  return (
    <div className="p-6 border-b border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">WYSIWYG Editor</h2>
        <div className="flex items-center space-x-4">
          <Button onClick={onClearHighlights} variant="secondary" size="sm">
            Clear Highlights
          </Button>
          <Button onClick={onClearText} variant="secondary" size="sm">
            Clear Text
          </Button>
          <Button onClick={onAnalyze} variant="primary" size="sm">
            🔍 Analyze
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SliderControl
          label="Minimum Length"
          value={options.minLength}
          min={1}
          max={20}
          onChange={value => updateOption('minLength', value)}
          suffix="words"
        />
        <SliderControl
          label="Similarity Threshold"
          value={options.similarityThreshold}
          min={50}
          max={100}
          onChange={value => updateOption('similarityThreshold', value)}
          suffix="%"
        />
      </div>
    </div>
  );
};

export default Toolbar;
