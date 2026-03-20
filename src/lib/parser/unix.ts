import cronstrue from 'cronstrue';

import type { ScheduleFormat } from '@/types';
import { isValidRange, isValidStep } from './shared';

const Macros = {
  '@yearly': '0 0 1 1 *',
  '@annually': '0 0 1 1 *',
  '@monthly': '0 0 1 * *',
  '@weekly': '0 0 * * 0',
  '@daily': '0 0 * * *',
  '@midnight': '0 0 * * *',
  '@hourly': '0 * * * *',
};

const Validator: ((token: string) => boolean)[] = [
  token => {
    const badToken = /[^0-9*,\-/]/.test(token);
    if (badToken) {
      return false;
    }

    const subToken = token.split(',');

    for (const t of subToken) {
      const isRange = t.includes('-');

      if (isRange && !isValidRange(t, 0, 59)) {
        return false;
      }

      const isStep = t.includes('/');

      if (isStep && !isValidStep(t, 0, 59)) {
        return false;
      }

      const singular = Number(t);

      if (Number.isNaN(singular)) {
        return false;
      }

      if (singular < 0 || singular > 59) {
        return false;
      }
    }

    return true;
  },
];

const UnixCRON = {
  *parse(expr: string) {
    const tokens = expr.split(/\s+/);

    // to be parsed, the expression must be complete
    if (tokens.length !== 5) {
      return undefined;
    }

    yield;
  },
  validate(expr: string): boolean {
    const tokens = expr;
  },
  isNonStandard(expr: string): boolean {
    const multiWhitespace = /[^\S ]|\s{2,}/;

    if (multiWhitespace.test(expr)) {
      return true;
    }

    return Object.keys(Macros).includes(expr.trim());
  },
  normalize(expr: string): string {
    const normalExpr = expr.trim().replaceAll(/[^\S ]|\s{2,}/, ' ');

    return normalExpr in Macros ? Macros[normalExpr as keyof typeof Macros] : normalExpr;
  },
  convert(expr: string, format: ScheduleFormat): string {
    switch (format) {
      case 'unix': {
        return UnixCRON.normalize(expr);
      }

      case 'quartz': {
        const tokens = expr.split(/\s+/);

        // complete
        if (tokens.length === 7) {
          return tokens.slice(1, 6).join(' ');
        }

        // syntax without year
        if (tokens.length === 6) {
          return tokens.slice(1).join(' ');
        }

        return '';
      }

      case 'systemd': {
        return '';
      }

      default: {
        throw new Error('Unsupported scheduling format');
      }
    }
  },
  toString(expr: string): string {
    return cronstrue.toString(expr);
  },
};
