import cronstrue from 'cronstrue';
import type { ScheduleFormat } from '@/types';
import { createTokenValidator, getNumericRange } from './shared';

export const UnixCRON = {
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
    createTokenValidator(/[^0-9*,\-L?/]/i, 1, 31),
    createTokenValidator(/[^0-9*,\-/]/, 1, 12, (token: string): string => {
      const monthRegex = new RegExp(Object.keys(UnixCRON.MonthToNumber).join('|'), 'gi');
      return token.replace(monthRegex, matched =>
        UnixCRON.MonthToNumber[
          matched.toUpperCase() as keyof typeof UnixCRON.MonthToNumber
        ].toString(),
      );
    }),
    createTokenValidator(/[^0-9*,\-/LW?#]/i, 0, 6, (token: string): string => {
      const dayRegex = new RegExp(Object.keys(UnixCRON.DayToNumber).join('|'), 'gi');
      return token.replace(dayRegex, matched =>
        UnixCRON.DayToNumber[matched.toUpperCase() as keyof typeof UnixCRON.DayToNumber].toString(),
      );
    }),
  ],
  *iterate(expr: string, start: Date) {
    const tokens = UnixCRON.normalize(expr).trim().split(/\s+/);

    // to be parsed, the expression must be complete
    if (tokens.length !== 5) {
      return undefined;
    }

    const ranges = [
      getNumericRange(tokens[0], 0, 59),
      getNumericRange(tokens[1], 1, 23),
      getNumericRange(tokens[2], 1, 31),
      getNumericRange(tokens[3], 1, 12),
      getNumericRange(tokens[4], 0, 6),
    ];

    const isDomWild = tokens[2] === '*';
    const isDowWild = tokens[4] === '*';

    const curr = new Date(start.getTime());
    curr.setSeconds(0);

    curr.setMinutes(curr.getMinutes() + 1);

    while (true) {
      if (!ranges[3].includes(curr.getMonth() + 1)) {
        const nextMonth = ranges[3].find(m => m > curr.getMonth() + 1) || ranges[3][0];
        if (nextMonth <= curr.getMonth() + 1) curr.setFullYear(curr.getFullYear() + 1);

        curr.setMonth(nextMonth - 1, 1); // Reset to 1st of month
        curr.setHours(0, 0, 0);
        continue;
      }

      const domMatch = ranges[2].includes(curr.getDate());
      const dowMatch = ranges[4].includes(curr.getDay());
      const dateValid = isDomWild || isDowWild ? domMatch && dowMatch : domMatch || dowMatch;

      if (!dateValid) {
        curr.setDate(curr.getDate() + 1);
        curr.setHours(0, 0, 0);
        continue;
      }

      if (!ranges[1].includes(curr.getHours())) {
        const nextHour = ranges[1].find(h => h > curr.getHours()) || ranges[1][0];
        if (nextHour <= curr.getHours()) curr.setDate(curr.getDate() + 1);

        curr.setHours(nextHour, 0, 0);
        continue;
      }

      if (!ranges[0].includes(curr.getMinutes())) {
        const nextMin = ranges[0].find(m => m > curr.getMinutes()) || ranges[0][0];
        if (nextMin <= curr.getMinutes()) curr.setHours(curr.getHours() + 1);

        curr.setMinutes(nextMin, 0);
        continue;
      }

      yield new Date(curr.getTime());

      // Prepare for next iteration
      curr.setMinutes(curr.getMinutes() + 1);
    }
  },
  validate(expr: string): { error: number[]; isComplete: boolean } {
    const tokens = UnixCRON.normalize(expr).trim().split(/\s+/).filter(Boolean);
    const errorIdx: number[] = [];

    if (expr.startsWith('@')) {
      // skip validation, maybe a macro
      return { error: [], isComplete: expr.trim() in UnixCRON.Macros };
    }

    for (let idx = 0; idx < tokens.length; idx++) {
      if (!UnixCRON.Validator[idx](tokens[idx])) {
        errorIdx.push(idx);
      }
    }

    return { error: errorIdx, isComplete: tokens.length === 5 };
  },
  isNonStandard(expr: string): boolean {
    const multiWhitespace = /[^\S ]|\s{2,}/;

    if (multiWhitespace.test(expr)) {
      return true;
    }

    return Object.keys(UnixCRON.Macros).includes(expr.trim());
  },
  normalize(expr: string): string {
    const normalExpr = expr.trim().replaceAll(/[^\S ]|\s{2,}/g, ' ');

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
    return cronstrue.toString(UnixCRON.normalize(expr));
  },
};
