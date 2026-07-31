import { Temporal } from '@js-temporal/polyfill';
import { describe, expect, it } from 'vitest';

import { CloudflareWorkersParser } from './cf-workers';

const START = Temporal.PlainDateTime.from('2026-07-01T00:00:00');

/**
 * Drive the iterator directly. Some L/W/# tokens (e.g. `5W` in DoW) are
 * not understood by `cronstrue`, so we bypass `validate()` and pull
 * dates straight out of the generator.
 */
function fires(expr: string, count: number): Temporal.PlainDateTime[] {
  const dates: Temporal.PlainDateTime[] = [];
  for (const d of CloudflareWorkersParser.iterate(expr, START)) {
    dates.push(d);
    if (dates.length === count) break;
  }
  return dates;
}

const validate = (expr: string) => CloudflareWorkersParser.validate(expr);
const normalize = (expr: string) => CloudflareWorkersParser.normalize(expr);
const isNormal = (expr: string) => CloudflareWorkersParser.isNormal(expr);

describe('CloudflareWorkersParser', () => {
  describe('validate', () => {
    it('accepts a complete 5-field expression', () => {
      expect(validate('0 12 * * *').status).toBe('valid');
    });

    it('reports a partial expression as incomplete', () => {
      const result = validate('0 12 *');
      expect(result.status).toBe('incomplete');
    });

    it('rejects an expression with too many fields', () => {
      expect(validate('0 0 * * * *').status).toBe('invalid');
    });

    it('reports which fields are out of bounds', () => {
      const result = validate('99 0 * * 9');
      expect(result.status).toBe('invalid');

      if (result.status === 'invalid') {
        expect(result.error).toEqual([0, 4]);
      }
    });

    it('rejects an empty string', () => {
      expect(validate('').status).toBe('incomplete');
    });

    it('rejects a field with a non-numeric, non-modifier character', () => {
      expect(validate('0 12 * * @').status).toBe('invalid');
    });

    it('rejects L in seconds/minutes/hours (where it is not meaningful)', () => {
      expect(validate('L 0 * * *').status).toBe('invalid');
      expect(validate('0 L * * *').status).toBe('invalid');
      expect(validate('0 0 * L *').status).toBe('invalid'); // L in month
    });

    it('accepts L, W, # in DoM and DoW', () => {
      expect(validate('0 12 L * *').status).toBe('valid');
      expect(validate('0 12 LW * *').status).toBe('valid');
      expect(validate('0 12 15W * *').status).toBe('valid');
      expect(validate('0 12 * * L').status).toBe('valid');
      expect(validate('0 12 * * 5L').status).toBe('valid');
      expect(validate('0 12 * * 5#3').status).toBe('valid');
    });

    it('preserves the raw tokens', () => {
      const result = validate('0 0 * JAN SUN');
      expect(result.tokens).toEqual(['0', '0', '*', 'JAN', 'SUN']);
    });
  });

  describe('normalize', () => {
    it('collapses repeated whitespace into single spaces', () => {
      expect(normalize('  0  0 *\t\t* *  ')).toBe('0 0 * * *');
    });

    it('collapses a field that already covers its whole range', () => {
      expect(normalize('1,2,* * * *')).toBe('* * * *');
    });

    it('sorts out-of-order values', () => {
      expect(normalize('2,1 * * * *')).toBe('1,2 * * * *');
    });

    it('collapses a run of three or more into a range', () => {
      expect(normalize('1,2,3 * * * *')).toBe('1-3 * * * *');
    });

    it('absorbs a value already covered by a range', () => {
      expect(normalize('1-3,2 * * * *')).toBe('1-3 * * * *');
    });

    it('folds month names into numbers', () => {
      expect(normalize('0 0 * JAN-MAR *')).toBe('0 0 * 1-3 *');
    });

    it('folds day names into numbers', () => {
      expect(normalize('0 0 * * SUN')).toBe('0 0 * * 7');
    });

    it('leaves steps untouched', () => {
      expect(normalize('*/15 * * * *')).toBe('*/15 * * * *');
    });

    it('leaves an incomplete expression alone apart from its fields', () => {
      expect(normalize('0 0')).toBe('0 0');
    });

    it.each([
      '1,2,* * * * *',
      '2,1 * * * *',
      '  0  0 * JAN SUN',
      '*/15 * * * *',
    ])('is idempotent for %s', (input) => {
      const once = normalize(input);
      const twice = normalize(once);
      expect(twice).toBe(once);
    });
  });

  describe('isNormal', () => {
    it.each([
      '0 0 * * *',
      '1,2 * * * *',
      '1-3 * * * *',
      '*/15 * * * *',
    ])('reports %s as normal', (input) => {
      expect(isNormal(input)).toBe(true);
    });

    it.each([
      '0  0 * * *',
      ' 0 0 * * *',
      '1,2,* * * * *',
      '2,1 * * * *',
      '0 0 * JAN *',
    ])('reports %s as not normal', (input) => {
      expect(isNormal(input)).toBe(false);
    });

    it('reports a normalized expression as normal', () => {
      const input = normalize('  0  0 * JAN,FEB SUN');
      expect(isNormal(input)).toBe(true);
    });
  });

  describe('convert', () => {
    it('converts from unix by normalizing', () => {
      expect(CloudflareWorkersParser.convert('0 12 * * *', 'unix')).toBe('0 12 * * *');
    });

    it('strips the seconds field from a 7-token quartz expression', () => {
      expect(CloudflareWorkersParser.convert('0 0 12 * * * 2026', 'quartz')).toBe('0 12 * * *');
    });

    it('strips the seconds field from a 6-token quartz expression', () => {
      expect(CloudflareWorkersParser.convert('0 12 * * * *', 'quartz')).toBe('12 * * * *');
    });

    it('returns empty string for an unsupported source format', () => {
      expect(CloudflareWorkersParser.convert('0 12 * * *', 'systemd')).toBe('');
    });

    it('returns empty string for a quartz expression with the wrong shape', () => {
      expect(CloudflareWorkersParser.convert('0 12 * * *', 'quartz')).toBe('');
    });
  });

  describe('iterate (basic syntax)', () => {
    it('honours a step', () => {
      const dates = fires('*/15 * * * *', 4);
      expect(dates.every(d => d.minute % 15 === 0)).toBe(true);
    });

    it('honours a range', () => {
      const dates = fires('0 0 1-5 * *', 4);
      expect(dates.map(d => d.day)).toEqual([2, 3, 4, 5]);
    });

    it('honours a list of values', () => {
      const dates = fires('0 0 1,15,28 * *', 4);
      expect(dates.map(d => d.day)).toEqual([15, 28, 1, 15]);
    });

    it('fires at midnight every day', () => {
      const dates = fires('0 0 * * *', 4);
      expect(dates.every(d => d.hour === 0 && d.minute === 0)).toBe(true);
    });

    it('fires every hour on the hour', () => {
      const dates = fires('0 * * * *', 4);
      expect(dates.every(d => d.minute === 0)).toBe(true);
    });

    it('restricts to a single month', () => {
      const dates = fires('0 0 1 1 *', 3);
      expect(dates.every(d => d.month === 1 && d.day === 1)).toBe(true);
    });

    it('AND-s the date fields when day-of-week is wild', () => {
      const dates = fires('0 0 1 * *', 4);
      expect(dates.every(d => d.day === 1)).toBe(true);
    });

    it('AND-s the date fields when day-of-month is wild', () => {
      const dates = fires('0 0 * * 5', 4);
      expect(dates.every(d => d.dayOfWeek === 5)).toBe(true);
    });

    it('OR-s the date fields when both are restricted (POSIX quirk)', () => {
      const dates = fires('0 0 1 * 5', 12);
      const matchesEither = dates.every(d => d.day === 1 || d.dayOfWeek === 5);
      const hasFridayOnly = dates.some(d => d.day !== 1 && d.dayOfWeek === 5);
      expect(matchesEither).toBe(true);
      expect(hasFridayOnly).toBe(true);
    });

    it('yields strictly increasing times', () => {
      const dates = fires('*/7 * * * *', 24);
      const isStrictlyIncreasing = dates.every(
        (d, i) => i === 0 || Temporal.PlainDateTime.compare(d, dates[i - 1]) > 0,
      );
      expect(isStrictlyIncreasing).toBe(true);
    });
  });

  describe('iterate (day and month names)', () => {
    it('honours day name SUN (Sun=7 in local convention)', () => {
      const dates = fires('0 12 * * SUN', 3);
      expect(dates.every(d => d.dayOfWeek === 7)).toBe(true);
    });

    it('honours day name MON (Mon=1 in local convention)', () => {
      const dates = fires('0 12 * * MON', 3);
      expect(dates.every(d => d.dayOfWeek === 1)).toBe(true);
    });

    it('honours month name JAN', () => {
      const dates = fires('0 12 1 JAN *', 3);
      expect(dates.every(d => d.month === 1 && d.day === 1)).toBe(true);
    });

    it('honours a month range', () => {
      const dates = fires('0 12 1 JAN-MAR *', 3);
      expect(dates.every(d => d.month >= 1 && d.month <= 3)).toBe(true);
    });
  });

  describe('iterate (L, W, # in DoM/DoW)', () => {
    describe('DoW: L (Saturday)', () => {
      it('fires only on Saturdays', () => {
        const dates = fires('0 12 * * L', 6);

        expect(dates.every(d => d.dayOfWeek === 6)).toBe(true);
        expect(dates.map(d => d.day)).toEqual([4, 11, 18, 25, 1, 8]);
      });
    });

    describe('DoW: 5L (last Friday)', () => {
      it('fires on the last Friday of each month', () => {
        const dates = fires('0 12 * * 5L', 4);

        expect(dates.every(d => d.dayOfWeek === 5)).toBe(true);
        expect(dates.map(d => d.day)).toEqual([31, 28, 25, 30]);
      });
    });

    describe('DoW: 5#3 (3rd Friday)', () => {
      it('fires on the 3rd Friday of each month', () => {
        const dates = fires('0 12 * * 5#3', 3);

        expect(dates.every(d => d.dayOfWeek === 5)).toBe(true);
        expect(dates.map(d => d.day)).toEqual([17, 21, 18]);
      });
    });

    describe('DoW: list with L', () => {
      it('fires on last Friday OR last Tuesday', () => {
        const dates = fires('0 12 * * 5L,2L', 6);

        expect(dates.every(d => d.dayOfWeek === 5 || d.dayOfWeek === 2)).toBe(true);
        expect(dates[0].day).toBe(28);
        expect(dates[1].day).toBe(31);
      });
    });

    describe('DoW: 5#3 combined with 5L', () => {
      it('fires on 3rd OR last Friday', () => {
        const dates = fires('0 12 * * 5#3,5L', 4);

        expect(dates.every(d => d.dayOfWeek === 5)).toBe(true);
        expect(dates[0].day).toBe(17);
        expect(dates[1].day).toBe(31);
      });
    });

    describe('DoW: 5W (nearest weekday to the 5th)', () => {
      it('fires on a weekday near the 5th', () => {
        const dates = fires('0 12 * * 5W', 4);

        expect(dates.every(d => d.dayOfWeek >= 1 && d.dayOfWeek <= 5)).toBe(true);
        expect(dates[0].day).toBe(6);
        expect(dates[1].day).toBe(5);
      });
    });

    describe('DoM: L (last day of month)', () => {
      it('fires on the last day of each month', () => {
        const dates = fires('0 12 L * *', 4);
        expect(dates.map(d => d.day)).toEqual([31, 31, 30, 31]);
      });
    });

    describe('DoM: LW (last weekday of month)', () => {
      it('fires on the last weekday, never on a weekend', () => {
        const dates = fires('0 12 LW * *', 4);

        expect(dates.every(d => d.dayOfWeek >= 1 && d.dayOfWeek <= 5)).toBe(true);
        expect(dates[0].day).toBe(31);
        expect(dates[1].day).toBe(31);
      });
    });

    describe('DoM: 15W (nearest weekday to the 15th)', () => {
      it('fires on the nearest weekday to the 15th', () => {
        const dates = fires('0 12 15W * *', 3);

        expect(dates.every(d => d.dayOfWeek >= 1 && d.dayOfWeek <= 5)).toBe(true);
        expect(dates[0].day).toBe(15);
        expect(dates[1].day).toBe(14);
      });
    });

    describe('DoM: list with W and LW', () => {
      it('fires on 1W OR LW', () => {
        const dates = fires('0 12 1W,LW * *', 4);

        expect(dates.every(d => d.dayOfWeek >= 1 && d.dayOfWeek <= 5)).toBe(true);
        expect(dates[0].day).toBe(1);
        expect(dates[1].day).toBe(31);
      });
    });

    describe('DoM: L-N (N days before last day)', () => {
      it('L-3 fires 3 days before the end of the month', () => {
        const dates = fires('0 12 L-3 * *', 4);

        expect(dates.map(d => d.day)).toEqual([28, 28, 27, 28]);
      });

      it('L-5 fires 5 days before the end of the month', () => {
        const dates = fires('0 12 L-5 * *', 4);

        expect(dates.map(d => d.day)).toEqual([26, 26, 25, 26]);
      });
    });

    describe('DoW: L-N (N days before Saturday, wrapping)', () => {
      it('L-3 fires every Wednesday', () => {
        const dates = fires('0 12 * * L-3', 4);
        expect(dates.every(d => d.dayOfWeek === 3)).toBe(true);
      });

      it('L-0 fires every Saturday', () => {
        const dates = fires('0 12 * * L-0', 3);
        expect(dates.every(d => d.dayOfWeek === 6)).toBe(true);
      });

      it('L-7 wraps to Saturday', () => {
        const dates = fires('0 12 * * L-7', 3);
        expect(dates.every(d => d.dayOfWeek === 6)).toBe(true);
      });
    });
  });
});
