interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  suffix?: string;
}

const SliderControl: React.FC<SliderControlProps> = ({
  label,
  value,
  min,
  max,
  onChange,
  suffix = '',
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}:{' '}
        <span className="font-bold text-blue-600">
          {value}
          {suffix}
        </span>
      </label>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb"
      />
    </div>
  );
};

export default SliderControl;
