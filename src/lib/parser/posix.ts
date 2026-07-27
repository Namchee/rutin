import { Temporal } from '@js-temporal/polyfill';

import cronstrue from 'cronstrue';
import type { ScheduleFormat } from '@/types';

import type { ScheduleParser } from './base';
import { createTokenValidator, getNumericRange } from './shared';

const YEAR_LIMIT = 10;

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
    return false;
  }

  const tokens = expr.trim().split(/\s+/);

  // check whether the month is numeric
  if (tokens.length >= 4) {
    const target = tokens[3];

    // range check
    const range = target.split('-');
    if (range.length === 2 && range.some(s => s.toLowerCase() in DayToNumber)) {
      return false;
    }

    // plural check
    const plurals = target.split(',');
    if (plurals.length > 1 && plurals.some(p => p.toLowerCase() in DayToNumber)) {
      return false;
    }

    if (target.toLowerCase() in DayToNumber) {
      return false;
    }
  }

  // check whether the day is numeric
  if (tokens.length >= 5) {
    const target = tokens[4];

    // range check
    const range = target.split('-');
    if (range.length === 2 && range.some(s => s.toLowerCase() in DayToNumber)) {
      return false;
    }

    // plural check
    const plurals = target.split(',');
    if (plurals.length > 1 && plurals.some(p => p.toLowerCase() in DayToNumber)) {
      return false;
    }

    if (target.toLowerCase() in DayToNumber) {
      return false;
    }
  }

  return Object.keys(Macros).includes(expr.trim());
}

function nextMatch(
  curr: Temporal.PlainDateTime,
  ranges: number[][],
  isDomWild: boolean,
  isDowWild: boolean,
): Temporal.PlainDateTime | null {
  const limit = curr.add({ years: YEAR_LIMIT });

  while (Temporal.PlainDateTime.compare(curr, limit) <= 0) {
    if (!ranges[3].includes(curr.month)) {
      const nextMonth = ranges[3].find(m => m > curr.month) ?? ranges[3][0];
      const year = nextMonth <= curr.month ? curr.year + 1 : curr.year;
      curr = curr.with({ day: 1, hour: 0, minute: 0, month: nextMonth, second: 0, year });

      continue;
    }

    const domMatch = ranges[2].includes(curr.day);
    const dowMatch = ranges[4].includes(curr.dayOfWeek % 7);
    const dateValid = isDomWild || isDowWild ? domMatch && dowMatch : domMatch || dowMatch;
    if (!dateValid) {
      curr = curr.add({ days: 1 }).with({ hour: 0, minute: 0, second: 0 });
      continue;
    }

    if (!ranges[1].includes(curr.hour)) {
      const nextHour = ranges[1].find(h => h > curr.hour) ?? ranges[1][0];
      curr = (nextHour <= curr.hour ? curr.add({ days: 1 }) : curr).with({
        hour: nextHour,
        minute: 0,
        second: 0,
      });

      continue;
    }

    if (!ranges[0].includes(curr.minute)) {
      const nextMin = ranges[0].find(m => m > curr.minute) ?? ranges[0][0];
      curr = (nextMin <= curr.minute ? curr.add({ hours: 1 }) : curr).with({
        minute: nextMin,
        second: 0,
      });
      continue;
    }

    return curr;
  }

  return null;
}

function* iterate(expr: string, start: Temporal.PlainDateTime) {
  const tokens = POSIXParser.normalize(expr).trim().split(/\s+/);

  // to be parsed, the expression must be complete
  if (tokens.length !== 5) {
    return undefined;
  }

  const ranges = [
    getNumericRange(tokens[0], 0, 59),
    getNumericRange(tokens[1], 0, 23),
    getNumericRange(tokens[2], 1, 31),
    getNumericRange(tokens[3], 1, 12),
    getNumericRange(tokens[4], 0, 6),
  ];

  const isDomWild = tokens[2] === '*';
  const isDowWild = tokens[4] === '*';

  const curr = start
    .with({ microsecond: 0, millisecond: 0, nanosecond: 0, second: 0 })
    .add({ minutes: 1 });

  let next = nextMatch(curr, ranges, isDomWild, isDowWild);
  while (next !== null) {
    yield next;
    next = nextMatch(next.add({ minutes: 1 }), ranges, isDomWild, isDowWild);
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

  hasMacro: true,

  normalize(expr: string): string {
    const normalExpr = expr.trim();
    if (normalExpr in Macros) {
      return Macros[normalExpr as keyof typeof Macros];
    }

    const tokens = normalExpr.split(/\s+/);
    if (tokens.length >= 4) {
      const pattern = Object.keys(MonthToNumber).join('|');
      const regex = new RegExp(`\\b(${pattern})\\b`, 'gi');

      const result = tokens[3].replace(regex, (match) => MonthToNumber[match.toLowerCase() as keyof typeof MonthToNumber].toString());

      tokens[3] = result;
    }

    if (tokens.length >= 5) {
      const pattern = Object.keys(DayToNumber).join('|');
      const regex = new RegExp(`\\b(${pattern})\\b`, 'gi');

      const result = tokens[4].replace(regex, (match) => DayToNumber[match.toLowerCase() as keyof typeof DayToNumber].toString());

      tokens[4] = result;
    }

    return tokens.join(' ');
  },

  validate(expr: string): ReturnType<ScheduleParser['validate']> {
    const trimmedExpr = expr.trim();

    // handle macro validation
    if (expr.startsWith('@')) {
      // it's complete
      if (trimmedExpr in Macros) {
        return {
          descriptor: cronstrue.toString(POSIXParser.normalize(expr)),
          generator: iterate(Macros[trimmedExpr], Temporal.Now.plainDateTimeISO()),
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
          tokens: [],
        };
      }

      return {
        error: [],
        normal: true, // do not attempt to normalize
        status: 'incomplete',
        tokens: [],
      };
    }

    const tokens = POSIXParser.normalize(trimmedExpr).split(/\s+/).filter(Boolean);
    const error: number[] = [];

    for (let idx = 0; idx < tokens.length && idx < 5; idx++) {
      if (!Validator[idx](tokens[idx])) {
        error.push(idx);
      }
    }

    if (error.length > 0) {
      return {
        error,
        normal: isNormal(trimmedExpr),
        status: 'invalid',
        tokens,
      };
    }

    if (tokens.length < 5) {
      return {
        error: [],
        normal: isNormal(trimmedExpr),
        status: 'incomplete',
        tokens,
      };
    }

    if (tokens.length > 5) {
      return {
        error: [],
        normal: isNormal(trimmedExpr),
        status: 'invalid',
        tokens,
      }
    }

    return {
      descriptor: cronstrue.toString(POSIXParser.normalize(expr)),
      generator: iterate(trimmedExpr, Temporal.Now.plainDateTimeISO()),
      normal: isNormal(trimmedExpr),
      status: 'valid',
      tokens,
    };
  },
};
