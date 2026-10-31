import { usePreferences, type Theme } from '@/hooks/usePreferences';
import { MonitorIcon, MoonIcon, SunIcon } from './icons';

const OPTIONS: { value: Theme; label: string; Icon: typeof SunIcon }[] = [
  { value: 'light', label: 'Light theme', Icon: SunIcon },
  { value: 'system', label: 'Match system theme', Icon: MonitorIcon },
  { value: 'dark', label: 'Dark theme', Icon: MoonIcon },
];

const ThemeToggle: React.FC = () => {
  const { prefs, update } = usePreferences();

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="flex items-center gap-0.5 rounded-full border border-line bg-surface-2 p-1"
      onKeyDown={e => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault();
        const i = OPTIONS.findIndex(o => o.value === prefs.theme);
        const step = e.key === 'ArrowRight' ? 1 : -1;
        const next = OPTIONS[(i + step + OPTIONS.length) % OPTIONS.length];
        if (!next) return;
        update({ theme: next.value });
        (
          e.currentTarget.querySelector(
            `[data-theme-option="${next.value}"]`
          ) as HTMLElement | null
        )?.focus();
      }}
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = prefs.theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            tabIndex={active ? 0 : -1}
            data-theme-option={value}
            onClick={() => update({ theme: value })}
            className={`grid h-8 w-8 place-items-center rounded-full transition-colors ${
              active
                ? 'bg-surface text-accent shadow-sm'
                : 'text-muted hover:text-ink'
            }`}
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
};

export default ThemeToggle;
