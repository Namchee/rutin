import { createScheduleParser, MonthToNumber, ZeroBasedDayToNumber } from './base';
import { createTokenValidator } from './validator';

export const NodeParser = createScheduleParser({
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
  macros: {
    '@annually': '0 0 1 1 *',
    '@daily': '0 0 * * *',
    '@hourly': '0 * * * *',
    '@midnight': '0 0 * * *',
    '@monthly': '0 0 1 * *',
    '@weekly': '0 0 * * 0',
    '@yearly': '0 0 1 1 *',
  },
  tokenizer: (expr: string) => {
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
  },
  validators: {
    dayOfMonth: createTokenValidator(/[^0-9*,\-/LW?]/i, 1, 31),
    dayOfWeek: createTokenValidator(/[^0-9*,\-/L#?]/i, 0, 7),
    hour: createTokenValidator(/[^0-9*,\-/]/, 0, 23),
    minute: createTokenValidator(/[^0-9*,\-/]/, 0, 59),
    month: createTokenValidator(/[^0-9*,\-/]/, 1, 12),
    second: createTokenValidator(/[^0-9*,\-/]/, 0, 59),
  },
});
