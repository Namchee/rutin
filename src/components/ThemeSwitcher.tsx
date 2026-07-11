import { createEffect, createSignal } from 'solid-js';
import { ToggleGroup, ToggleGroupItem } from './ui/ToggleGroup';

type Theme = 'light' | 'dark' | 'system';

const initializeTheme = () => {
  let theme: Theme = 'system';

  if (typeof localStorage !== 'undefined' && localStorage.getItem('theme')) {
    theme = localStorage.getItem('theme') as Theme;
  }

  return theme;
};

export function ThemeSwitcher() {
  const [theme, setTheme] = createSignal<Theme>(initializeTheme());

  createEffect(() => {
    const root = document.documentElement;

    localStorage.setItem('theme', theme());
    switch (theme()) {
      case 'light': {
        root.style.colorScheme = 'light';
        break;
      }
      case 'dark': {
        root.style.colorScheme = 'dark';
        break;
      }
      default: {
        const isDarkPreferred = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.style.colorScheme = isDarkPreferred ? 'dark' : 'light';
      }
    }
  });

  return (
    <ToggleGroup
      defaultValue={[theme()]}
      onValueChange={(e) => setTheme(e.value as unknown as Theme)}
      class="inset-shadow h-6 gap-[2px] rounded-md border border-separator bg-foreground px-[1px]">
      <ToggleGroupItem value="light" class="size-5 rounded p-0" aria-label="Switch to light theme">
        <div class="i-lucide-sun size-[14px]" />
      </ToggleGroupItem>

      <ToggleGroupItem value="dark" class="size-5 rounded p-0" aria-label="Switch to dark theme">
        <div class="i-lucide-moon size-[14px]" />
      </ToggleGroupItem>

      <ToggleGroupItem value="system" class="size-5 rounded p-0" aria-label="Use system theme">
        <div class="i-lucide-monitor size-[14px]" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
