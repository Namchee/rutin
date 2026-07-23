import cronstrue from 'cronstrue';
import type { ScheduleFormat } from '@/types';
import type { ScheduleParser } from './base';
import { createTokenValidator, getNumericRange } from './shared';

const DayToNumber = {
  fri: 5,
  mon: 1,
  sat: 6,
  sun: 0,
  thu: 4,
  tue: 2,
  wed: 3,
};

const MonthToNumber = {
  apr: 4,
  aug: 8,
  dec: 12,
  feb: 2,
  jan: 1,
  jul: 7,
  jun: 6,
  mar: 3,
  may: 5,
  nov: 11,
  oct: 10,
  sep: 9,
};

const Validator = [
  createTokenValidator(/[^0-9*,\-/]/, 0, 59),
  createTokenValidator(/[^0-9*,\-/]/, 0, 23),
  createTokenValidator(/[^0-9*,\-LW#?/]/i, 1, 31),
  createTokenValidator(/[^0-9*,\-/]/, 1, 12, (token: string): string => {
    const monthRegex = new RegExp(Object.keys(MonthToNumber).join('|'), 'gi');
    return token.replace(monthRegex, matched =>
      MonthToNumber[matched.toUpperCase() as keyof typeof MonthToNumber].toString(),
    );
  }),
  createTokenValidator(/[^0-9*,\-LW?#]/i, 0, 6, (token: string): string => {
    const dayRegex = new RegExp(Object.keys(DayToNumber).join('|'), 'gi');
    return token.replace(dayRegex, matched =>
      DayToNumber[matched.toUpperCase() as keyof typeof DayToNumber].toString(),
    );
  }),
];

const Macros: Record<string, string> = {
  '@annually': '0 0 1 1 *',
  '@daily': '0 0 * * *',
  '@hourly': '0 * * * *',
  '@midnight': '0 0 * * *',
  '@monthly': '0 0 1 * *',
  '@weekly': '0 0 * * 0',
  '@yearly': '0 0 1 1 *',
};

function isNormal(expr: string): boolean {
  const multiWhitespace = /[^\S ]|\s{2,}/;

  if (multiWhitespace.test(expr)) {
    return true;
  }

  return Object.keys(Macros).includes(expr.trim());
}

function* iterate(expr: string, start: Date) {
  const tokens = POSIXParser.normalize(expr).trim().split(/\s+/);

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
}

export const POSIXParser = {
  convert(expr: string, format: ScheduleFormat): string {
    switch (format) {
      case 'posix': {
        return POSIXParser.normalize(expr);
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

  normalize(expr: string): string {
    const normalExpr = expr.trim().replaceAll(/[^\S ]|\s{2,}/g, ' ');

    return normalExpr in Macros ? Macros[normalExpr as keyof typeof Macros] : normalExpr;
  },

  validate(expr: string): ReturnType<ScheduleParser['validate']> {
    const trimmedExpr = expr.trim();

    // handle macro validation
    if (expr.startsWith('@')) {
      // it's complete
      if (trimmedExpr in Macros) {
        return {
          descriptor: cronstrue.toString(POSIXParser.normalize(expr)),
          iterator: iterate(Macros[trimmedExpr], new Date()),
          normal: false,
          status: 'valid',
          tokens: Macros[trimmedExpr].split(' '),
        };
      }

      let mightBeValid = false;
      for (const macro of Object.keys(Macros)) {
        if (macro.startsWith(expr)) {
          mightBeValid = true;
          break;
        }
      }

      if (!mightBeValid) {
        return {
          error: [],
          normal: true, // do not attempt to normalize
          status: 'invalid',
        };
      }

      return {
        normal: true, // do not attempt to normalize
        status: 'incomplete',
      };
    }

    const tokens = POSIXParser.normalize(trimmedExpr).split(/\s+/).filter(Boolean);
    if (tokens.length < 5) {
      return {
        normal: isNormal(expr),
        status: 'incomplete',
      };
    }

    const error: number[] = [];

    for (let idx = 0; idx < tokens.length; idx++) {
      if (!Validator[idx](tokens[idx])) {
        error.push(idx);
      }
    }

    if (error.length > 0) {
      return {
        error,
        normal: isNormal(trimmedExpr),
        status: 'invalid',
      };
    }

    return {
      descriptor: cronstrue.toString(POSIXParser.normalize(expr)),
      iterator: iterate(trimmedExpr, new Date()),
      normal: isNormal(trimmedExpr),
      status: 'valid',
      tokens: trimmedExpr.split('\\s+'),
    };
  },
};
