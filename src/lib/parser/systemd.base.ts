import { Temporal } from '@js-temporal/polyfill';

import type { NormalizedSchedule, TokenMap } from '@/types';
import type { ScheduleParser, ValidationResult } from './types';

/**
 * A bespoke parser for systemd calendar events.
 *
 * Grammar (from `systemd.time(7)`):
 *
 *   [WEEKDAY] [DATE] [TIME]
 *
 *   WEEKDAY  Optional. English names (Mon, Tuesday, ...), comma lists, `..` ranges:
 *            `Mon`, `Mon..Fri`, `Mon,Fri,Sun`
 *   DATE     `YYYY-MM-DD`, each component may be `*`, a value, a list, a `..` range,
 *            a `/` repetition, or the day may use `~N` for the Nth-last day of month:
 *            `*-*-*`, `2012-*-1,5`, `*-02~03`
 *   TIME     `HH:MM:SS` or `HH:MM` (seconds default 0), components use the same
 *            `*`, list, `..`, `/` rules: `00:00:00`, `*:02/3:00`, `12:00`
 *
 * Either DATE or TIME may be omitted: a missing DATE implies `*-*-*`, a missing
 * TIME implies `00:00:00`. A missing WEEKDAY means "any day".
 *
 * This is intentionally self-contained — it does not reuse `createScheduleParser`
 * because systemd's grammar (compound date/time, `..`, `~`) doesn't map to the
 * cron "one whitespace token = one named field" model.
 */

const YEAR_LIMIT = 10;

const WEEKDAY_NAMES: Record<string, number> = {
  fri: 5,
  friday: 5,
  mon: 1,
  monday: 1,
  sat: 6,
  saturday: 6,
  sun: 7,
  sunday: 7,
  thu: 4,
  thursday: 4,
  tue: 2,
  tues: 2,
  tuesday: 2,
  wed: 3,
  wednesday: 3,
};

// ─────────────────────────── component expansion ───────────────────────────

/**
 * Expand a single component into a sorted array of values within [min, max].
 * Supports wildcards, comma lists, ".." ranges, and "/" repetition.
 */
function expandComponent(expr: string, min: number, max: number): number[] {
  const out = new Set<number>();

  for (const part of expr.split(',')) {
    if (part === '*') {
      for (let i = min; i <= max; i++) out.add(i);
      continue;
    }

    const rangeMatch = /^(\d+)\.\.(\d+)(?:\/(\d+))?$/.exec(part);
    if (rangeMatch) {
      const [, loStr, hiStr, stepStr] = rangeMatch;
      const lo = Number(loStr);
      const hi = Number(hiStr);
      const step = stepStr ? Number(stepStr) : 1;
      if (step <= 0) throw new Error('Repetition value must be positive');
      for (let i = lo; i <= hi; i += step) out.add(i);
      continue;
    }

    const stepMatch = /^\*?\/(\d+)$/.exec(part);
    if (stepMatch) {
      const step = Number(stepMatch[1]);
      if (step <= 0) throw new Error('Repetition value must be positive');
      for (let i = min; i <= max; i += step) out.add(i);
      continue;
    }

    // "N/step" — start at N, then every `step`th value.
    const valueStepMatch = /^(\d+)\/(\d+)$/.exec(part);
    if (valueStepMatch) {
      const start = Number(valueStepMatch[1]);
      const step = Number(valueStepMatch[2]);
      if (step <= 0) throw new Error('Repetition value must be positive');
      for (let i = start; i <= max; i += step) out.add(i);
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
 */
function parseDate(expr: string): {
  year: number[];
  month: number[];
  day: number[];
  lastDayOffset?: number;
} {
  // systemd allows `Y-M~N` (the `~` replaces the day separator), e.g.
  // `*-02~03` = 3rd-last day of February. So split on `-`, then split the
  // tail on `~` if present.
  const [yearPart, ...rest] = expr.split('-');

  if (!yearPart || rest.length === 0 || rest.length > 2) {
    throw new Error(`Invalid date: ${expr}`);
  }

  let monthPart: string;
  let dayPart: string;

  if (rest.length === 2) {
    [monthPart, dayPart] = rest;
  } else {
    // One remaining segment — split on `~` for the last-day offset.
    const tildeIdx = rest[0].indexOf('~');
    if (tildeIdx === -1) {
      throw new Error(`Invalid date: ${expr}`);
    }
    monthPart = rest[0].slice(0, tildeIdx);
    dayPart = rest[0].slice(tildeIdx);
  }

  // `~N` in the day component = Nth-last day of month; `~` alone = last day.
  const tilde = /^~(\d*)$/.exec(dayPart);
  if (tilde) {
    const offset = tilde[1] === '' ? 1 : Number(tilde[1]);
    if (offset < 1) throw new Error(`Invalid last-day offset: ${dayPart}`);
    return {
      day: [],
      lastDayOffset: offset,
      month: expandComponent(monthPart, 1, 12),
      year: expandComponent(yearPart, 1970, 2099),
    };
  }

  return {
    day: expandComponent(dayPart, 1, 31),
    month: expandComponent(monthPart, 1, 12),
    year: expandComponent(yearPart, 1970, 2099),
  };
}

/** Parse a `HH:MM(:SS)?` time string into hour/minute/second arrays. */
function parseTime(expr: string): { hour: number[]; minute: number[]; second: number[] } {
  const parts = expr.split(':');
  if (parts.length < 2 || parts.length > 3) {
    throw new Error(`Invalid time: ${expr}`);
  }

  return {
    hour: expandComponent(parts[0], 0, 23),
    minute: expandComponent(parts[1], 0, 59),
    second: expandComponent(parts[2] ?? '0', 0, 59),
  };
}

/** Parse a weekday component (names, comma lists, `..` ranges) into day numbers 1-7. */
function parseWeekday(expr: string): number[] | undefined {
  const out = new Set<number>();

  for (const part of expr.split(',')) {
    const range = /^([a-z]+)\.\.([a-z]+)$/i.exec(part);
    if (range) {
      const lo = WEEKDAY_NAMES[range[1].toLowerCase()];
      const hi = WEEKDAY_NAMES[range[2].toLowerCase()];
      if (lo === undefined || hi === undefined) {
        throw new Error(`Invalid weekday range: ${part}`);
      }
      for (let d = lo; d <= hi; d++) out.add(d);
      continue;
    }

    const num = WEEKDAY_NAMES[part.toLowerCase()];
    if (num === undefined) {
      throw new Error(`Invalid weekday: ${part}`);
    }
    out.add(num);
  }

  return out.size > 0 ? Array.from(out) : undefined;
}

// ─────────────────────────── date math ───────────────────────────

function daysInMonth(year: number, month: number): number {
  return new Temporal.PlainDate(year, month, 1).add({ months: 1 }).subtract({ days: 1 }).day;
}

function dayOfWeek(year: number, month: number, day: number): number {
  return Temporal.PlainDate.from({ day, month, year }).dayOfWeek;
}

// ─────────────────────────── matching ───────────────────────────

interface CalendarSpec {
  weekday?: number[];
  year: number[];
  month: number[];
  day: number[];
  lastDayOffset?: number;
  hour: number[];
  minute: number[];
  second: number[];
}

/** Whether a datetime satisfies the parsed spec. */
function matches(dt: Temporal.PlainDateTime, spec: CalendarSpec): boolean {
  if (spec.weekday && !spec.weekday.includes(dayOfWeek(dt.year, dt.month, dt.day))) {
    return false;
  }

  if (!spec.year.includes(dt.year)) return false;
  if (!spec.month.includes(dt.month)) return false;

  if (spec.lastDayOffset !== undefined) {
    const last = daysInMonth(dt.year, dt.month);
    if (dt.day !== last - spec.lastDayOffset + 1) return false;
  } else if (!spec.day.includes(dt.day)) {
    return false;
  }

  if (!spec.hour.includes(dt.hour)) return false;
  if (!spec.minute.includes(dt.minute)) return false;
  if (!spec.second.includes(dt.second)) return false;

  return true;
}

/** Find the next datetime at or after `curr` that matches the spec. */
function nextMatch(
  curr: Temporal.PlainDateTime,
  spec: CalendarSpec,
): Temporal.PlainDateTime | null {
  const limit = curr.add({ years: YEAR_LIMIT });

  while (Temporal.PlainDateTime.compare(curr, limit) <= 0) {
    if (matches(curr, spec)) {
      return curr;
    }

    // Advance one second (systemd granularity).
    curr = curr.add({ seconds: 1 });
  }

  return null;
}

// ─────────────────────────── tokenizer ───────────────────────────

/** Split the input into named tokens with character positions. */
function tokenize(expr: string): TokenMap {
  const raw: string[] = Array.from(expr.matchAll(/\S+/g), match => match[0]);
  const tokens: TokenMap = {};

  const isTime = (s: string) => s.includes(':');
  const isDate = (s: string) => /^\S+-\S+-\S+$/.test(s) || s.includes('~');
  const isWeekday = (s: string) =>
    WEEKDAY_NAMES[s.toLowerCase()] !== undefined || /^[a-z]+(?:\.\.[a-z]+)?(?:,[a-z]+)*$/i.test(s);

  const posOf = (i: number): [number, number] => {
    let start = 0;
    for (let j = 0; j < i; j++) {
      start += raw[j].length + 1;
    }
    return [start, start + raw[i].length];
  };

  let weekdayIdx = -1;
  let dateIdx = -1;
  let timeIdx = -1;

  for (let i = 0; i < raw.length; i++) {
    const part = raw[i];
    if (weekdayIdx === -1 && isWeekday(part)) {
      weekdayIdx = i;
    } else if (timeIdx === -1 && isTime(part)) {
      timeIdx = i;
    } else if (dateIdx === -1 && isDate(part)) {
      dateIdx = i;
    } else {
      throw new Error(`Unrecognised calendar component: ${part}`);
    }
  }

  if (weekdayIdx !== -1) tokens.dayOfWeek = { position: posOf(weekdayIdx), value: raw[weekdayIdx] };
  if (dateIdx !== -1) tokens.date = { position: posOf(dateIdx), value: raw[dateIdx] };
  if (timeIdx !== -1) tokens.time = { position: posOf(timeIdx), value: raw[timeIdx] };

  return tokens;
}

// ─────────────────────────── parser ───────────────────────────

function parseSpec(tokens: TokenMap): CalendarSpec {
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

// ─────────────────────────── exports ───────────────────────────

export const SystemdParser: ScheduleParser = {
  *iterate(expr: string, start: Temporal.PlainDateTime) {
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
  },
  normalize(expr: string): NormalizedSchedule {
    const trimmed = expr.trim();
    const tokens = tokenize(trimmed);

    // Canonical form: WEEKDAY? DATE? TIME? — omit what the user omitted.
    const parts: string[] = [];
    if (tokens.dayOfWeek) parts.push(tokens.dayOfWeek.value);
    if (tokens.date) parts.push(tokens.date.value);
    if (tokens.time) parts.push(tokens.time.value);

    const value = parts.join(' ').trim();

    return {
      tokens,
      value,
    };
  },

  process(expr: string): ValidationResult {
    const trimmedExpr = expr.trim();

    let tokens: TokenMap;
    try {
      tokens = tokenize(trimmedExpr);
    } catch {
      return {
        error: ['date'],
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

    // Validate by parsing; the generator re-parses via iterate.
    try {
      parseSpec(tokens);
    } catch {
      return {
        error: ['date'],
        normal: false,
        status: 'invalid',
        tokens,
      };
    }

    try {
      return {
        descriptor: SystemdParser.normalize(trimmedExpr).value,
        generator: SystemdParser.iterate(trimmedExpr, Temporal.Now.plainDateTimeISO()),
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
