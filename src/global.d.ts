/// <reference types="@solidjs/start/env" />

type Theme = 'light' | 'dark' | 'system';

declare global {
  interface Window {
    THEME: Theme;
  }

  const __COMMIT_SHA__: string;
}
