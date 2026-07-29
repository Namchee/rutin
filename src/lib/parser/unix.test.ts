import { Temporal } from '@js-temporal/polyfill';
import { describe, expect, it } from 'vitest';

import { POSIXParser } from './posix';

/**
 * Pull the first `count` executions of an expression.
 *
 * The generator is seeded from the current time, so these assert invariants that
 * hold for any starting point rather than fixed timestamps.
 */
function fires(expr: string, count: number): Temporal.PlainDateTime[] {
  const result = POSIXParser.validate(expr);

  if (result.status !== 'valid') {
    throw new Error(`expected ${expr} to be valid, got ${result.status}`);
  }

  const dates: Temporal.PlainDateTime[] = [];
  for (const date of result.generator as Generator<Temporal.PlainDateTime>) {
    dates.push(date);

    if (dates.length === count) {
      break;
    }
  }

  return dates;
}

describe('POSIXParser.normalize', () => {
  it('should expand a macro into its equivalent expression', () => {
    const input = '@daily';

    const expected = '0 0 * * *';
    const actual = POSIXParser.normalize(input);

    expect(actual).toBe(expected);
  });

  it('should collapse repeated whitespace into single spaces', () => {
    const input = '  0  0 *\t\t* *  ';

    const expected = '0 0 * * *';
    const actual = POSIXParser.normalize(input);

    expect(actual).toBe(expected);
  });

  it('should collapse a field that already covers its whole range', () => {
    const input = '1,2,* * * * *';

    const expected = '* * * * *';
    const actual = POSIXParser.normalize(input);

    expect(actual).toBe(expected);
  });

  it('should sort out-of-order values', () => {
    const input = '2,1 * * * *';

    const expected = '1,2 * * * *';
    const actual = POSIXParser.normalize(input);

    expect(actual).toBe(expected);
  });

  it('should collapse a run of three or more into a range', () => {
    const input = '1,2,3 * * * *';

    const expected = '1-3 * * * *';
    const actual = POSIXParser.normalize(input);

    expect(actual).toBe(expected);
  });

  it('should absorb a value already covered by a range', () => {
    const input = '1-3,2 * * * *';

    const expected = '1-3 * * * *';
    const actual = POSIXParser.normalize(input);

    expect(actual).toBe(expected);
  });

  it('should fold month names into numbers', () => {
    const input = '0 0 * JAN-MAR *';

    const expected = '0 0 * 1-3 *';
    const actual = POSIXParser.normalize(input);

    expect(actual).toBe(expected);
  });

  it('should fold day names into numbers', () => {
    const input = '0 0 * * SUN';

    const expected = '0 0 * * 0';
    const actual = POSIXParser.normalize(input);

    expect(actual).toBe(expected);
  });

  // expanding */15 into 0,15,30,45 would be correct but longer, so steps are left alone
  it('should leave steps untouched', () => {
    const input = '*/15 * * * *';

    const expected = '*/15 * * * *';
    const actual = POSIXParser.normalize(input);

    expect(actual).toBe(expected);
  });

  it('should leave an incomplete expression alone apart from its fields', () => {
    const input = '0 0';

    const expected = '0 0';
    const actual = POSIXParser.normalize(input);

    expect(actual).toBe(expected);
  });

  // the Normalize button disables itself off isNormal, so a second pass must be a no-op
  it.each([
    '1,2,* * * * *',
    '2,1 * * * *',
    '@daily',
    '  0  0 * JAN SUN',
    '*/15 * * * *',
  ])('should be idempotent for %s', input => {
    const once = POSIXParser.normalize(input);

    const expected = once;
    const actual = POSIXParser.normalize(once);

    expect(actual).toBe(expected);
  });
});

describe('POSIXParser.isNormal', () => {
  it.each([
    '0 0 * * *',
    '1,2 * * * *',
    '1-3 * * * *',
    '*/15 * * * *',
  ])('should report %s as normal', input => {
    const expected = true;
    const actual = POSIXParser.isNormal(input);

    expect(actual).toBe(expected);
  });

  it.each([
    '0  0 * * *',
    ' 0 0 * * *',
    '1,2,* * * * *',
    '2,1 * * * *',
    '0 0 * JAN *',
    '@daily',
  ])('should report %s as not normal', input => {
    const expected = false;
    const actual = POSIXParser.isNormal(input);

    expect(actual).toBe(expected);
  });

  it('should report a normalized expression as normal', () => {
    const input = POSIXParser.normalize('  0  0 * JAN,FEB SUN');

    const expected = true;
    const actual = POSIXParser.isNormal(input);

    expect(actual).toBe(expected);
  });
});

describe('POSIXParser.validate', () => {
  it('should accept a complete expression', () => {
    const input = '0 0 * * *';

    const expected = 'valid';
    const actual = POSIXParser.validate(input).status;

    expect(actual).toBe(expected);
  });

  it('should report a partial expression as incomplete', () => {
    const input = '0 0 *';

    const expected = 'incomplete';
    const actual = POSIXParser.validate(input).status;

    expect(actual).toBe(expected);
  });

  it('should reject an expression with too many fields', () => {
    const input = '0 0 * * * *';

    const expected = 'invalid';
    const actual = POSIXParser.validate(input).status;

    expect(actual).toBe(expected);
  });

  it('should report which fields are out of bounds', () => {
    const input = '99 0 * * 9';

    const result = POSIXParser.validate(input);

    const expected = [0, 4];
    const actual = result.status === 'valid' ? [] : result.error;

    expect(actual).toEqual(expected);
  });

  it('should keep the raw tokens rather than the normalized ones', () => {
    const input = '0 0 * JAN SUN';

    const expected = ['0', '0', '*', 'JAN', 'SUN'];
    const actual = POSIXParser.validate(input).tokens;

    expect(actual).toEqual(expected);
  });

  it('should expand a complete macro into its tokens', () => {
    const input = '@daily';

    const expected = ['0', '0', '*', '*', '*'];
    const actual = POSIXParser.validate(input).tokens;

    expect(actual).toEqual(expected);
  });

  it('should report a macro prefix as incomplete', () => {
    const input = '@dai';

    const expected = 'incomplete';
    const actual = POSIXParser.validate(input).status;

    expect(actual).toBe(expected);
  });

  it('should reject an unknown macro', () => {
    const input = '@nope';

    const expected = 'invalid';
    const actual = POSIXParser.validate(input).status;

    expect(actual).toBe(expected);
  });

  it('should reject a field with an empty comma-separated value', () => {
    const input = '1,,2 * * * *';

    const expected = 'invalid';
    const actual = POSIXParser.validate(input).status;

    expect(actual).toBe(expected);
  });

  // L, W, # and ? are Quartz and AWS extensions; POSIX cron has no such forms
  it.each([
    '0 0 L * *',
    '0 0 L-3 * *',
    '0 0 LW * *',
    '0 0 15W * *',
    '0 0 * * 5L',
    '0 0 * * 5#3',
    '0 0 ? * 5',
  ])('should reject the non-POSIX expression %s', input => {
    const expected = 'invalid';
    const actual = POSIXParser.validate(input).status;

    expect(actual).toBe(expected);
  });
});

describe('POSIXParser execution times', () => {
  it('should yield strictly increasing times', () => {
    const dates = fires('*/7 * * * *', 24);

    const expected = true;
    const actual = dates.every(
      (d, i) => i === 0 || Temporal.PlainDateTime.compare(d, dates[i - 1]) > 0,
    );

    expect(actual).toBe(expected);
  });

  it('should fire at midnight every day', () => {
    const dates = fires('0 0 * * *', 12);

    const expected = true;
    const actual = dates.every(d => d.hour === 0 && d.minute === 0);

    expect(actual).toBe(expected);
  });

  it('should honour a step', () => {
    const dates = fires('*/15 * * * *', 12);

    const expected = true;
    const actual = dates.every(d => d.minute % 15 === 0);

    expect(actual).toBe(expected);
  });

  // out-of-order values used to be scanned in insertion order, which skipped the smaller one
  it('should not skip a value written out of order', () => {
    const minutes = fires('5,1 * * * *', 6).map(d => d.minute);

    const expected = true;
    const actual = minutes.every(
      (m, i) => (m === 1 || m === 5) && (i === 0 || m !== minutes[i - 1]),
    );

    expect(actual).toBe(expected);
  });

  it('should restrict to a single month', () => {
    const dates = fires('0 0 1 1 *', 3);

    const expected = true;
    const actual = dates.every(d => d.month === 1 && d.day === 1);

    expect(actual).toBe(expected);
  });

  // when only one of day-of-month / day-of-week is restricted, the other is wild and they AND
  it('should AND the date fields when day-of-week is wild', () => {
    const dates = fires('0 0 1 * *', 6);

    const expected = true;
    const actual = dates.every(d => d.day === 1);

    expect(actual).toBe(expected);
  });

  it('should AND the date fields when day-of-month is wild', () => {
    const dates = fires('0 0 * * 5', 6);

    const expected = true;
    const actual = dates.every(d => d.dayOfWeek === 5);

    expect(actual).toBe(expected);
  });

  // when both are restricted the rule flips to OR, which is the POSIX quirk
  it('should OR the date fields when both are restricted', () => {
    const dates = fires('0 0 1 * 5', 12);

    const matchesEither = dates.every(d => d.day === 1 || d.dayOfWeek === 5);
    const hasDayOfWeekOnly = dates.some(d => d.day !== 1 && d.dayOfWeek === 5);

    expect(matchesEither).toBe(true);
    expect(hasDayOfWeekOnly).toBe(true);
  });

  it('should terminate without yielding when the date can never occur', () => {
    const expected: Temporal.PlainDateTime[] = [];
    const actual = fires('0 0 30 2 *', 1);

    expect(actual).toEqual(expected);
  });
});
