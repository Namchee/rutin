import cronstrue from 'cronstrue';
import type { ScheduleFormat } from '@/types';
import { createTokenValidator } from './shared';

const UnixCRON = {
  Macros: {
    '@yearly': '0 0 1 1 *',
    '@annually': '0 0 1 1 *',
    '@monthly': '0 0 1 * *',
    '@weekly': '0 0 * * 0',
    '@daily': '0 0 * * *',
    '@midnight': '0 0 * * *',
    '@hourly': '0 * * * *',
  },

  MonthToNumber: {
    jan: 1,
    feb: 2,
    mar: 3,
    apr: 4,
    may: 5,
    jun: 6,
    jul: 7,
    aug: 8,
    sep: 9,
    oct: 10,
    nov: 11,
    dec: 12,
  },

  DayToNumber: {
    sun: 0,
    mon: 1,
    tue: 2,
    wed: 3,
    thu: 4,
    fri: 5,
    sat: 6,
  },

  Validator: [
    createTokenValidator(/[^0-9*,\-/]/, 0, 59),
    createTokenValidator(/[^0-9*,\-/]/, 0, 23),
    createTokenValidator(/[^0-9*,\-/]/, 1, 31),
    createTokenValidator(/[^0-9*,\-/]/, 1, 12, (token: string): string => {
      const monthRegex = new RegExp(Object.keys(UnixCRON.MonthToNumber).join('|'), 'gi');
      return token.replace(monthRegex, matched =>
        UnixCRON.MonthToNumber[
          matched.toUpperCase() as keyof typeof UnixCRON.MonthToNumber
        ].toString(),
      );
    }),
    createTokenValidator(/[^0-9*,\-/]/, 0, 6, (token: string): string => {
      const dayRegex = new RegExp(Object.keys(UnixCRON.DayToNumber).join('|'), 'gi');
      return token.replace(dayRegex, matched =>
        UnixCRON.DayToNumber[matched.toUpperCase() as keyof typeof UnixCRON.DayToNumber].toString(),
      );
    }),
  ],

  *iterate(expr: string, start: Date) {
    const tokens = expr.split(/\s+/);

    // to be parsed, the expression must be complete
    if (tokens.length !== 5) {
      return undefined;
    }

    const ranges = {
      0: tokens[0]
    }

    yield;
  },
  validate(expr: string): { error: number[] } {
    const tokens = expr.split(/\s+/);
    const errorIdx: number[] = [];

    for (let idx = 0; idx < tokens.length; idx++) {
      if (!UnixCRON.Validator[idx](tokens[idx])) {
        errorIdx.push(idx);
      }
    }

    return { error: errorIdx };
  },
  isNonStandard(expr: string): boolean {
    const multiWhitespace = /[^\S ]|\s{2,}/;

    if (multiWhitespace.test(expr)) {
      return true;
    }

    return Object.keys(UnixCRON.Macros).includes(expr.trim());
  },
  normalize(expr: string): string {
    const normalExpr = expr.trim().replaceAll(/[^\S ]|\s{2,}/, ' ');

    return normalExpr in UnixCRON.Macros
      ? UnixCRON.Macros[normalExpr as keyof typeof UnixCRON.Macros]
      : normalExpr;
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
