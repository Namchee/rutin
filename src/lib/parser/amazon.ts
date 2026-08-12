import type { ScheduleFormat, TokenMap } from '@/types/schedule';

import { createScheduleParser, MonthToNumber, OneBasedDayToNumber, UnixLikeMacros } from './base';
import { decomposeSystemdTokens } from './systemd';
import { createTokenValidator } from './validator';
import { toOneBasedDayOfWeek } from './weekday-lib';

function tokenizer(expr: string) {
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
    year: tokens[5],
  };
}

export const AmazonParser = createScheduleParser({
  convert(tokens: TokenMap, raw: string, from: ScheduleFormat) {
    if (from === 'amazon') {
      return {
        tokens,
        value: raw,
      };
    }

    if (['unix', 'node'].includes(from) && raw.trim() in UnixLikeMacros) {
      const actual = `${UnixLikeMacros[raw.trim()]} *`;

      return {
        tokens: tokenizer(actual),
        value: actual,
      };
    }

    let minute = tokens.minute?.value;
    let hour = tokens.hour?.value;
    let dayOfMonth = tokens.dayOfMonth?.value;
    let month = tokens.month?.value;
    let dayOfWeek = tokens.dayOfWeek?.value;
    let year = tokens.year?.value;

    if (tokens.date !== undefined || tokens.time !== undefined) {
      const systemd = decomposeSystemdTokens(tokens);
      minute = systemd.minute;
      hour = systemd.hour;
      dayOfMonth = systemd.dayOfMonth;
      month = systemd.month;
      dayOfWeek = systemd.dayOfWeek;
      year = systemd.year;
    }

    const normalizedDayOfMonth = dayOfMonth === '?' ? '*' : (dayOfMonth ?? '*');

    let normalizedDayOfWeek = '*';
    if (dayOfWeek !== undefined) {
      normalizedDayOfWeek = dayOfWeek === '?' ? '*' : dayOfWeek;

      if (['unix', 'node'].includes(from)) {
        normalizedDayOfWeek = toOneBasedDayOfWeek(normalizedDayOfWeek);
      }
    }

    const serialized = `${minute} ${hour} ${normalizedDayOfMonth} ${month} ${normalizedDayOfWeek} ${year ?? '*'}`;

    return {
      tokens: tokenizer(serialized),
      value: serialized,
    };
  },
  fieldOrder: ['minute', 'hour', 'dayOfMonth', 'month', 'dayOfWeek', 'year'],
  fields: {
    dayOfMonth: { max: 31, min: 1 },
    // 7 is Sunday
    dayOfWeek: { aliases: OneBasedDayToNumber, max: 7, min: 1 },
    hour: { max: 23, min: 0 },
    minute: { max: 59, min: 0 },
    month: { aliases: MonthToNumber, max: 12, min: 1 },
    year: { max: 2199, min: 1970 },
  },
  isDoWZeroBased: false,
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
      year: tokens[5],
    };
  },
  validators: {
    dayOfMonth: createTokenValidator(/[^0-9*,\-/?]/i, 1, 31),
    dayOfWeek: createTokenValidator(/[^0-9*,\-/L#?]/i, 1, 7),
    hour: createTokenValidator(/[^0-9*,\-/]/, 0, 23),
    minute: createTokenValidator(/[^0-9*,\-/]/, 0, 59),
    month: createTokenValidator(/[^0-9*,\-/]/, 1, 12),
    year: createTokenValidator(/[^0-9*,\-/]/, 1970, 2199),
  },
});
