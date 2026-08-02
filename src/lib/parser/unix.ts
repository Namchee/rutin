import { createScheduleParser } from './base';
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

export const UNIXParser = createScheduleParser({
  fields: {
    minute: { max: 59, min: 0 },
    hour: { max: 23, min: 0 },
    dayOfMonth: { max: 31, min: 1 },
    month: { aliases: MonthToNumber, max: 12, min: 1 },
    dayOfWeek: { aliases: DayToNumber, max: 7, min: 0 },
  },
  fieldOrder: ['minute', 'hour', 'dayOfMonth', 'month', 'dayOfWeek'],
  tokenRange: [5, 5],
  validators: {
    minute: createTokenValidator(/[^0-9*,\-/]/, 0, 59),
    hour: createTokenValidator(/[^0-9*,\-/]/, 0, 23),
    dayOfMonth: createTokenValidator(/[^0-9*,\-/]/i, 1, 31),
    month: createTokenValidator(/[^0-9*,\-/]/, 1, 12, (token: string): string => {
      const monthRegex = new RegExp(Object.keys(MonthToNumber).join('|'), 'gi');
      return token.replace(monthRegex, matched =>
        MonthToNumber[matched.toLowerCase() as keyof typeof MonthToNumber].toString(),
      );
    }),
    dayOfWeek: createTokenValidator(/[^0-9*,\-/]/i, 0, 6, (token: string): string => {
      const dayRegex = new RegExp(Object.keys(DayToNumber).join('|'), 'gi');
      return token.replace(dayRegex, matched =>
        DayToNumber[matched.toLowerCase() as keyof typeof DayToNumber].toString(),
      );
    }),
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
});
