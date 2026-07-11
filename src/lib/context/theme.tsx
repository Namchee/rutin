import {
  type Accessor,
  createContext,
  createEffect,
  createSignal,
  type JSXElement,
  type Setter,
  useContext,
} from 'solid-js';

import type { Theme } from '@/types/theme';

export const ThemeContext = createContext<{ theme: Accessor<Theme>; setTheme: Setter<Theme> }>();

export function ThemeContextProvider(props: { children: JSXElement }) {
  const getTheme = (): Theme => {
    if (typeof window !== 'undefined') {
      return (window.THEME as Theme) || (localStorage.getItem('theme') as Theme) || 'system';
    }

    return 'system';
  };

  const [theme, setTheme] = createSignal<Theme>(getTheme());

  createEffect(() => {
    const root = document.documentElement;

    const resolvedTheme = theme();

    switch (resolvedTheme) {
      case 'light': {
        root.style.colorScheme = 'light';
        localStorage.setItem('theme', 'light');

        break;
      }
      case 'dark': {
        root.style.colorScheme = 'dark';
        localStorage.setItem('theme', 'dark');

        break;
      }
      default: {
        const actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
        root.style.colorScheme = actualTheme ? 'dark' : 'light';

        localStorage.setItem('theme', 'system');
      }
    }
  });

  return (
    <ThemeContext.Provider value={{ setTheme, theme }}>{props.children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const store = useContext(ThemeContext);
  if (!store) {
    throw new Error('useTheme must be used within ThemeContextProvider');
  }

  return store;
}
