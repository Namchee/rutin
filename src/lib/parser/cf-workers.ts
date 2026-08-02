import { createScheduleParser } from './base';
import { createTokenValidator } from './validator';

const DayToNumber = {
  fri: 5,
  mon: 1,
  sat: 6,
  sun: 7,
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

export const CloudflareWorkersParser = createScheduleParser({
  fieldOrder: ['minute', 'hour', 'dayOfMonth', 'month', 'dayOfWeek'],
  fields: {
    dayOfMonth: { max: 31, min: 1 },
    dayOfWeek: { aliases: DayToNumber, max: 7, min: 1 },
    hour: { max: 23, min: 0 },
    minute: { max: 59, min: 0 },
    month: { aliases: MonthToNumber, max: 12, min: 1 },
  },
  tokenRange: [5, 5],
  validators: {
    dayOfMonth: createTokenValidator(/[^0-9*,\-/LW]/i, 1, 31),
    dayOfWeek: createTokenValidator(/[^0-9*,\-/L#]/i, 1, 7, (token: string): string => {
      const dayRegex = new RegExp(Object.keys(DayToNumber).join('|'), 'gi');
      return token.replace(dayRegex, matched =>
        DayToNumber[matched.toLowerCase() as keyof typeof DayToNumber].toString(),
      );
    }),
    hour: createTokenValidator(/[^0-9*,\-/]/, 0, 23),
    minute: createTokenValidator(/[^0-9*,\-/]/, 0, 59),
    month: createTokenValidator(/[^0-9*,\-/]/, 1, 12, (token: string): string => {
      const monthRegex = new RegExp(Object.keys(MonthToNumber).join('|'), 'gi');
      return token.replace(monthRegex, matched =>
        MonthToNumber[matched.toLowerCase() as keyof typeof MonthToNumber].toString(),
      );
    }),
  },
});
