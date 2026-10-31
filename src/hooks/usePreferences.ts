import { useCallback, useEffect, useSyncExternalStore } from 'react';

/**
 * Theme and editor typography, saved in localStorage and shared by every
 * component through one small store. The theme class itself is first set by
 * the inline script in _document, so the page never flashes the wrong theme.
 */

export type Theme = 'light' | 'dark' | 'system';
export type EditorFont = 'sans' | 'serif' | 'mono' | 'hyperlegible' | 'lexend';

export interface Preferences {
  theme: Theme;
  font: EditorFont;
  /** px */
  size: number;
  leading: number;
}

export const FONTS: Record<EditorFont, { label: string; stack: string }> = {
  sans: {
    label: 'Sans',
    stack: 'var(--font-inter), ui-sans-serif, system-ui, sans-serif',
  },
  serif: {
    label: 'Serif',
    stack: 'var(--font-serif), ui-serif, Georgia, serif',
  },
  mono: {
    label: 'Mono',
    stack: 'var(--font-jetbrains), ui-monospace, monospace',
  },
  hyperlegible: {
    label: 'Hyperlegible',
    stack: 'var(--font-atkinson), ui-sans-serif, system-ui, sans-serif',
  },
  lexend: {
    label: 'Lexend',
    stack: 'var(--font-lexend), ui-sans-serif, system-ui, sans-serif',
  },
};

export const SIZES = { min: 13, max: 26 };
export const LEADINGS = { min: 1.3, max: 2.2 };

export const PREFS_KEY = 'rs:prefs';

const defaults: Preferences = {
  theme: 'system',
  font: 'sans',
  size: 17,
  leading: 1.7,
};

let current = defaults;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === 'undefined') return;
  loaded = true;
  try {
    const saved = JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}');
    current = { ...defaults, ...saved };
    if (!(current.font in FONTS)) current.font = defaults.font;
  } catch {
    // unreadable or blocked storage: keep the defaults
  }
}

const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

const getSnapshot = () => {
  load();
  return current;
};

const darkQuery = () =>
  typeof window !== 'undefined'
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null;

export const resolveTheme = (theme: Theme): 'light' | 'dark' =>
  theme === 'system' ? (darkQuery()?.matches ? 'dark' : 'light') : theme;

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const dark = resolveTheme(theme) === 'dark';
  root.classList.toggle('dark', dark);
  root.style.colorScheme = dark ? 'dark' : 'light';
}

export function usePreferences() {
  const prefs = useSyncExternalStore(subscribe, getSnapshot, () => defaults);

  const update = useCallback((patch: Partial<Preferences>) => {
    current = { ...current, ...patch };
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(current));
    } catch {
      // private mode: preferences last for this visit only
    }
    listeners.forEach(fn => fn());
  }, []);

  // Keep <html> in step with the chosen theme, and with the system setting
  // while "system" is chosen.
  useEffect(() => {
    applyTheme(prefs.theme);
    if (prefs.theme !== 'system') return;
    const query = darkQuery();
    const onChange = () => applyTheme('system');
    query?.addEventListener('change', onChange);
    return () => query?.removeEventListener('change', onChange);
  }, [prefs.theme]);

  return { prefs, update };
}

/** Runs in <head> before first paint; keep in step with applyTheme. */
export const themeScript = `(function(){try{var t=(JSON.parse(localStorage.getItem('${PREFS_KEY}')||'{}').theme)||'system';var d=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);var r=document.documentElement;if(d)r.classList.add('dark');r.style.colorScheme=d?'dark':'light'}catch(e){}})()`;
