import type { NormalizedSchedule, ScheduleFormat, TokenMap } from '@/types/schedule';

import { UnixLikeMacros } from './base';
import { DayToNumber } from './systemd';

/**
 * Shift a day-of-week expression from zero-based
 * convention to the one-based convention.
 *
 * @param {string} token Day-of-week expression to convert
 * @returns {string} One-based day-of-week expression
 */
export function toOneBasedDayOfWeek(token: string): string {
  if (token === '*' || /[LW#]/.test(token)) {
    return token;
  }

  if (token === '?') {
    return '*';
  }

  return token
    .split(',')
    .map(part => {
      // `*/step` selects the same weekdays in both conventions
      if (part.startsWith('*/')) {
        return part;
      }

      // a, a-b, a-b/s, a/s — shift numeric bounds up by one, keep the step
      const match = /^(\d+)(?:-(\d+))?(?:\/(\d+))?$/.exec(part);
      if (!match) {
        return part;
      }

      // 7 is an alternate spelling of Sunday in Unix; one-based Sunday is 1.
      const shift = (n: string) => {
        const value = Number(n);
        return value === 7 ? '1' : String(value + 1);
      };
      const lo = shift(match[1]);
      const hi = match[2] ? `-${shift(match[2])}` : '';
      const step = match[3] ? `/${match[3]}` : '';

      return `${lo}${hi}${step}`;
    })
    .join(',');
}

/**
 * Shift a day-of-week expression from the one-based convention
 * zero-based convention.
 *
 * @param {string} token Day-of-week expression to convert
 * @returns {string} Zero-based day-of-week expression
 */
export function toZeroBasedDayOfWeek(token: string): string {
  if (token === '*' || /[LW#]/.test(token)) {
    return token;
  }

  if (token === '?') {
    return '*';
  }

  return token
    .split(',')
    .map(part => {
      if (part.startsWith('*/')) {
        return part;
      }

      const match = /^(\d+)(?:-(\d+))?(?:\/(\d+))?$/.exec(part);
      if (!match) {
        return part;
      }

      const shift = (n: string) => (n === '0' ? '0' : String(Number(n) - 1));
      const lo = shift(match[1]);
      const hi = match[2] ? `-${shift(match[2])}` : '';
      const step = match[3] ? `/${match[3]}` : '';

      return `${lo}${hi}${step}`;
    })
    .join(',');
}

/**
 * Convert a Systemd weekday expression (`Mon`, `Mon..Fri`, `Sat,Sun`) into
 * its numeric one-based form (Sun=1..Sat=7, matching `DayToNumber`).
 *
 * @param {string} token Systemd weekday expression
 * @returns {string} One-based day-of-week expression
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
 * Convert a single Systemd calendar component (year, month, day, hour, minute)
 * into Unix cron syntax.
 *
 * Systemd uses `..` for ranges instead of `-`, allows leading zeroes, and
 * supports the `~N` last-day-of-month marker. `~N` (and anything else Unix
 * cannot express) is kept as-is so no schedule is silently changed.
 *
 * @param {string} token Single Systemd component expression
 * @returns {string} Unix cron component expression
 */
function systemdComponentToUnix(token: string): string {
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

      // `~N`, `*/step`, ... keep as-is
      return part;
    })
    .join(',');
}

/**
 * Parse a Systemd date expression (`YYYY-MM-DD` or `YYYY-MM~N`) into Unix
 * day-of-month and month expressions.
 *
 * The year component is dropped since Unix cron cannot express years.
 *
 * @param {string} expr Systemd date expression
 * @returns {object} Unix day-of-month and month expressions
 */
function parseSystemdDate(expr: string): { dayOfMonth: string; month: string } {
  const [, ...rest] = expr.split('-');

  let monthPart: string;
  let dayPart: string;

  if (rest.length === 2) {
    [monthPart, dayPart] = rest;
  } else {
    const tildeIdx = rest[0].indexOf('~');
    monthPart = rest[0].slice(0, tildeIdx);
    dayPart = rest[0].slice(tildeIdx);
  }

  return {
    dayOfMonth: systemdComponentToUnix(dayPart),
    month: systemdComponentToUnix(monthPart),
  };
}

/**
 * Parse a Systemd time expression (`HH:MM` or `HH:MM:SS`) into Unix hour and
 * minute expressions.
 *
 * The seconds component is dropped since Unix cron cannot express seconds.
 *
 * @param {string} expr Systemd time expression
 * @returns {object} Unix hour and minute expressions
 */
function parseSystemdTime(expr: string): { hour: string; minute: string } {
  const [hourPart, minutePart] = expr.split(':');

  return {
    hour: systemdComponentToUnix(hourPart),
    minute: systemdComponentToUnix(minutePart),
  };
}

/**
 * Tokenize a 5-field cron expression (minute hour day-of-month month
 * day-of-week), computing positions over the given string.
 *
 * @param {string} expr Cron expression to tokenize
 * @returns {TokenMap} Token map of the expression
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
 * Convert a schedule expression from any supported format into Cloudflare
 * Workers cron syntax (5 fields: minute hour day-of-month month day-of-week).
 *
 * Day-of-week is one-based (1=Sunday..7=Saturday), so zero-based sources
 * (Unix, Node) are shifted up while one-based sources pass through. `?` is
 * rewritten as `*` and `L`/`W`/`#` tokens pass through since Workers supports
 * them. Seconds and years are dropped.
 *
 * @param {TokenMap} tokens Tokens of the source expression
 * @param {string} raw Raw source expression
 * @param {ScheduleFormat} from Format of the source expression
 * @returns {NormalizedSchedule} The expression in Cloudflare Workers cron
 * syntax
 */
export function convertToCfWorkers(
  tokens: TokenMap,
  raw: string,
  from: ScheduleFormat,
): NormalizedSchedule {
  const trimmed = raw.trim();

  // Cf-workers -> cf-workers is an identity conversion.
  if (from === 'cf-workers') {
    return { tokens, value: raw };
  }

  // Cf-workers has no @-macros; expand Unix/Node ones to Unix syntax first.
  if ((from === 'unix' || from === 'node') && trimmed in UnixLikeMacros) {
    const value = UnixLikeMacros[trimmed];
    return { tokens: tokenizeCron(value), value };
  }

  let minute = tokens.minute?.value;
  let hour = tokens.hour?.value;
  let dayOfMonth = tokens.dayOfMonth?.value;
  let month = tokens.month?.value;
  let dayOfWeek = tokens.dayOfWeek?.value;

  // Systemd tokens are keyed `dayOfWeek`/`date`/`time`; decompose them.
  if (tokens.date !== undefined || tokens.time !== undefined) {
    const date = parseSystemdDate(tokens.date?.value ?? '*-*-*');
    const time = parseSystemdTime(tokens.time?.value ?? '00:00:00');

    dayOfMonth = date.dayOfMonth;
    month = date.month;
    hour = time.hour;
    minute = time.minute;

    if (dayOfWeek !== undefined) {
      dayOfWeek = systemdWeekdayToOneBased(dayOfWeek);
    }
  }

  const normalizedDayOfMonth = dayOfMonth === '?' ? '*' : (dayOfMonth ?? '*');

  let normalizedDayOfWeek = '*';
  if (dayOfWeek !== undefined) {
    normalizedDayOfWeek = dayOfWeek === '?' ? '*' : dayOfWeek;

    // Zero-based sources (Unix, Node) shift up; one-based sources pass through.
    if (from === 'unix' || from === 'node') {
      normalizedDayOfWeek = toOneBasedDayOfWeek(normalizedDayOfWeek);
    }
  }

  const serialized = `${minute} ${hour} ${normalizedDayOfMonth} ${month} ${normalizedDayOfWeek}`;

  return { tokens: tokenizeCron(serialized), value: serialized };
}
