import type { ScheduleFormat, TokenMap } from '@/types/schedule';

import { createScheduleParser, MonthToNumber, UnixLikeMacros, ZeroBasedDayToNumber } from './base';
import { toZeroBasedDayOfWeek } from './convert';
import { createTokenValidator } from './validator';

function tokenizer(expr: string) {
  const tokens = Array.from(expr.trim().matchAll(/\S+/g), match => ({
    position: [match.index, match.index + match[0].length] as [number, number],
    value: match[0],
  }));

  if (tokens.length <= 5) {
    return {
      dayOfMonth: tokens[2],
      dayOfWeek: tokens[4],
      hour: tokens[1],
      minute: tokens[0],
      month: tokens[3],
    };
  }

  return {
    dayOfMonth: tokens[3],
    dayOfWeek: tokens[5],
    hour: tokens[2],
    minute: tokens[1],
    month: tokens[4],
    second: tokens[0],
  };
}

export const NodeParser = createScheduleParser({
  convert(tokens: TokenMap, raw: string, from: ScheduleFormat) {
    if (from === 'node' || (from === 'unix' && raw.trim() in UnixLikeMacros)) {
      return {
        tokens,
        value: raw,
      };
    }

    const seconds = tokens.second?.value ?? '0';

    const dayOfMonth = tokens?.dayOfMonth?.value === '?' ? '*' : (tokens.dayOfMonth?.value ?? '*');

    let dayOfWeek = '*';
    if (tokens.dayOfWeek !== undefined) {
      dayOfWeek = tokens.dayOfWeek.value === '?' ? '*' : tokens.dayOfWeek.value;

      if (from !== 'unix') {
        dayOfWeek = toZeroBasedDayOfWeek(dayOfWeek);
      }
    }

    let serialized = `${tokens.minute?.value} ${tokens.hour?.value} ${dayOfMonth} ${tokens.month?.value} ${dayOfWeek}`;
    if (tokens.second?.value) {
      serialized = `${tokens.second.value} ${serialized}`;
    }

    return {
      tokens: tokenizer(serialized),
      value: serialized,
    };
  },
  fieldOrder: ['second', 'minute', 'hour', 'dayOfMonth', 'month', 'dayOfWeek'],
  fields: {
    dayOfMonth: { max: 31, min: 1 },
    // 7 is Sunday
    dayOfWeek: { aliases: ZeroBasedDayToNumber, max: 7, min: 0 },
    hour: { max: 23, min: 0 },
    minute: { max: 59, min: 0 },
    month: { aliases: MonthToNumber, max: 12, min: 1 },
    second: { max: 59, min: 0 },
  },
  macros: UnixLikeMacros,
  tokenizer,
  validators: {
    dayOfMonth: createTokenValidator(/[^0-9*,\-/LW?]/i, 1, 31),
    dayOfWeek: createTokenValidator(/[^0-9*,\-/L#?]/i, 0, 7),
    hour: createTokenValidator(/[^0-9*,\-/]/, 0, 23),
    minute: createTokenValidator(/[^0-9*,\-/]/, 0, 59),
    month: createTokenValidator(/[^0-9*,\-/]/, 1, 12),
    second: createTokenValidator(/[^0-9*,\-/]/, 0, 59),
  },
});
