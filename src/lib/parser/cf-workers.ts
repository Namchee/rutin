import type { ScheduleFormat, TokenMap } from '@/types/schedule';

import { createScheduleParser, MonthToNumber, OneBasedDayToNumber, UnixLikeMacros } from './base';
import { toOneBasedDayOfWeek } from './convert';
import { createTokenValidator } from './validator';

function tokenizer(expr: string): TokenMap {
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

export const CloudflareWorkersParser = createScheduleParser({
  convert(tokens: TokenMap, raw: string, from: ScheduleFormat) {
    if (from === 'cf-workers') {
      return {
        tokens,
        value: raw,
      };
    }

    if ((from === 'unix' || from === 'node') && raw.trim() in UnixLikeMacros) {
      const actual = UnixLikeMacros[raw.trim()];
      return this.convert(tokenizer(actual), actual, 'unix');
    }

    const dayOfMonth = tokens.dayOfMonth?.value === '?' ? '*' : (tokens.dayOfMonth?.value ?? '*');

    let dayOfWeek = '*';
    if (tokens.dayOfWeek !== undefined) {
      dayOfWeek = tokens.dayOfWeek.value === '?' ? '*' : tokens.dayOfWeek.value;

      if (from === 'unix' || from === 'node') {
        dayOfWeek = toOneBasedDayOfWeek(dayOfWeek);
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
    dayOfWeek: { aliases: OneBasedDayToNumber, max: 7, min: 1 },
    hour: { max: 23, min: 0 },
    minute: { max: 59, min: 0 },
    month: { aliases: MonthToNumber, max: 12, min: 1 },
  },
  tokenizer,
  validators: {
    dayOfMonth: createTokenValidator(/[^0-9*,\-/LW]/i, 1, 31),
    dayOfWeek: createTokenValidator(/[^0-9*,\-/L#]/i, 1, 7),
    hour: createTokenValidator(/[^0-9*,\-/]/, 0, 23),
    minute: createTokenValidator(/[^0-9*,\-/]/, 0, 59),
    month: createTokenValidator(/[^0-9*,\-/]/, 1, 12),
  },
});
