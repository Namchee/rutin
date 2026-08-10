/// <reference types="@solidjs/start/env" />

import type { Temporal as TemporalType } from '@js-temporal/polyfill';

type Theme = 'light' | 'dark' | 'system';

declare global {
  interface Window {
    THEME: Theme;
  }

  interface ImportMetaEnv {
    readonly VITE_USER_ID: string;
    readonly VITE_PUBLIC_ENDPOINT: string;
    readonly CF_PAGES_COMMIT_SHA: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }

  const Temporal: typeof TemporalType;
}
