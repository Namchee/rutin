import cronstrue from 'cronstrue';

import type { ScheduleFormat } from '@/types';

const Macros = {
  '@yearly': '0 0 1 1 *',
  '@annually': '0 0 1 1 *',
  '@monthly': '0 0 1 * *',
  '@weekly': '0 0 * * 0',
  '@daily': '0 0 * * *',
  '@midnight': '0 0 * * *',
  '@hourly': '0 * * * *',
};

export class UnixCRON {
  private constructor(private readonly expr: string) {}

  static parse(expr: string): UnixCRON | undefined {
    const tokens = expr.split(/\s+/);

    if (tokens.length !== 5) {
      return undefined;
    }
  }

  static validate(expr: string) {
    throw new Error('Invalid');
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
