import { Temporal } from '@js-temporal/polyfill';

import cronstrue from 'cronstrue';
import type { ScheduleFormat } from '@/types';

import type { ScheduleParser, ValidationResult } from './base';
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

const Macros: Record<string, string> = {
  '@annually': '0 0 1 1 *',
  '@daily': '0 0 * * *',
  '@hourly': '0 * * * *',
  '@midnight': '0 0 * * *',
  '@monthly': '0 0 1 * *',
  '@weekly': '0 0 * * 0',
  '@yearly': '0 0 1 1 *',
};

type Field = {
  readonly max: number;
  readonly min: number;
  readonly aliases?: Record<string, number>;
};

const Fields5: Field[] = [
  { max: 59, min: 0 },
  { max: 23, min: 0 },
  { max: 31, min: 1 },
  { aliases: MonthToNumber, max: 12, min: 1 },
  { aliases: DayToNumber, max: 7, min: 1 },
];

const Fields6: Field[] = [
  { max: 59, min: 0 },
  { max: 59, min: 0 },
  { max: 23, min: 0 },
  { max: 31, min: 1 },
  { aliases: MonthToNumber, max: 12, min: 1 },
  { aliases: DayToNumber, max: 7, min: 1 },
];

const buildValidators = (fields: ReadonlyArray<Field>) =>
  fields.map((field, idx) => {
    const isMonth = field.aliases === MonthToNumber;
    const isDay = field.aliases === DayToNumber;
    const isDom = idx === (fields.length === 5 ? 2 : 3);

    if (isMonth || isDay) {
      if (!field.aliases) {
        throw new Error('aliases should be set for month/day fields');
      }
      const aliases = field.aliases;
      return createTokenValidator(
        isDay ? /[^0-9*,\-/L#W]/i : /[^0-9*,\-/]/,
        field.min,
        field.max,
        (token: string): string => {
          const regex = new RegExp(`(${Object.keys(aliases).join('|')})`, 'gi');
          return token.replace(regex, m =>
            String(aliases[m.toLowerCase() as keyof typeof aliases]),
          );
        },
      );
    }

    if (isDom) {
      return createTokenValidator(/[^0-9*,\-/L#W]/i, field.min, field.max);
    }

    return createTokenValidator(/[^0-9*,\-/]/, field.min, field.max);
  });

function collapseExpressions(token: string, field: Field): string {
  const { max, min } = field;
  const aliases = field.aliases;

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
    // L/W/# can't be expanded by getNumericRange. Return the preprocessed
    // token so downstream stages (validators and compileDayField) can
    // recognise it. The name-conversion above is preserved.
    return t;
  }

  if (values.length === max - min + 1) {
    return '*';
  }

  if (hasStep) {
    return t;
  }

  // Find shortest equivalent form; runs of 3+ become ranges
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

function normalizeWith(expr: string, fields: ReadonlyArray<Field>): string {
  const trimmed = expr.trim().replaceAll(/\s+/g, ' ');

  if (trimmed in Macros) {
    return Macros[trimmed];
  }

  return trimmed
    .split(' ')
    .map((t, i) => (i < fields.length ? collapseExpressions(t, fields[i]) : t))
    .join(' ');
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
    return day === 1 ? 3 : day - 1;
  }
  if (dow === 7) {
    const last = daysInMonth(year, month);
    return day === last ? day - 2 : day + 1;
  }
  return day;
}

function lastWeekdayOfMonth(year: number, month: number): number {
  const last = daysInMonth(year, month);
  const dow = dayOfWeekFor(year, month, last);
  if (dow === 6) return last - 1;
  if (dow === 7) return last - 2;
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
    if (dayOfWeekFor(year, month, d) === dow) return d;
  }
  return last;
}

type DayMatcher = (year: number, month: number, day: number) => boolean;

function compileDOMToken(token: string): DayMatcher | null {
  if (token === 'L') return (y, m, d) => d === daysInMonth(y, m);
  if (token === 'LW') return (y, m, d) => d === lastWeekdayOfMonth(y, m);
  const w = /^(\d+)W$/.exec(token);
  if (w) {
    const target = Number(w[1]);
    return (y, m, d) => d === nearestWeekdayToDay(y, m, target);
  }
  const ln = /^L-(\d+)$/.exec(token);
  if (ln) {
    const n = Number(ln[1]);
    return (y, m, d) => {
      const target = daysInMonth(y, m) - n;
      return d === target && target >= 1;
    };
  }
  return null;
}

function compileDOWToken(token: string): DayMatcher | null {
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
  const ln = /^L-(\d+)$/.exec(token);
  if (ln) {
    const n = Number(ln[1]);
    let dow = 6 - n;
    while (dow <= 0) dow += 7;
    return (y, m, d) => dayOfWeekFor(y, m, d) === dow;
  }
  return null;
}

interface CompiledDayField {
  matchers: DayMatcher[];
}

function compileDayField(token: string, field: 'dom' | 'dow'): CompiledDayField {
  if (!/[LW#]/.test(token)) {
    const values = getNumericRange(token, field === 'dom' ? 1 : 0, field === 'dom' ? 31 : 7);
    const set = new Set(values);
    const isNumeric = (y: number, m: number, d: number) => {
      if (field === 'dom') return set.has(d);
      return set.has(dayOfWeekFor(y, m, d));
    };
    return { matchers: [isNumeric] };
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
      if (field === 'dom') return set.has(d);
      return set.has(dayOfWeekFor(y, m, d));
    };
    matchers.push(isNumeric);
  }

  return { matchers };
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

function pickValidators(tokenCount: number) {
  return tokenCount === 5 ? buildValidators(Fields5) : buildValidators(Fields6);
}

function domDowIndices(tokenCount: number): { dom: number; dow: number } {
  return tokenCount === 5 ? { dom: 2, dow: 4 } : { dom: 3, dow: 5 };
}

function rangeIndices(tokenCount: number): {
  second: number;
  minute: number;
  hour: number;
  month: number;
} {
  return tokenCount === 5
    ? { hour: 1, minute: 0, month: 3, second: -1 }
    : { hour: 2, minute: 1, month: 4, second: 0 };
}

export const NodeParser: ScheduleParser = {
  convert(expr: string, format: ScheduleFormat): string {
    switch (format) {
      case 'unix': {
        return NodeParser.normalize(expr);
      }
      case 'quartz': {
        const tokens = expr.split(/\s+/);
        if (tokens.length === 7) return tokens.slice(1, 6).join(' ');
        if (tokens.length === 6) return tokens.slice(1).join(' ');
        return '';
      }
      case 'cf-workers': {
        // drop optional seconds field
        const tokens = expr.trim().split(/\s+/);
        if (tokens.length === 6) return tokens.slice(1).join(' ');
        if (tokens.length === 5) return tokens.join(' ');
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

  isNormal(expr: string): boolean {
    return this.normalize(expr) === expr;
  },

  *iterate(expr: string, start: Temporal.PlainDateTime) {
    const tokens = this.normalize(expr).trim().split(/\s+/);

    if (tokens.length === 1 && tokens[0] in Macros) {
      yield* this.iterate(Macros[tokens[0]], start);
      return;
    }

    if (tokens.length !== 5 && tokens.length !== 6) {
      return undefined;
    }

    const idx = domDowIndices(tokens.length);
    const rangeIdx = rangeIndices(tokens.length);

    const ranges: number[][] = [
      getNumericRange(tokens[rangeIdx.minute], 0, 59),
      getNumericRange(tokens[rangeIdx.hour], 0, 23),
      getNumericRange(tokens[rangeIdx.month], 1, 12),
    ];

    const is6Field = tokens.length === 6;
    const secondRange: number[] = is6Field ? getNumericRange(tokens[rangeIdx.second], 0, 59) : [0];

    const domCompiled = compileDayField(tokens[idx.dom], 'dom');
    const dowCompiled = compileDayField(tokens[idx.dow], 'dow');

    const isDomWild = tokens[idx.dom] === '*';
    const isDowWild = tokens[idx.dow] === '*';

    const base = start.with({ microsecond: 0, millisecond: 0, nanosecond: 0 });

    let curr = is6Field ? base.add({ seconds: 1 }) : base.add({ minutes: 1, seconds: 0 });

    while (true) {
      const matched = nextMatch(curr, ranges, domCompiled, dowCompiled, isDomWild, isDowWild);
      if (matched === null) return;

      if (is6Field) {
        const seconds = [...secondRange].sort((a, b) => a - b);
        for (const sec of seconds) {
          const candidate = matched.with({ second: sec });
          if (Temporal.PlainDateTime.compare(candidate, base) <= 0) continue;
          yield candidate;
        }
        curr = matched.add({ minutes: 1, seconds: 0 });
      } else {
        yield matched;
        curr = matched.add({ minutes: 1, seconds: 0 });
      }
    }
  },

  normalize(expr: string): string {
    const trimmed = expr.trim().replaceAll(/\s+/g, ' ');

    if (trimmed in Macros) {
      return Macros[trimmed];
    }

    const tokens = trimmed.split(/\s+/);
    if (tokens.length === 5) {
      return normalizeWith(trimmed, Fields5);
    }
    if (tokens.length === 6) {
      return normalizeWith(trimmed, Fields6);
    }

    return trimmed;
  },

  validate(expr: string): ValidationResult {
    const trimmedExpr = expr.trim();

    if (expr.startsWith('@')) {
      if (trimmedExpr in Macros) {
        return {
          descriptor: cronstrue.toString(NodeParser.normalize(expr)),
          generator: this.iterate(Macros[trimmedExpr], Temporal.Now.plainDateTimeISO()),
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
          normal: true,
          status: 'invalid',
          tokens: [],
        };
      }

      return {
        error: [],
        normal: true,
        status: 'incomplete',
        tokens: [],
      };
    }

    const rawTokens = trimmedExpr.split(/\s+/);
    const tokens = this.normalize(trimmedExpr).split(/\s+/).filter(Boolean);

    if (tokens.length !== 5 && tokens.length !== 6) {
      return {
        error: [],
        normal: this.isNormal(trimmedExpr),
        status: tokens.length < 5 ? 'incomplete' : 'invalid',
        tokens: rawTokens.filter(Boolean),
      };
    }

    const validators = pickValidators(tokens.length);
    const error: number[] = [];

    for (let idx = 0; idx < tokens.length && idx < validators.length; idx++) {
      if (!validators[idx](tokens[idx])) {
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

    return {
      descriptor: cronstrue.toString(NodeParser.normalize(expr)),
      generator: this.iterate(trimmedExpr, Temporal.Now.plainDateTimeISO()),
      normal: this.isNormal(trimmedExpr),
      status: 'valid',
      tokens: rawTokens.filter(Boolean),
    };
  },
};
