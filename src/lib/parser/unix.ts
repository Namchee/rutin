import type { ScheduleFormat, TokenMap } from '@/types/schedule';

import { createScheduleParser, MonthToNumber, UnixLikeMacros, ZeroBasedDayToNumber } from './base';
import { decomposeSystemdTokens } from './systemd';
import { createTokenValidator } from './validator';
import { toZeroBasedDayOfWeek } from './weekday-lib';

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
  };
}

export const UNIXParser = createScheduleParser({
  convert(tokens: TokenMap, raw: string, from: ScheduleFormat) {
    if (from === 'unix') {
      return {
        tokens,
        value: raw,
      };
    }

    if (from === 'node' && raw.trim() in UnixLikeMacros) {
      return {
        tokens: tokenizer(UnixLikeMacros[raw.trim()]),
        value: UnixLikeMacros[raw.trim()],
      };
    }

    let minute = tokens.minute?.value;
    let hour = tokens.hour?.value;
    let dayOfMonth = tokens.dayOfMonth?.value;
    let month = tokens.month?.value;
    let dayOfWeek = tokens.dayOfWeek?.value;

    if (from === 'systemd') {
      const systemd = decomposeSystemdTokens(tokens);
      minute = systemd.minute;
      hour = systemd.hour;
      dayOfMonth = systemd.dayOfMonth;
      month = systemd.month;
      dayOfWeek = systemd.dayOfWeek;
    }

    const normalizedDayOfMonth = dayOfMonth === '?' ? '*' : (dayOfMonth ?? '*');

    let normalizedDayOfWeek = '*';
    if (dayOfWeek) {
      normalizedDayOfWeek = dayOfWeek === '?' ? '*' : dayOfWeek;

      if (from !== 'node') {
        normalizedDayOfWeek = toZeroBasedDayOfWeek(normalizedDayOfWeek);
      }
    }

    const serialized = `${minute} ${hour} ${normalizedDayOfMonth} ${month} ${normalizedDayOfWeek}`;

    return {
      tokens: tokenizer(serialized),
      value: serialized,
    };
  },
  fieldOrder: ['minute', 'hour', 'dayOfMonth', 'month', 'dayOfWeek'],
  fields: {
    dayOfMonth: { max: 31, min: 1 },
    dayOfWeek: { aliases: ZeroBasedDayToNumber, max: 7, min: 0 },
    hour: { max: 23, min: 0 },
    minute: { max: 59, min: 0 },
    month: { aliases: MonthToNumber, max: 12, min: 1 },
  },
  isDoWZeroBased: true,
  macros: UnixLikeMacros,
  tokenizer,
  validators: {
    dayOfMonth: createTokenValidator(/[^0-9*,\-/]/i, 1, 31),
    dayOfWeek: createTokenValidator(/[^0-9*,\-/]/, 0, 7),
    hour: createTokenValidator(/[^0-9*,\-/]/, 0, 23),
    minute: createTokenValidator(/[^0-9*,\-/]/, 0, 59),
    month: createTokenValidator(/[^0-9*,\-/]/, 1, 12),
  },
});
