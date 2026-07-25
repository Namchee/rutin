/// <reference types="@solidjs/start/env" />

import type { Temporal as TemporalType } from '@js-temporal/polyfill';

type Theme = 'light' | 'dark' | 'system';

declare global {
  interface Window {
    THEME: Theme;
  }

  const Temporal: typeof TemporalType;
}
