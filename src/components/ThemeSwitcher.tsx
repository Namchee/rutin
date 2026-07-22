import { createEffect, createSignal } from 'solid-js';

import { getRequestEvent, isServer } from 'solid-js/web';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/ToggleGroup';
import type { Theme } from '@/types/theme';

const CookieAge = 365 * 24 * 60 * 60; // 1 Year

function getCookieFromHeader(cookieString: string, name: string): string {
  const regex = new RegExp(`(?:^|; )${name}=([^;]*)`);
  const match = cookieString.match(regex);

  return match ? decodeURIComponent(match[1]) : '';
}

function getTheme(): Theme {
  const source = isServer
    ? (getRequestEvent()?.request.headers.get('cookie') ?? '')
    : document.cookie;

  return (getCookieFromHeader(source, 'theme') as Theme) || 'system';
}

function setThemeToCookie(theme: Theme) {
  // biome-ignore lint: it's simple enough
  document.cookie = `theme=${theme};max-age=${CookieAge};path=/`;
}

export function ThemeSwitcher() {
  const [theme, setTheme] = createSignal(getTheme());

  createEffect(() => {
    const root = document.documentElement;

    const resolvedTheme = theme();

    switch (resolvedTheme) {
      case 'light': {
        root.classList.remove('dark');
        setThemeToCookie('light');

        break;
      }
      case 'dark': {
        root.classList.add('dark');
        setThemeToCookie('dark');

        break;
      }
      default: {
        const actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
        if (actualTheme === 'dark') {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
        setThemeToCookie('system');

        break;
      }
    }
  });

  return (
    <ToggleGroup
      value={[theme()]}
      onValueChange={e => setTheme(e.value[0] as unknown as Theme)}
      class="inset-shadow h-6 gap-[2px] rounded-md border border-separator bg-background-hover px-[1px]">
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
