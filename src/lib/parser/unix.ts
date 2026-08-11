import type { ScheduleFormat, TokenMap } from '@/types/schedule';

import { createScheduleParser, MonthToNumber, UnixLikeMacros, ZeroBasedDayToNumber } from './base';
import { toZeroBasedDayOfWeek } from './convert';
import { createTokenValidator } from './validator';

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

    const dayOfMonth = tokens?.dayOfMonth?.value === '?' ? '*' : (tokens.dayOfMonth?.value ?? '*');

    let dayOfWeek = '*';
    if (tokens.dayOfWeek !== undefined) {
      dayOfWeek = tokens.dayOfWeek.value === '?' ? '*' : tokens.dayOfWeek.value;

      if (from !== 'node') {
        dayOfWeek = toZeroBasedDayOfWeek(dayOfWeek);
      }
    }

    const serialized = `${tokens.minute?.value} ${tokens.hour?.value} ${dayOfMonth} ${tokens.month?.value} ${dayOfWeek}`;

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
