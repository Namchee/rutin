import type { NormalizedSchedule, ScheduleFormat } from '@/types/schedule';

import { AmazonParser } from './amazon';
import { createScheduleParser, MonthToNumber, ZeroBasedDayToNumber } from './base';
import { CloudflareWorkersParser } from './cf-workers';
import { NodeParser } from './node';
import { QuartzParser } from './quartz';
import { DayToNumber, SystemdParser } from './systemd';
import { createTokenValidator } from './validator';

const Macros: Record<string, string> = {
  '@annually': '0 0 1 1 *',
  '@daily': '0 0 * * *',
  '@hourly': '0 * * * *',
  '@midnight': '0 0 * * *',
  '@monthly': '0 0 1 * *',
  '@weekly': '0 0 * * 0',
  '@yearly': '0 0 1 1 *',
};

interface Normalizable {
  normalize: (expr: string) => NormalizedSchedule;
}

type NonUnixFormat = Exclude<ScheduleFormat, 'unix'>;

const ParserByFormat: Record<NonUnixFormat, Normalizable> = {
  amazon: AmazonParser,
  'cf-workers': CloudflareWorkersParser,
  node: NodeParser,
  quartz: QuartzParser,
  systemd: SystemdParser,
};

/**
 * Shift a day-of-week expression from the one-based convention
 * to zero-based convention.
 *
 * @param {string} token Day-of-week expression to convert
 * @returns {string} Zero-based day-of-week expression
 */
function toZeroBasedDayOfWeek(token: string): string {
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

      // a, a-b, a-b/s, a/s — shift numeric bounds down by one, keep the step
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
 * Convert a Systemd weekday expression into a Unix day-of-week expression.
 *
 * @param {string} token Systemd weekday expression
 * @returns {string} Zero-based day-of-week expression
 */
function systemdWeekdayToUnix(token: string): string {
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
          return `${lo - 1}-${hi - 1}`;
        }

        return part;
      }

      const num = DayToNumber[part.toLowerCase()];
      if (num === undefined) {
        return part;
      }

      return String(num - 1);
    })
    .join(',');
}

/**
 * Convert a single Systemd calendar component (year, month, day, hour, minute)
 * into Unix cron syntax.
 *
 * @param {string} token Single Systemd component expression
 * @returns {string} Unix CRON component expression
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

export const UNIXParser = createScheduleParser({
  /**
   * Convert a schedule expression from any supported format into Unix cron
   * syntax (5 fields: minute hour day-of-month month day-of-week).
   *
   * Fields that have no Unix equivalent are dropped (seconds, years) and
   * wildcard markers that do (`?`) are rewritten as `*`. Special tokens Unix
   * cannot express (`L`, `W`, `#`, Systemd's `~N`) are kept as-is so no
   * schedule is silently changed — the Unix parser will flag them as invalid.
   *
   * @param {string} expr Schedule expression to convert
   * @param {ScheduleFormat} from Format of the source expression
   * @returns {string} The expression in Unix cron syntax
   */
  convert(expr: string, from: ScheduleFormat) {
    const trimmed = expr.trim();

    if (trimmed.length === 0) {
      return '';
    }

    if ((from === 'unix' || from === 'node') && trimmed in Macros) {
      return Macros[trimmed];
    }

    if (from === 'unix') {
      return trimmed;
    }

    const { tokens } = ParserByFormat[from].normalize(trimmed);

    if (Object.keys(tokens).length === 0) {
      return trimmed;
    }

    let minute = tokens.minute?.value;
    let hour = tokens.hour?.value;
    let dayOfMonth = tokens.dayOfMonth?.value;
    let month = tokens.month?.value;
    let dayOfWeek = tokens.dayOfWeek?.value;

    if (from === 'systemd') {
      const date = parseSystemdDate(tokens.date?.value ?? '*-*-*');
      const time = parseSystemdTime(tokens.time?.value ?? '00:00:00');

      dayOfMonth = date.dayOfMonth;
      month = date.month;
      hour = time.hour;
      minute = time.minute;

      if (dayOfWeek) {
        dayOfWeek = systemdWeekdayToUnix(dayOfWeek);
      }
    } else {
      if (dayOfMonth) {
        dayOfMonth = dayOfMonth === '?' ? '*' : dayOfMonth;
      }

      if (dayOfWeek) {
        dayOfWeek = dayOfWeek === '?' ? '*' : dayOfWeek;

        if (from !== 'node') {
          dayOfWeek = toZeroBasedDayOfWeek(dayOfWeek);
        }
      }
    }

    return [minute, hour, dayOfMonth, month, dayOfWeek].map(v => v ?? '*').join(' ');
  },
  fieldOrder: ['minute', 'hour', 'dayOfMonth', 'month', 'dayOfWeek'],
  fields: {
    dayOfMonth: { max: 31, min: 1 },
    dayOfWeek: { aliases: ZeroBasedDayToNumber, max: 7, min: 0 },
    hour: { max: 23, min: 0 },
    minute: { max: 59, min: 0 },
    month: { aliases: MonthToNumber, max: 12, min: 1 },
  },
  macros: Macros,
  tokenizer: (expr: string) => {
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
  },
  validators: {
    dayOfMonth: createTokenValidator(/[^0-9*,\-/]/i, 1, 31),
    dayOfWeek: createTokenValidator(/[^0-9*,\-/]/, 0, 7),
    hour: createTokenValidator(/[^0-9*,\-/]/, 0, 23),
    minute: createTokenValidator(/[^0-9*,\-/]/, 0, 59),
    month: createTokenValidator(/[^0-9*,\-/]/, 1, 12),
  },
});
