interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  suffix?: string;
}

const SliderControl: React.FC<SliderControlProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  suffix = '',
}) => {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-ink-2">
        {label}:{' '}
        <span className="font-semibold text-accent">
          {value}
          {suffix}
        </span>
      </span>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full cursor-pointer"
      />
    </label>
  );
};

export default SliderControl;
