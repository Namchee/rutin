import { toString as describeSchedule } from 'cronstrue';
import type { FieldName, NormalizedSchedule, ScheduleFormat, TokenMap } from '@/types/schedule';
import { daysInMonth, OneBasedDayToNumber, UnixLikeMacros } from './base';
import { QuartzParser } from './quartz';

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

export const DayToNumber: Record<string, number> = {
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

    // N/step
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
  // Split on `-`, then split the tail on `~` if present.
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
 * Find the next datetime at or after `curr` that matches the spec.
 *
 * @param {Temporal.PlainDateTime} curr Temporal datetime to start from
 * @param {CalendarInstance} spec Calendar instance.
 *
 * @returns {Temporal.PlainDateTime} Next datetime according to the instance
 * relative to current datetime.
 */
function nextMatch(
  curr: Temporal.PlainDateTime,
  spec: CalendarInstance,
): Temporal.PlainDateTime | null {
  while (true) {
    if (!spec.year.includes(curr.year)) {
      const nextYear = spec.year.find(y => y > curr.year);

      // No allowed year lies ahead...
      if (nextYear === undefined) {
        return null;
      }

      curr = curr.with({ day: 1, hour: 0, minute: 0, month: 1, second: 0, year: nextYear });

      continue;
    }

    if (!spec.month.includes(curr.month)) {
      const nextMonth = spec.month.find(m => m > curr.month) ?? spec.month[0];
      const year = nextMonth <= curr.month ? curr.year + 1 : curr.year;

      curr = curr.with({ day: 1, hour: 0, minute: 0, month: nextMonth, second: 0, year });

      continue;
    }

    // Weekday and day-of-month (or `~N` offset) must both match.
    const weekdayOk =
      spec.weekday === undefined ||
      spec.weekday.includes(dayOfWeek(curr.year, curr.month, curr.day));
    const dayOk =
      spec.lastDayOffset !== undefined
        ? curr.day === daysInMonth(curr.year, curr.month) - spec.lastDayOffset + 1
        : spec.day.includes(curr.day);

    if (!weekdayOk || !dayOk) {
      curr = curr.add({ days: 1 }).with({ hour: 0, minute: 0, second: 0 });

      continue;
    }

    if (!spec.hour.includes(curr.hour)) {
      const nextHour = spec.hour.find(h => h > curr.hour) ?? spec.hour[0];

      curr = (nextHour <= curr.hour ? curr.add({ days: 1 }) : curr).with({
        hour: nextHour,
        minute: 0,
        second: 0,
      });

      continue;
    }

    if (!spec.minute.includes(curr.minute)) {
      const nextMinute = spec.minute.find(m => m > curr.minute) ?? spec.minute[0];

      curr = (nextMinute <= curr.minute ? curr.add({ hours: 1 }) : curr).with({
        minute: nextMinute,
        second: 0,
      });

      continue;
    }

    if (!spec.second.includes(curr.second)) {
      const nextSecond = spec.second.find(s => s > curr.second) ?? spec.second[0];

      curr = (nextSecond <= curr.second ? curr.add({ minutes: 1 }) : curr).with({
        second: nextSecond,
      });

      continue;
    }

    return curr;
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

const WeekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Split a `YYYY-MM-DD` or `YYYY-MM~N` date expression into raw components.
 */
function splitSystemdDate(expr: string): { year: string; month: string; day: string } {
  const [year, ...rest] = expr.split('-');

  let monthPart: string;
  let dayPart: string;

  if (rest.length === 2) {
    [monthPart, dayPart] = rest;
  } else {
    const tildeIdx = rest[0].indexOf('~');
    monthPart = rest[0].slice(0, tildeIdx);
    dayPart = rest[0].slice(tildeIdx);
  }

  return { day: dayPart, month: monthPart, year };
}

/**
 * Convert a systemd component expression (`a..b` ranges, `N/step`, leading
 * zeroes) into cron syntax (`a-b` ranges).
 */
function systemdComponentToCron(token: string): string {
  if (token === '*') {
    return '*';
  }

  return token
    .split(',')
    .map(part => {
      const range = /^(\d+)\.\.(\d+)(?:\/(\d+))?$/.exec(part);
      if (range) {
        const step = range[3] ? `/${range[3]}` : '';
        return `${Number(range[1])}-${Number(range[2])}${step}`;
      }

      const stepMatch = /^(\d+)\/(\d+)$/.exec(part);
      if (stepMatch) {
        return `${Number(stepMatch[1])}/${stepMatch[2]}`;
      }

      if (/^\d+$/.test(part)) {
        return String(Number(part));
      }

      return part;
    })
    .join(',');
}

/**
 * Convert a systemd day-of-month component to cron syntax, mapping the `~N`
 * last-day marker to `L` / `L-(N-1)`.
 */
function systemdDayToCron(token: string): string {
  const tilde = /^~(\d*)$/.exec(token);
  if (tilde) {
    const offset = tilde[1] === '' ? 1 : Number(tilde[1]);
    return offset === 1 ? 'L' : `L-${offset - 1}`;
  }

  return systemdComponentToCron(token);
}

/**
 * Convert a systemd weekday expression (`Mon`, `Mon..Fri`, `Sat,Sun`) into a
 * numeric one-based day-of-week expression (Sun=1..Sat=7).
 */
function systemdWeekdayToOneBased(token: string): string {
  if (token === '*') {
    return '*';
  }

  return token
    .split(',')
    .map(part => {
      const range = /^([a-z]+)\.\.([a-z]+)$/i.exec(part);
      if (range) {
        const lo = DayToNumber[range[1].toLowerCase()];
        const hi = DayToNumber[range[2].toLowerCase()];
        if (lo !== undefined && hi !== undefined) {
          return `${lo}-${hi}`;
        }

        return part;
      }

      const num = DayToNumber[part.toLowerCase()];
      if (num === undefined) {
        return part;
      }

      return String(num);
    })
    .join(',');
}

/**
 * Decompose a systemd token map (keyed `dayOfWeek`/`date`/`time`) into cron
 * per-field values.
 */
export function decomposeSystemdTokens(tokens: TokenMap): Partial<Record<FieldName, string>> {
  const fields: Partial<Record<FieldName, string>> = {};

  if (tokens.dayOfWeek !== undefined) {
    fields.dayOfWeek = systemdWeekdayToOneBased(tokens.dayOfWeek.value);
  }

  if (tokens.date !== undefined) {
    const { year, month, day } = splitSystemdDate(tokens.date.value);
    fields.year = systemdComponentToCron(year);
    fields.month = systemdComponentToCron(month);
    fields.dayOfMonth = systemdDayToCron(day);
  } else {
    fields.year = '*';
    fields.month = '*';
    fields.dayOfMonth = '*';
  }

  if (tokens.time !== undefined) {
    const [hourPart, minutePart, secondPart] = tokens.time.value.split(':');
    fields.hour = systemdComponentToCron(hourPart);
    fields.minute = systemdComponentToCron(minutePart);
    fields.second = secondPart !== undefined ? systemdComponentToCron(secondPart) : '0';
  } else {
    fields.hour = '0';
    fields.minute = '0';
    fields.second = '0';
  }

  return fields;
}

/**
 * Tokenize a 5-field cron expression (minute hour day-of-month month
 * day-of-week), computing positions over the given string.
 */
function tokenizeCron(expr: string): TokenMap {
  const tokens = Array.from(expr.trim().matchAll(/\S+/g), match => ({
    position: [match.index, match.index + match[0].length] as [number, number],
    value: match[0],
  }));

  return {
    dayOfMonth: tokens[2],
    dayOfWeek: tokens[4],
    hour: tokens[1],
    minute: tokens[0],
    month: tokens[3],
  };
}

/**
 * Expand a cron day-of-week token to sorted zero-based day indexes
 * using the source format's convention.
 *
 * @returns sorted indexes, or `null` when the token cannot be expanded
 */
function expandDowIndexes(token: string, from: ScheduleFormat): number[] | null {
  const zeroBased = from === 'unix' || from === 'node';
  let expr = token.replace(/(\d+)-(\d+)/g, '$1..$2');

  if (!zeroBased) {
    // Quartz allows 0 as an alternate spelling of Sunday.
    expr = expr.replace(/(^|,)0(?=$|,)/g, '$11');
  }

  try {
    const values = getNumericRange(expr, zeroBased ? 0 : 1, 7);
    const toIndex = (v: number) => (zeroBased ? (v === 7 ? 0 : v) : v === 0 ? 0 : v - 1);
    return Array.from(new Set(values.map(toIndex))).sort((a, b) => a - b);
  } catch {
    return null;
  }
}

/**
 * Convert a cron day-of-week token to a systemd weekday expression.
 */
function toWeekday(token: string | undefined, from: ScheduleFormat): string | undefined {
  if (token === undefined || token === '*' || token === '?') {
    return undefined;
  }

  if (/[LW#]/.test(token)) {
    return token;
  }

  const indexes = expandDowIndexes(token, from);
  if (indexes === null) {
    return token;
  }

  if (indexes.length === 7) {
    return undefined;
  }

  const parts: string[] = [];
  for (let i = 0; i < indexes.length;) {
    let j = i;
    while (j + 1 < indexes.length && indexes[j + 1] === indexes[j] + 1) {
      j++;
    }

    if (j > i) {
      parts.push(`${WeekdayNames[indexes[i]]}..${WeekdayNames[indexes[j]]}`);
    } else {
      parts.push(WeekdayNames[indexes[i]]);
    }

    i = j + 1;
  }

  return parts.join(',');
}

/**
 * Convert a cron component expression (`a-b` ranges) into systemd syntax
 * (`a..b`).
 */
function cronComponentToSystemd(token: string): string {
  return token
    .split(',')
    .map(part => {
      const range = /^(\d+)-(\d+)(?:\/(\d+))?$/.exec(part);
      if (range) {
        const step = range[3] ? `/${range[3]}` : '';
        return `${range[1]}..${range[2]}${step}`;
      }

      // Zero-pad single digits to match systemd conventions (`09`, `05`).
      if (/^\d$/.test(part)) {
        return `0${part}`;
      }

      return part;
    })
    .join(',');
}

/**
 * Convert a cron day-of-month token to systemd syntax, mapping `L` (last day
 * of month) to `~1` and `L-N` to `~N+1`.
 */
function dayToSystemd(token: string): string {
  if (token === '?') {
    return '*';
  }

  if (token === 'L') {
    return '~1';
  }

  const lx = /^L-(\d+)$/.exec(token);
  if (lx) {
    return `~${Number(lx[1]) + 1}`;
  }

  return cronComponentToSystemd(token);
}

export const SystemdParser: ScheduleParser = {
  convert(tokens: TokenMap, raw: string, from: ScheduleFormat) {
    if (from === 'systemd') {
      return {
        tokens,
        value: raw,
      };
    }

    // Expand Unix/Node @-macros to cron syntax and convert as a Unix source.
    let sourceTokens = tokens;
    let sourceFrom = from;
    if ((from === 'unix' || from === 'node') && raw.trim() in UnixLikeMacros) {
      const actual = UnixLikeMacros[raw.trim()];
      sourceTokens = tokenizeCron(actual);
      sourceFrom = 'unix';
    }

    const minute = sourceTokens.minute?.value;
    const hour = sourceTokens.hour?.value;
    const second = sourceTokens.second?.value;
    const dayOfMonth = sourceTokens.dayOfMonth?.value;
    const month = sourceTokens.month?.value;
    const year = sourceTokens.year?.value;
    const dayOfWeek = sourceTokens.dayOfWeek?.value;

    const weekday = toWeekday(dayOfWeek, sourceFrom);
    const date = [
      year === undefined ? '*' : cronComponentToSystemd(year),
      month === undefined ? '*' : cronComponentToSystemd(month),
      dayOfMonth === undefined ? '*' : dayToSystemd(dayOfMonth),
    ].join('-');
    const time = [
      hour === undefined ? '*' : cronComponentToSystemd(hour),
      minute === undefined ? '*' : cronComponentToSystemd(minute),
      second === undefined ? '00' : cronComponentToSystemd(second),
    ].join(':');

    const parts: string[] = [];
    if (weekday !== undefined) {
      parts.push(weekday);
    }
    if (date !== '*-*-*') {
      parts.push(date);
    }
    parts.push(time);

    const value = parts.join(' ');

    let outputTokens: TokenMap;
    try {
      outputTokens = tokenize(value);
    } catch {
      outputTokens = {};
    }

    return {
      tokens: outputTokens,
      value,
    };
  },

  normalize(expr: string): NormalizedSchedule {
    let trimmed = expr.trim();

    if (trimmed in Macros) {
      trimmed = Macros[trimmed];
    }

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
          descriptor: describeSchedule(
            QuartzParser.convert(tokenize(Macros[trimmedExpr]), Macros[trimmedExpr], 'systemd')
              .value,
          ),
          generator: generator(Macros[trimmedExpr], Temporal.Now.plainDateTimeISO()),
          normal: false,
          status: 'valid',
          tokens: tokenize(Macros[trimmedExpr]),
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
        descriptor: describeSchedule(
          QuartzParser.convert(tokenize(SystemdParser.normalize(trimmedExpr).value), SystemdParser.normalize(trimmedExpr).value, 'systemd')
            .value,
        ),
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
