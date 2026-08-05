import { createScheduleParser, MonthToNumber } from './base';
import { createTokenValidator } from './validator';

const DayToNumber = {
  fri: 5,
  mon: 1,
  sat: 7,
  sun: 1,
  thu: 4,
  tue: 2,
  wed: 3,
};

export const QuartzParser = createScheduleParser({
  fieldOrder: ['second', 'minute', 'hour', 'dayOfMonth', 'month', 'dayOfWeek', 'year'],
  fields: {
    dayOfMonth: { max: 31, min: 1 },
    // 7 is Sunday
    dayOfWeek: { aliases: DayToNumber, max: 7, min: 0 },
    hour: { max: 23, min: 0 },
    minute: { max: 59, min: 0 },
    month: { aliases: MonthToNumber, max: 12, min: 1 },
    second: { max: 59, min: 0 },
    year: { max: 2199, min: 1970 },
  },
  tokenizer: (expr: string) => {
    const tokens = Array.from(expr.trim().matchAll(/\S+/g), match => ({
      position: [match.index, match.index + match[0].length] as [number, number],
      value: match[0],
    }));

    // second is optional
    if (tokens.length === 6) {
      return {
        dayOfMonth: tokens[2],
        dayOfWeek: tokens[4],
        hour: tokens[1],
        minute: tokens[0],
        month: tokens[3],
        year: tokens[5],
      };
    }

    return {
      dayOfMonth: tokens[3],
      dayOfWeek: tokens[5],
      hour: tokens[2],
      minute: tokens[1],
      month: tokens[4],
      second: tokens[0],
      year: tokens[6],
    };
  },
  validators: {
    dayOfMonth: createTokenValidator(/[^0-9*,\-/?LW]/i, 1, 31),
    dayOfWeek: createTokenValidator(/[^0-9*,\-/L#?]/i, 0, 7),
    hour: createTokenValidator(/[^0-9*,\-/]/, 0, 23),
    minute: createTokenValidator(/[^0-9*,\-/]/, 0, 59),
    month: createTokenValidator(/[^0-9*,\-/]/, 1, 12),
    year: createTokenValidator(/[^0-9*,\-/]/, 1970, 2199),
  },
});
