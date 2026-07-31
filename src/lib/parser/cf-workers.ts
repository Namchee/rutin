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
  sun: 7,
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
  createTokenValidator(/[^0-9*,\-/LW]/i, 1, 31),
  createTokenValidator(/[^0-9*,\-/]/, 1, 12, (token: string): string => {
    const monthRegex = new RegExp(Object.keys(MonthToNumber).join('|'), 'gi');
    return token.replace(monthRegex, matched =>
      MonthToNumber[matched.toLowerCase() as keyof typeof MonthToNumber].toString(),
    );
  }),
  createTokenValidator(/[^0-9*,\-/L#]/i, 1, 7, (token: string): string => {
    const dayRegex = new RegExp(Object.keys(DayToNumber).join('|'), 'gi');
    return token.replace(dayRegex, matched =>
      DayToNumber[matched.toLowerCase() as keyof typeof DayToNumber].toString(),
    );
  }),
];

const Fields = [
  { max: 59, min: 0 },
  { max: 23, min: 0 },
  { max: 31, min: 1 },
  { aliases: MonthToNumber, max: 12, min: 1 },
  { aliases: DayToNumber, max: 6, min: 0 },
] as const;

function collapseExpressions(token: string, field: (typeof Fields)[number]): string {
  const { max, min } = field;
  const aliases = 'aliases' in field ? field.aliases : undefined;

  let t = token;

  // names -> numbers
  if (aliases) {
    const regex = new RegExp(`(${Object.keys(aliases).join('|')})`, 'gi');
    t = t.replace(regex, m => String(aliases[m.toLowerCase() as keyof typeof aliases]));
  }

  // token -> value set
  const hasStep = t.includes('/');
  let values: number[];
  try {
    values = getNumericRange(t, min, max);
  } catch {
    return t;
  }

  if (values.length === max - min + 1) {
    return '*';
  }

  if (hasStep) {
    return t;
  }

  // Find shortest equivalent form
  const parts: string[] = [];
  for (let i = 0; i < values.length;) {
    let j = i;
    while (j + 1 < values.length && values[j + 1] === values[j] + 1) {
      j++;
    }

    if (j - i >= 2) {
      parts.push(`${values[i]}-${values[j]}`);
    } else {
      for (let k = i; k <= j; k++) {
        parts.push(String(values[k]));
      }
    }

    i = j + 1;
  }

  return parts.join(',');
}

function daysInMonth(year: number, month: number): number {
  return new Temporal.PlainDate(year, month, 1).add({ months: 1 }).subtract({ days: 1 }).day;
}

function dayOfWeekFor(year: number, month: number, day: number): number {
  return Temporal.PlainDate.from({ day, month, year }).dayOfWeek;
}

function nearestWeekdayToDay(year: number, month: number, target: number): number {
  const day = Math.min(target, daysInMonth(year, month));
  const dow = dayOfWeekFor(year, month, day);
  if (dow === 6) {
    // Saturday -> Friday
    return day === 1 ? 3 : day - 1;
  }
  if (dow === 7) {
    // Sunday -> Monday
    const last = daysInMonth(year, month);
    return day === last ? day - 2 : day + 1;
  }
  return day;
}

function lastWeekdayOfMonth(year: number, month: number): number {
  const last = daysInMonth(year, month);
  const dow = dayOfWeekFor(year, month, last);
  if (dow === 6) {
    return last - 1;
  }
  if (dow === 7) {
    return last - 2;
  }
  return last;
}

function nthDayOfWeekInMonth(year: number, month: number, dow: number, n: number): number | null {
  let count = 0;
  const last = daysInMonth(year, month);
  for (let d = 1; d <= last; d++) {
    if (dayOfWeekFor(year, month, d) === dow) {
      count++;
      if (count === n) return d;
    }
  }

  return null;
}

function lastDayOfWeekInMonth(year: number, month: number, dow: number): number {
  const last = daysInMonth(year, month);
  for (let d = last; d >= 1; d--) {
    if (dayOfWeekFor(year, month, d) === dow) {
      return d;
    }
  }
  return last;
}

type DayMatcher = (year: number, month: number, day: number) => boolean;

function compileDOMToken(token: string): DayMatcher | null {
  if (token === 'L') {
    return (y, m, d) => d === daysInMonth(y, m);
  }

  if (token === 'LW') {
    return (y, m, d) => d === lastWeekdayOfMonth(y, m);
  }

  const w = /^(\d+)W$/.exec(token);
  if (w) {
    const target = Number(w[1]);
    return (y, m, d) => d === nearestWeekdayToDay(y, m, target);
  }

  const lx = /^L-(\d+)$/.exec(token);
  if (lx) {
    const n = Number(lx[1]);
    return (y, m, d) => {
      const target = daysInMonth(y, m) - n;
      return d === target && target >= 1;
    };
  }

  return null;
}

function compileDOWToken(token: string): DayMatcher | null {
  // 1=Mon..7=Sun
  if (token === 'L') {
    return (y, m, d) => dayOfWeekFor(y, m, d) === 6;
  }
  const l = /^(\d+)L$/.exec(token);
  if (l) {
    const dow = Number(l[1]);
    return (y, m, d) => d === lastDayOfWeekInMonth(y, m, dow);
  }
  const w = /^(\d+)W$/.exec(token);
  if (w) {
    const target = Number(w[1]);
    return (y, m, d) => d === nearestWeekdayToDay(y, m, target);
  }
  const hash = /^(\d+)#(\d+)$/.exec(token);
  if (hash) {
    const dow = Number(hash[1]);
    const n = Number(hash[2]);
    return (y, m, d) => d === nthDayOfWeekInMonth(y, m, dow, n);
  }

  // L-x
  const lx = /^L-(\d+)$/.exec(token);
  if (lx) {
    const n = Number(lx[1]);
    let dow = 6 - n;
    while (dow <= 0) {
      dow += 7;
    }

    return (y, m, d) => dayOfWeekFor(y, m, d) === dow;
  }

  return null;
}

interface CompiledDayField {
  matchers: DayMatcher[];
  hasSpecial: boolean;
}

function compileDayField(token: string, field: 'dom' | 'dow'): CompiledDayField {
  if (!/[LW#]/.test(token)) {
    const values = getNumericRange(token, field === 'dom' ? 1 : 0, field === 'dom' ? 31 : 7);
    const set = new Set(values);
    const isNumeric = (y: number, m: number, d: number) => {
      if (field === 'dom') {
        return set.has(d);
      }

      return set.has(dayOfWeekFor(y, m, d));
    };

    return { hasSpecial: false, matchers: [isNumeric] };
  }

  const compileOne = field === 'dom' ? compileDOMToken : compileDOWToken;
  const parts = token.split(',');
  const matchers: DayMatcher[] = [];

  for (const part of parts) {
    const special = compileOne(part);
    if (special) {
      matchers.push(special);
      continue;
    }

    const values = getNumericRange(part, field === 'dom' ? 1 : 0, field === 'dom' ? 31 : 7);
    const set = new Set(values);
    const isNumeric = (y: number, m: number, d: number) => {
      if (field === 'dom') {
        return set.has(d);
      }

      return set.has(dayOfWeekFor(y, m, d));
    };

    matchers.push(isNumeric);
  }

  return { hasSpecial: true, matchers };
}

function nextMatch(
  curr: Temporal.PlainDateTime,
  ranges: number[][],
  domCompiled: CompiledDayField,
  dowCompiled: CompiledDayField,
  isDomWild: boolean,
  isDowWild: boolean,
): Temporal.PlainDateTime | null {
  const limit = curr.add({ years: YEAR_LIMIT });

  while (Temporal.PlainDateTime.compare(curr, limit) <= 0) {
    if (!ranges[2].includes(curr.month)) {
      const nextMonth = ranges[2].find(m => m > curr.month) ?? ranges[2][0];
      const year = nextMonth <= curr.month ? curr.year + 1 : curr.year;
      curr = curr.with({ day: 1, hour: 0, minute: 0, month: nextMonth, second: 0, year });

      continue;
    }

    const domMatch = domCompiled.matchers.some(m => m(curr.year, curr.month, curr.day));
    const dowMatch = dowCompiled.matchers.some(m => m(curr.year, curr.month, curr.day));
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

export const CloudflareWorkersParser = {
  convert(expr: string, format: ScheduleFormat): string {
    switch (format) {
      case 'unix': {
        return CloudflareWorkersParser.normalize(expr);
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

  hasMacro: false,

  isNormal(expr: string): boolean {
    return this.normalize(expr) === expr;
  },

  *iterate(expr: string, start: Temporal.PlainDateTime) {
    const tokens = this.normalize(expr).trim().split(/\s+/);

    // to be parsed, the expression must be complete
    if (tokens.length !== 5) {
      return undefined;
    }

    const ranges = [
      getNumericRange(tokens[0], 0, 59),
      getNumericRange(tokens[1], 0, 23),
      getNumericRange(tokens[3], 1, 12),
    ];

    const domCompiled = compileDayField(tokens[2], 'dom');
    const dowCompiled = compileDayField(tokens[4], 'dow');

    const isDomWild = tokens[2] === '*';
    const isDowWild = tokens[4] === '*';

    const curr = start
      .with({ microsecond: 0, millisecond: 0, nanosecond: 0, second: 0 })
      .add({ minutes: 1 });

    let next = nextMatch(curr, ranges, domCompiled, dowCompiled, isDomWild, isDowWild);
    while (next !== null) {
      yield next;
      next = nextMatch(
        next.add({ minutes: 1 }),
        ranges,
        domCompiled,
        dowCompiled,
        isDomWild,
        isDowWild,
      );
    }
  },

  normalize(expr: string): string {
    const trimmed = expr.trim().replaceAll(/\s+/g, ' ');

    return trimmed
      .split(' ')
      .map((t, i) => (i < Fields.length ? collapseExpressions(t, Fields[i]) : t))
      .join(' ');
  },

  validate(expr: string): ReturnType<ScheduleParser['validate']> {
    const trimmedExpr = expr.trim();

    const rawTokens = trimmedExpr.split(/\s+/);
    const tokens = this.normalize(trimmedExpr).split(/\s+/).filter(Boolean);
    const error: number[] = [];

    for (let idx = 0; idx < tokens.length && idx < 5; idx++) {
      if (!Validator[idx](tokens[idx])) {
        error.push(idx);
      }
    }

    if (error.length > 0) {
      return {
        error,
        normal: this.isNormal(trimmedExpr),
        status: 'invalid',
        tokens: rawTokens.filter(Boolean),
      };
    }

    if (tokens.length < 5) {
      return {
        error: [],
        normal: this.isNormal(trimmedExpr),
        status: 'incomplete',
        tokens: rawTokens.filter(Boolean),
      };
    }

    if (tokens.length > 5) {
      return {
        error: [],
        normal: this.isNormal(trimmedExpr),
        status: 'invalid',
        tokens: rawTokens.filter(Boolean),
      };
    }

    try {
      return {
        descriptor: cronstrue.toString(CloudflareWorkersParser.normalize(expr)),
        generator: this.iterate(trimmedExpr, Temporal.Now.plainDateTimeISO()),
        normal: this.isNormal(trimmedExpr),
        status: 'valid',
        tokens: rawTokens.filter(Boolean),
      };
      // handle cronstrue error
    } catch {
      return {
        error: [],
        normal: this.isNormal(trimmedExpr),
        status: 'invalid',
        tokens: rawTokens.filter(Boolean),
      };
    }
  },
};
