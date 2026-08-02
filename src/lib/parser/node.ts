import { createScheduleParser } from './base';
import type { TokenizationResult } from './base';
import { createTokenValidator } from './validator';

const DayToNumber = {
  fri: 5,
  mon: 1,
  sat: 6,
  sun: 0,
  thu: 4,
  tue: 2,
  wed: 3,
};

const MonthToNumber = {
  apr: 4,
  aug: 8,
  dec: 12,
  feb: 2,
  jan: 1,
  jul: 7,
  jun: 6,
  mar: 3,
  may: 5,
  nov: 11,
  oct: 10,
  sep: 9,
};

/**
 * Node-cron tokenizer.
 *
 * Supports 5-field (no seconds) and 6-field (with seconds) expressions.
 * In 5-field mode, the seconds field is inserted as '0'.
 */
const nodeTokenizer = (expr: string): TokenizationResult => {
  const result = expr.trim().split(/\s+/).filter(Boolean);
  const raw: (string | null)[] = [...result];
  const tokens: TokenizationResult['tokens'] = {};

  if (result.length === 5) {
    // Insert '0' for the seconds field at the front.
    result.unshift('0');
    raw.unshift(null);
  }

  const fieldNames = ['second', 'minute', 'hour', 'dayOfMonth', 'month', 'dayOfWeek'] as const;
  for (let i = 0; i < result.length && i < fieldNames.length; i++) {
    tokens[fieldNames[i]] = result[i];
  }

  return { raw, tokens };
};

export const NodeScheduleParser = createScheduleParser({
  fields: {
    second: { max: 59, min: 0 },
    minute: { max: 59, min: 0 },
    hour: { max: 23, min: 0 },
    dayOfMonth: { max: 31, min: 1 },
    month: { aliases: MonthToNumber, max: 12, min: 1 },
    // 7 is Sunday
    dayOfWeek: { aliases: DayToNumber, max: 7, min: 0 },
  },
  fieldOrder: ['second', 'minute', 'hour', 'dayOfMonth', 'month', 'dayOfWeek'],
  tokenRange: [5, 6],
  validators: {
    second: createTokenValidator(/[^0-9*,\-/]/, 0, 59),
    minute: createTokenValidator(/[^0-9*,\-/]/, 0, 59),
    hour: createTokenValidator(/[^0-9*,\-/]/, 0, 23),
    dayOfMonth: createTokenValidator(/[^0-9*,\-/LW?]/i, 1, 31),
    month: createTokenValidator(/[^0-9*,\-/]/, 1, 12, (token: string): string => {
      if (token === '?') return '*';
      const monthRegex = new RegExp(Object.keys(MonthToNumber).join('|'), 'gi');
      return token.replace(monthRegex, matched =>
        MonthToNumber[matched.toLowerCase() as keyof typeof MonthToNumber].toString(),
      );
    }),
    dayOfWeek: createTokenValidator(/[^0-9*,\-/L#?]/i, 1, 7, (token: string): string => {
      if (token === '?') return '*';
      const dayRegex = new RegExp(Object.keys(DayToNumber).join('|'), 'gi');
      return token.replace(dayRegex, matched =>
        DayToNumber[matched.toLowerCase() as keyof typeof DayToNumber].toString(),
      );
    }),
  },
  tokenizer: nodeTokenizer,
});
