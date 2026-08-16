/// <reference types="@solidjs/start/env" />

export { };

type Theme = 'light' | 'dark' | 'system';

declare global {
  interface Window {
    THEME: Theme;
  }

  const __COMMIT_SHA__: string;

  const Temporal: typeof import('temporal-polyfill').Temporal;
  namespace Temporal {
    type PlainDateTime = import('temporal-polyfill').Temporal.PlainDateTime;
    type Instant = import('temporal-polyfill').Temporal.Instant;
    type ZonedDateTime = import('temporal-polyfill').Temporal.ZonedDateTime;
    type Duration = import('temporal-polyfill').Temporal.Duration;
  }
}
