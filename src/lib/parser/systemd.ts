import { Temporal } from '@js-temporal/polyfill';

import type { FieldName, NormalizedSchedule, TokenMap } from '@/types/schedule';
import { daysInMonth, OneBasedDayToNumber } from './base';
import type { ScheduleParser, ValidationResult } from './types';

interface DateToken {
  year: number[];
  month: number[];
  day: number[];
  lastDayOffset?: number;
}

interface TimeToken {
  hour: number[];
  minute: number[];
  second: number[];
}

interface CalendarInstance {
  weekday?: number[];
  year: number[];
  month: number[];
  day: number[];
  lastDayOffset?: number;
  hour: number[];
  minute: number[];
  second: number[];
}

const DayToNumber: Record<string, number> = {
  ...OneBasedDayToNumber,
  friday: 6,
  monday: 2,
  saturday: 7,
  sunday: 1,
  thursday: 5,
  tues: 3,
  tuesday: 3,
  wednesday: 4,
};

const Macros: Record<string, string> = {
  daily: '*-*-* 00:00:00',
  hourly: '*-*-* *:00:00',
  minutely: '*-*-* *:*:00',
  monthly: '*-*-01 00:00:00',
  quarterly: '*-01,04,07,10-01 00:00:00',
  semianually: '*-01,07-01 00:00:00',
  weekly: 'Mon *-*-* 00:00:00',
  yearly: '*-01-01 00:00:00',
};

/**
 * Expand a single component into a sorted array of values within [min, max].
 * Supports wildcards, comma lists, ".." ranges, and "/" repetition.
 *
 * Will throw an error if the step repetition is not valid.
 *
 * @param {string} expr Expression to expand
 * @param {number} min Numeric lower bound of the expression
 * @param {number} max Numeric upper bound of the expression
 *
 * @returns {number[]} Numeric range of the said expression
 */
function getNumericRange(expr: string, min: number, max: number): number[] {
  const out = new Set<number>();

  for (const part of expr.split(',')) {
    if (part === '*') {
      for (let i = min; i <= max; i++) {
        out.add(i);
      }

      continue;
    }

    const rangeMatch = /^(\d+)\.\.(\d+)(?:\/(\d+))?$/.exec(part);
    if (rangeMatch) {
      const [, loStr, hiStr, stepStr] = rangeMatch;
      const lo = Number(loStr);
      const hi = Number(hiStr);
      const step = stepStr ? Number(stepStr) : 1;

      if (step <= 0) {
        throw new Error('Repetition value must be positive');
      }

      for (let i = lo; i <= hi; i += step) {
        out.add(i);
      }

      continue;
    }

    const stepMatch = /^\*?\/(\d+)$/.exec(part);
    if (stepMatch) {
      const step = Number(stepMatch[1]);

      if (step <= 0) {
        throw new Error('Repetition value must be positive');
      }

      for (let i = min; i <= max; i += step) {
        out.add(i);
      }

      continue;
    }

    // "N/step"
    const valueStepMatch = /^(\d+)\/(\d+)$/.exec(part);
    if (valueStepMatch) {
      const start = Number(valueStepMatch[1]);
      const step = Number(valueStepMatch[2]);

      if (step <= 0) {
        throw new Error('Repetition value must be positive');
      }

      for (let i = start; i <= max; i += step) {
        out.add(i);
      }

      continue;
    }

    const num = Number(part);
    if (!Number.isNaN(num)) {
      out.add(num);
      continue;
    }

    throw new Error(`Invalid calendar component: ${expr}`);
  }

  const values = Array.from(out).filter(v => v >= min && v <= max);
  if (values.length === 0) {
    throw new Error(`Component out of range: ${expr}`);
  }

  return values.sort((a, b) => a - b);
}

/**
 * Parse a `YYYY-MM-DD` date string into per-component value arrays.
 * Supports `*`, lists, `..` ranges, `/` repetition, and `~N` last-day-of-month.
 *
 * @param {string} expr Date expression to parse
 * @returns {DateToken} Parsed date expression, with each subtoken separated as keys
 */
function parseDate(expr: string): DateToken {
  // systemd allows `Y-M~N` (the `~` replaces the day separator)
  // So split on `-`, then split the tail on `~` if present.
  const [yearPart, ...rest] = expr.split('-');

  if (!yearPart || rest.length === 0 || rest.length > 2) {
    throw new Error(`Invalid date: ${expr}`);
  }

  let monthPart: string;
  let dayPart: string;

  if (rest.length === 2) {
    [monthPart, dayPart] = rest;
  } else {
    const tildeIdx = rest[0].indexOf('~');
    if (tildeIdx === -1) {
      throw new Error(`Invalid date: ${expr}`);
    }

    monthPart = rest[0].slice(0, tildeIdx);
    dayPart = rest[0].slice(tildeIdx);
  }

  const tilde = /^~(\d*)$/.exec(dayPart);
  if (tilde) {
    const offset = tilde[1] === '' ? 1 : Number(tilde[1]);
    if (offset < 1) {
      throw new Error(`Invalid last-day offset: ${dayPart}`);
    }

    return {
      day: [],
      lastDayOffset: offset,
      month: getNumericRange(monthPart, 1, 12),
      year: getNumericRange(yearPart, 1970, 2099),
    };
  }

  return {
    day: getNumericRange(dayPart, 1, 31),
    month: getNumericRange(monthPart, 1, 12),
    year: getNumericRange(yearPart, 1970, 2099),
  };
}

/**
 * Parse a `HH:MM(:SS)?` time string into hour/minute/second arrays.
 *
 * @param {string} expr Time expression to parse
 * @returns {TimeToken} Parsed date expression, with each subtoken separated as keys
 */
function parseTime(expr: string): TimeToken {
  const parts = expr.split(':');
  if (parts.length < 2 || parts.length > 3) {
    throw new Error(`Invalid time: ${expr}`);
  }

  return {
    hour: getNumericRange(parts[0], 0, 23),
    minute: getNumericRange(parts[1], 0, 59),
    second: getNumericRange(parts[2] ?? '0', 0, 59),
  };
}

/**
 * Parse a weekday component (names, comma lists, `..` ranges) into day numbers 1-7.
 *
 * Will throw an error if the range is invalid.
 *
 * @param  {string} expr Expression to parse
 * @returns {number[] | undefined} Numeric range of the weekday. Or `undefined` if it
 * doesn't exist.
 */
function parseWeekday(expr: string): number[] | undefined {
  const out = new Set<number>();

  for (const part of expr.split(',')) {
    const range = /^([a-z]+)\.\.([a-z]+)$/i.exec(part);
    if (range) {
      const lo = DayToNumber[range[1].toLowerCase()];
      const hi = DayToNumber[range[2].toLowerCase()];
      if (lo === undefined || hi === undefined) {
        throw new Error(`Invalid weekday range: ${part}`);
      }

      for (let d = lo; d <= hi; d++) {
        out.add(d);
      }

      continue;
    }

    const num = DayToNumber[part.toLowerCase()];
    if (num === undefined) {
      throw new Error(`Invalid weekday: ${part}`);
    }

    out.add(num);
  }

  return out.size > 0 ? Array.from(out) : undefined;
}

/**
 * Weekday of the given date in systemd's convention (Sun=1..Sat=7), matching
 * `OneBasedDayToNumber`. `Temporal.PlainDate.dayOfWeek` is Mon=1..Sun=7, so
 * shift it by one.
 */
function dayOfWeek(year: number, month: number, day: number): number {
  const monBased = Temporal.PlainDate.from({ day, month, year }).dayOfWeek;
  return (monBased % 7) + 1;
}

/**
 * Helper function to check whether a datetime satisfies the parsed calendar instance.
 *
 * @param {Temporal.PlainDateTime} datetime Temporal datetime to be tested
 * @param {CalendarInstance} instance Calendar instance.
 *
 * @returns {boolean} `true` if it matches. `false` otherwise.
 */
function matches(datetime: Temporal.PlainDateTime, instance: CalendarInstance): boolean {
  if (
    instance.weekday &&
    !instance.weekday.includes(dayOfWeek(datetime.year, datetime.month, datetime.day))
  ) {
    return false;
  }

  const yearCondition = [
    instance.year.includes(datetime.year),
    instance.month.includes(datetime.month),
  ];

  if (yearCondition.some(c => !c)) {
    return false;
  }

  if (instance.lastDayOffset !== undefined) {
    const last = daysInMonth(datetime.year, datetime.month);
    if (datetime.day !== last - instance.lastDayOffset + 1) {
      return false;
    }
  } else if (!instance.day.includes(datetime.day)) {
    return false;
  }

  const timeCondition = [
    instance.hour.includes(datetime.hour),
    instance.minute.includes(datetime.minute),
    instance.second.includes(datetime.second),
  ];

  if (timeCondition.some(c => !c)) {
    return false;
  }

  return true;
}

/**
 * Find the next datetime at or after `curr` that matches the spec.
 *
 * @param {Temporal.PlainDateTime} datetime Temporal datetime to be tested
 * @param {CalendarInstance} instance Calendar instance.
 *
 * @returns {Temporal.PlainDateTime} Next datetime according to the instance
 * relative to current datetime.
 */
function nextMatch(curr: Temporal.PlainDateTime, spec: CalendarInstance): Temporal.PlainDateTime {
  while (true) {
    if (matches(curr, spec)) {
      return curr;
    }

    curr = curr.add({ seconds: 1 });
  }
}

/**
 * Best-effort attribution of an unrecognised token to a calendar component,
 * so the UI can highlight the offending field.
 */
function guessField(part: string): FieldName {
  if (part.includes(':')) {
    return 'time';
  }

  if (part.includes('-') || part.includes('~')) {
    return 'date';
  }

  if (/^[a-z]/i.test(part)) {
    return 'dayOfWeek';
  }

  return 'date';
}

const FieldOrder: FieldName[] = ['dayOfWeek', 'date', 'time'];

/**
 * Parse raw string expression into Systemd OnCalendar tokens.
 *
 * Will throw an Error if the expression is unparseable due to unknown
 * or missing fields.
 *
 * @param {string} expr Expression to parse
 * @returns {TokenMap} Key-value store of token with their positions.
 */
function tokenize(expr: string): TokenMap {
  const raw: string[] = Array.from(expr.matchAll(/\S+/g), match => match[0]);
  const tokens: TokenMap = {};

  const isTime = (s: string) => s.includes(':');
  const isDate = (s: string) => /^\S+-\S+-\S+$/.test(s) || s.includes('~');
  const isWeekday = (s: string) =>
    DayToNumber[s.toLowerCase()] !== undefined || /^[a-z]+(?:\.\.[a-z]+)?(?:,[a-z]+)*$/i.test(s);

  const classify = (s: string): FieldName | undefined => {
    if (isWeekday(s)) {
      return 'dayOfWeek';
    }
    if (isTime(s)) {
      return 'time';
    }
    if (isDate(s)) {
      return 'date';
    }

    return undefined;
  };

  const position = (i: number): [number, number] => {
    let start = 0;
    for (let j = 0; j < i; j++) {
      start += raw[j].length + 1;
    }

    return [start, start + raw[i].length];
  };

  let lastOrderIndex = -1;

  for (let i = 0; i < raw.length; i++) {
    const part = raw[i];
    const kind = classify(part);
    if (kind === undefined) {
      throw new CalendarError(`Unrecognised calendar component: ${part}`, guessField(part));
    }

    const orderIndex = FieldOrder.indexOf(kind);
    if (orderIndex < lastOrderIndex) {
      throw new CalendarError(`Out-of-order calendar component: ${part}`, guessField(part));
    }

    tokens[kind] = {
      position: position(i),
      value: part,
    };

    lastOrderIndex = orderIndex + 1;
  }

  return tokens;
}

/**
 * Parse token maps into SystemD OnCalendar instance.
 *
 * @param {TokenMap} tokens Tokenized expressions
 * @returns {CalendarInstance} SystemD OnCalendar instance.
 */
function parseSpec(tokens: TokenMap): CalendarInstance {
  const weekday = tokens.dayOfWeek?.value;
  const date = tokens.date?.value ?? '*-*-*';
  const time = tokens.time?.value ?? '00:00:00';

  const d = parseDate(date);
  const t = parseTime(time);

  return {
    day: d.day,
    hour: t.hour,
    lastDayOffset: d.lastDayOffset,
    minute: t.minute,
    month: d.month,
    second: t.second,
    weekday: weekday ? parseWeekday(weekday) : undefined,
    year: d.year,
  };
}

class CalendarError extends Error {
  constructor(
    message: string,
    public readonly field: FieldName,
  ) {
    super(message);
  }
}

export function* generator(expr: string, start: Temporal.PlainDateTime) {
  const tokens = tokenize(expr);
  if (Object.keys(tokens).length === 0) {
    return undefined;
  }

  const spec = parseSpec(tokens);

  const base = start.with({
    microsecond: 0,
    millisecond: 0,
    nanosecond: 0,
  });

  let curr = base.add({ seconds: 1 });
  let next = nextMatch(curr, spec);
  while (next !== null) {
    yield next;
    curr = next.add({ seconds: 1 });
    next = nextMatch(curr, spec);
  }
}

export const SystemdParser: ScheduleParser = {
  normalize(expr: string): NormalizedSchedule {
    const trimmed = expr.trim();

    let tokens: TokenMap;
    try {
      tokens = tokenize(trimmed);
    } catch {
      return {
        tokens: {},
        value: trimmed,
      };
    }

    const parts: string[] = [];
    if (tokens.dayOfWeek) {
      parts.push(tokens.dayOfWeek.value);
    }
    if (tokens.date) {
      parts.push(tokens.date.value);
    }
    if (tokens.time) {
      parts.push(tokens.time.value);
    }

    const value = parts.join(' ').trim();

    return {
      tokens,
      value,
    };
  },

  process(expr: string): ValidationResult {
    const trimmedExpr = expr.trim();

    let mightBeMacro = false;
    for (const macro of Object.keys(Macros)) {
      if (macro.startsWith(expr)) {
        mightBeMacro = true;
        break;
      }
    }

    if (mightBeMacro) {
      // it's complete
      if (trimmedExpr in Macros) {
        return {
          descriptor: '',
          generator: generator(Macros[trimmedExpr], Temporal.Now.plainDateTimeISO()),
          normal: false,
          status: 'valid',
          tokens: tokenize(Macros[trimmedExpr]),
        };
      }

      if (!mightBeMacro) {
        return {
          error: [],
          normal: true, // do not attempt to normalize
          status: 'invalid',
          tokens: {},
        };
      }

      return {
        error: [],
        normal: true, // do not attempt to normalize
        status: 'incomplete',
        tokens: {},
      };
    }

    let tokens: TokenMap;
    try {
      tokens = tokenize(trimmedExpr);
    } catch (err) {
      return {
        error: [err instanceof CalendarError ? err.field : 'date'],
        normal: false,
        status: 'invalid',
        tokens: {},
      };
    }

    if (Object.keys(tokens).length === 0) {
      return {
        error: [],
        normal: false,
        status: 'incomplete',
        tokens: {},
      };
    }

    const errors: FieldName[] = [];
    if (tokens.dayOfWeek) {
      try {
        parseWeekday(tokens.dayOfWeek.value);
      } catch {
        errors.push('dayOfWeek');
      }
    }

    if (tokens.date) {
      try {
        parseDate(tokens.date.value);
      } catch {
        errors.push('date');
      }
    }

    if (tokens.time) {
      try {
        parseTime(tokens.time.value);
      } catch {
        errors.push('time');
      }
    }

    if (errors.length > 0) {
      return {
        error: errors,
        normal: false,
        status: 'invalid',
        tokens,
      };
    }

    try {
      return {
        descriptor: SystemdParser.normalize(trimmedExpr).value,
        generator: generator(trimmedExpr, Temporal.Now.plainDateTimeISO()),
        normal: SystemdParser.normalize(trimmedExpr).value === trimmedExpr,
        status: 'valid',
        tokens,
      };
    } catch {
      return {
        error: [],
        normal: false,
        status: 'invalid',
        tokens,
      };
    }
  },
};
