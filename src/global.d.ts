/// <reference types="@solidjs/start/env" />

export {}

type Theme = 'light' | 'dark' | 'system';

declare global {
  interface Window { THEME: Theme }
}
