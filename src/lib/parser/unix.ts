import cronstrue from 'cronstrue';

import type { ScheduleFormat } from '@/types';
import { isValidRange } from './shared';

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

      if (isStep && !isValidStep()) {
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

export class UnixCRON {
  private constructor(private readonly expr: string) {}

  static parse(expr: string): UnixCRON | undefined {
    const tokens = expr.split(/\s+/);

    // to be parsed, the expression must be complete
    if (tokens.length !== 5) {
      return undefined;
    }
  }

  static validate(expr: string) {
    const tokens = expr;
  }

  static isNonStandard(expr: string): boolean {
    const multiWhitespace = /[^\S ]|\s{2,}/;

    if (multiWhitespace.test(expr)) {
      return true;
    }

    return Object.keys(Macros).includes(expr.trim());
  }

  static normalize(expr: string): string {
    const normalExpr = expr.trim().replaceAll(/[^\S ]|\s{2,}/, ' ');

    return normalExpr in Macros ? Macros[normalExpr as keyof typeof Macros] : normalExpr;
  }

  static convert(expr: string, format: ScheduleFormat): string {
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
  }

  toString(): string {
    return cronstrue.toString(this.expr);
  }
}
