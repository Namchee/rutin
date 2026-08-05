import { createScheduleParser, MonthToNumber } from './base';
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

export const CloudflareWorkersParser = createScheduleParser({
  fieldOrder: ['minute', 'hour', 'dayOfMonth', 'month', 'dayOfWeek'],
  fields: {
    dayOfMonth: { max: 31, min: 1 },
    dayOfWeek: { aliases: DayToNumber, max: 7, min: 1 },
    hour: { max: 23, min: 0 },
    minute: { max: 59, min: 0 },
    month: { aliases: MonthToNumber, max: 12, min: 1 },
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
    };
  },
  validators: {
    dayOfMonth: createTokenValidator(/[^0-9*,\-/LW]/i, 1, 31),
    dayOfWeek: createTokenValidator(/[^0-9*,\-/L#]/i, 1, 7),
    hour: createTokenValidator(/[^0-9*,\-/]/, 0, 23),
    minute: createTokenValidator(/[^0-9*,\-/]/, 0, 59),
    month: createTokenValidator(/[^0-9*,\-/]/, 1, 12),
  },
});
