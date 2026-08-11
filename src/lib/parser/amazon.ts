import type { ScheduleFormat, TokenMap } from '@/types/schedule';

import { createScheduleParser, MonthToNumber, UnixLikeMacros } from './base';
import { toOneBasedDayOfWeek } from './convert';
import { createTokenValidator } from './validator';

const DayToNumber = {
  fri: 6,
  mon: 2,
  sat: 7,
  sun: 1,
  thu: 5,
  tue: 3,
  wed: 4,
};

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
    if (from === 'node') {
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

    const year = tokens.year?.value ?? '*';

    const dayOfMonth = tokens?.dayOfMonth?.value === '?' ? '*' : (tokens.dayOfMonth?.value ?? '*');

    let dayOfWeek = '*';
    if (tokens.dayOfWeek !== undefined) {
      dayOfWeek = tokens.dayOfWeek.value === '?' ? '*' : tokens.dayOfWeek.value;

      if (['unix', 'node'].includes(from)) {
        dayOfWeek = toOneBasedDayOfWeek(dayOfWeek);
      }
    }

    const serialized = `${tokens.minute?.value} ${tokens.hour?.value} ${dayOfMonth} ${tokens.month?.value} ${dayOfWeek} ${year}`;

    return {
      tokens: tokenizer(serialized),
      value: serialized,
    };
  },
  fieldOrder: ['minute', 'hour', 'dayOfMonth', 'month', 'dayOfWeek', 'year'],
  fields: {
    dayOfMonth: { max: 31, min: 1 },
    // 7 is Sunday
    dayOfWeek: { aliases: DayToNumber, max: 7, min: 1 },
    hour: { max: 23, min: 0 },
    minute: { max: 59, min: 0 },
    month: { aliases: MonthToNumber, max: 12, min: 1 },
    year: { max: 2199, min: 1970 },
  },
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
