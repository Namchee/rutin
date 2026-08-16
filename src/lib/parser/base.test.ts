import { describe, expect, it } from 'vitest';

import { daysInMonth } from './base';
import { QuartzParser } from './quartz';
import { UNIXParser } from './unix';

const START = Temporal.PlainDateTime.from('2026-07-01T00:00:00');

function fires(expr: string, count: number): Temporal.PlainDateTime[] {
  const dates: Temporal.PlainDateTime[] = [];
  for (const d of UNIXParser.iterate(expr, START)) {
    dates.push(d);
    if (dates.length === count) break;
  }
  return dates;
}

describe('daysInMonth', () => {
  it('returns 28 days for February of a common year', () => {
    expect(daysInMonth(2026, 2)).toBe(28);
  });

  it('returns 29 days for February of a leap year', () => {
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2000, 2)).toBe(29);
    expect(daysInMonth(1900, 2)).toBe(28);
  });

  it('returns 30 and 31 day months correctly', () => {
    expect(daysInMonth(2026, 4)).toBe(30);
    expect(daysInMonth(2026, 6)).toBe(30);
    expect(daysInMonth(2026, 9)).toBe(30);
    expect(daysInMonth(2026, 11)).toBe(30);
    expect(daysInMonth(2026, 1)).toBe(31);
    expect(daysInMonth(2026, 3)).toBe(31);
    expect(daysInMonth(2026, 12)).toBe(31);
  });
});

describe('getNumericRange', () => {
  it('expands wildcards to the full range', () => {
    const all = UNIXParser.getNumericRange('*', 0, 59);
    expect(all).toHaveLength(60);
    expect(all[0]).toBe(0);
    expect(all[59]).toBe(59);
    expect(UNIXParser.getNumericRange('?', 0, 59)).toEqual(all);
  });

  it('expands plain ranges', () => {
    expect(UNIXParser.getNumericRange('1-5', 0, 59)).toEqual([1, 2, 3, 4, 5]);
    expect(UNIXParser.getNumericRange('0-7', 0, 7)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });

  it('expands comma lists preserving order', () => {
    expect(UNIXParser.getNumericRange('1,3,5', 1, 31)).toEqual([1, 3, 5]);
  });

  it('expands wildcard steps', () => {
    expect(UNIXParser.getNumericRange('*/15', 0, 59)).toEqual([0, 15, 30, 45]);
  });

  it('expands range steps', () => {
    expect(UNIXParser.getNumericRange('5-10/2', 0, 59)).toEqual([5, 7, 9]);
  });

  it('expands value steps starting at the value', () => {
    expect(UNIXParser.getNumericRange('2/10', 0, 59)).toEqual([2, 12, 22, 32, 42, 52]);
  });

  it('deduplicates overlapping tokens', () => {
    expect(UNIXParser.getNumericRange('1-3,2-4', 0, 59)).toEqual([1, 2, 3, 4]);
  });

  it('throws on unparseable tokens', () => {
    expect(() => UNIXParser.getNumericRange('foo', 0, 59)).toThrow();
    expect(() => UNIXParser.getNumericRange('', 0, 59)).toThrow();
  });
});

describe('collapseExpressions', () => {
  const DOM = { max: 31, min: 1 };
  const DOW = { max: 7, min: 0 };

  it('collapses consecutive lists into ranges', () => {
    expect(UNIXParser.collapseExpressions('1,2,3', DOM)).toBe('1-3');
    expect(UNIXParser.collapseExpressions('1,2,3,5,6,7', DOM)).toBe('1-3,5-7');
  });

  it('collapses a full-range list into a wildcard', () => {
    expect(UNIXParser.collapseExpressions('1-31', DOM)).toBe('*');
    expect(UNIXParser.collapseExpressions('*', DOM)).toBe('*');
  });

  it('leaves step expressions untouched', () => {
    expect(UNIXParser.collapseExpressions('1-31/2', DOM)).toBe('1-31/2');
    expect(UNIXParser.collapseExpressions('*/5', { max: 59, min: 0 })).toBe('*/5');
  });

  it('leaves partial dow ranges untouched (0 and 7 are both Sunday)', () => {
    expect(UNIXParser.collapseExpressions('1-7', DOW)).toBe('1-7');
    expect(UNIXParser.collapseExpressions('0-7', DOW)).toBe('*');
  });

  it('preserves the ? token', () => {
    expect(UNIXParser.collapseExpressions('?', DOM)).toBe('?');
  });

  it('replaces name aliases before collapsing', () => {
    expect(
      UNIXParser.collapseExpressions('MON-FRI', { aliases: { fri: 5, mon: 1 }, max: 7, min: 0 }),
    ).toBe('1-5');
  });

  it('returns the token untouched when it cannot be expanded', () => {
    expect(UNIXParser.collapseExpressions('bogus', DOM)).toBe('bogus');
  });
});

describe('normalize', () => {
  it('trims and collapses internal whitespace', () => {
    expect(UNIXParser.normalize('  0   12  * * *  ').value).toBe('0 12 * * *');
  });

  it('replaces day aliases with numbers', () => {
    expect(UNIXParser.normalize('0 0 * * SUN').value).toBe('0 0 * * 0');
    expect(UNIXParser.normalize('0 0 * * MON-FRI').value).toBe('0 0 * * 1-5');
  });

  it('replaces month aliases with numbers', () => {
    expect(UNIXParser.normalize('0 0 1 JAN,MAR *').value).toBe('0 0 1 1,3 *');
    expect(UNIXParser.normalize('0 0 1 FEB *').value).toBe('0 0 1 2 *');
  });

  it('compresses redundant lists into ranges', () => {
    expect(UNIXParser.normalize('0 0 1,2,3 * *').value).toBe('0 0 1-3 * *');
  });

  it('leaves already-normal expressions untouched', () => {
    expect(UNIXParser.normalize('0 12 * * *').value).toBe('0 12 * * *');
  });

  it('leaves macros untouched', () => {
    expect(UNIXParser.normalize('@daily').value).toBe('@daily');
  });

  it('keeps token positions aligned with the output', () => {
    const { tokens } = UNIXParser.normalize('0 0 * * SUN');
    expect(tokens.dayOfWeek).toEqual({ position: [8, 9], value: '0' });
  });
});

describe('applyAliases', () => {
  it('replaces day names and keeps positions', () => {
    const out = UNIXParser.applyAliases({
      dayOfWeek: { position: [8, 11], value: 'SUN' },
      month: { position: [6, 9], value: 'JAN' },
    });
    expect(out.dayOfWeek).toEqual({ position: [8, 9], value: '0' });
    expect(out.month).toEqual({ position: [6, 7], value: '1' });
  });

  it('handles mixed-case names', () => {
    expect(
      UNIXParser.applyAliases({ dayOfWeek: { position: [0, 3], value: 'Sun' } }).dayOfWeek?.value,
    ).toBe('0');
  });

  it('leaves fields without aliases untouched', () => {
    expect(UNIXParser.applyAliases({ minute: { position: [0, 1], value: '30' } }).minute).toEqual({
      position: [0, 1],
      value: '30',
    });
  });
});

describe('isNormal', () => {
  it('returns true for canonical expressions', () => {
    expect(UNIXParser.isNormal('0 12 * * *')).toBe(true);
    expect(UNIXParser.isNormal('0 0 1 1,4,7,10 *')).toBe(true);
  });

  it('returns false when aliases or lists need normalization', () => {
    expect(UNIXParser.isNormal('0 0 * * SUN')).toBe(false);
    expect(UNIXParser.isNormal('0 0 1,2,3 * *')).toBe(false);
  });
});

describe('iterator: POSIX DOW (Unix)', () => {
  it('0 12 * * 0 fires on every Sunday (regression for infinite loop)', () => {
    const dates = fires('0 12 * * 0', 3);
    expect(dates.length).toBe(3);
    expect(dates.every(d => d.dayOfWeek === 7)).toBe(true);
    expect(dates[0].toString().slice(0, 10)).toBe('2026-07-05');
  });

  it('0 12 * * SUN fires on every Sunday (name alias for 0)', () => {
    const dates = fires('0 12 * * SUN', 3);
    expect(dates.every(d => d.dayOfWeek === 7)).toBe(true);
  });

  it('0 12 * * 1 fires on every Monday', () => {
    const dates = fires('0 12 * * 1', 3);
    expect(dates.every(d => d.dayOfWeek === 1)).toBe(true);
  });

  it('0 12 * * 0,6 fires on Sunday AND Saturday', () => {
    const dates = fires('0 12 * * 0,6', 6);
    expect(dates.every(d => d.dayOfWeek === 7 || d.dayOfWeek === 6)).toBe(true);
    const dows = new Set(dates.slice(0, 4).map(d => d.dayOfWeek));
    expect(dows.has(6)).toBe(true);
    expect(dows.has(7)).toBe(true);
  });

  it('0 12 * * 0-6 fires every day (range covers full week)', () => {
    const dates = fires('0 12 * * 0-6', 7);
    expect(dates.length).toBe(7);
    const dows = new Set(dates.map(d => d.dayOfWeek));
    expect(dows.size).toBe(7);
  });
});

describe('iterator: day-of-month special tokens', () => {
  it('L fires on the last day of the month', () => {
    const dates = fires('0 0 L * *', 3);
    expect(dates.map(d => d.toString().slice(0, 10))).toEqual([
      '2026-07-31',
      '2026-08-31',
      '2026-09-30',
    ]);
  });

  it('LW fires on the last weekday of the month', () => {
    const dates = fires('0 0 LW * *', 3);
    // 2026-07-31 (Fri), 2026-08-31 (Mon), 2026-09-30 (Wed) are all weekdays.
    expect(dates.map(d => d.toString().slice(0, 10))).toEqual([
      '2026-07-31',
      '2026-08-31',
      '2026-09-30',
    ]);
    expect(dates.every(d => d.dayOfWeek <= 5)).toBe(true);
  });

  it('NW fires on the nearest weekday to day N', () => {
    const dates = fires('0 0 15W * *', 3);
    expect(dates.map(d => d.toString().slice(0, 10))).toEqual([
      '2026-07-15',
      '2026-08-14',
      '2026-09-15',
    ]);
  });

  it('L-N fires N days before the last day of the month', () => {
    const dates = fires('0 0 L-3 * *', 3);
    expect(dates.map(d => d.toString().slice(0, 10))).toEqual([
      '2026-07-28',
      '2026-08-28',
      '2026-09-27',
    ]);
  });

  it('dom lists and steps iterate in order', () => {
    expect(fires('0 12 1,15 * *', 3).map(d => d.toString().slice(0, 10))).toEqual([
      '2026-07-01',
      '2026-07-15',
      '2026-08-01',
    ]);
    expect(fires('0 12 */2 * *', 3).map(d => d.toString().slice(0, 10))).toEqual([
      '2026-07-01',
      '2026-07-03',
      '2026-07-05',
    ]);
  });
});

describe('iterator: day-of-week special tokens', () => {
  it('NL fires on the last weekday of the month', () => {
    const dates = fires('0 0 * * 1L', 3);
    expect(dates.map(d => d.toString().slice(0, 10))).toEqual([
      '2026-07-27',
      '2026-08-31',
      '2026-09-28',
    ]);
  });

  it('6L fires on the last Saturday', () => {
    const dates = fires('0 0 * * 6L', 3);
    expect(dates.map(d => d.toString().slice(0, 10))).toEqual([
      '2026-07-25',
      '2026-08-29',
      '2026-09-26',
    ]);
  });

  it('N#M fires on the Nth weekday of the month', () => {
    const dates = fires('0 0 * * 5#3', 3);
    expect(dates.map(d => d.toString().slice(0, 10))).toEqual([
      '2026-07-17',
      '2026-08-21',
      '2026-09-18',
    ]);
    expect(dates.every(d => d.dayOfWeek === 5)).toBe(true);
  });

  it('dow lists iterate in weekday order', () => {
    expect(fires('0 12 * * 1,3,5', 3).map(d => d.toString().slice(0, 10))).toEqual([
      '2026-07-01',
      '2026-07-03',
      '2026-07-06',
    ]);
  });
});

describe('iterator: time and month steps', () => {
  it('*/15 fires every quarter hour', () => {
    expect(fires('*/15 * * * *', 3).map(d => d.toString().slice(11, 16))).toEqual([
      '00:15',
      '00:30',
      '00:45',
    ]);
  });

  it('*/2 on hour fires every other hour', () => {
    expect(fires('0 */2 * * *', 3).map(d => d.toString().slice(11, 16))).toEqual([
      '02:00',
      '04:00',
      '06:00',
    ]);
  });

  it('*/3 on month fires on Jan/Apr/Jul/Oct', () => {
    expect(fires('0 0 1 */3 *', 3).map(d => d.toString().slice(0, 10))).toEqual([
      '2026-10-01',
      '2027-01-01',
      '2027-04-01',
    ]);
  });

  it('month names iterate via aliases', () => {
    expect(fires('0 12 * JAN,JUN *', 3).map(d => d.toString().slice(0, 10))).toEqual([
      '2027-01-01',
      '2027-01-02',
      '2027-01-03',
    ]);
  });

  it('stepped dow ranges include Sunday via the 0/7 alias', () => {
    const dates = fires('0 0 * * 0-6/2', 3);
    // 0,2,4,6 => Sun, Tue, Thu, Sat
    expect(dates.map(d => d.toString().slice(0, 10))).toEqual([
      '2026-07-02',
      '2026-07-04',
      '2026-07-05',
    ]);
  });
});

describe('iterator: one-based DOW (Quartz/Amazon)', () => {
  function firesWith(
    parser: {
      iterate: (e: string, s: Temporal.PlainDateTime) => Generator<Temporal.PlainDateTime>;
    },
    expr: string,
    count: number,
  ): Temporal.PlainDateTime[] {
    const dates: Temporal.PlainDateTime[] = [];
    for (const d of parser.iterate(expr, START)) {
      dates.push(d);
      if (dates.length === count) break;
    }
    return dates;
  }

  it('quartz dow 1 means Sunday', () => {
    const dates = firesWith(QuartzParser, '0 0 12 ? * 1 *', 2);
    expect(dates.every(d => d.dayOfWeek === 7)).toBe(true);
    expect(dates[0].toString().slice(0, 10)).toBe('2026-07-05');
  });

  it('quartz dow 7 means Saturday', () => {
    const dates = firesWith(QuartzParser, '0 0 12 ? * 7 *', 2);
    expect(dates.every(d => d.dayOfWeek === 6)).toBe(true);
    expect(dates[0].toString().slice(0, 10)).toBe('2026-07-04');
  });

  it('quartz dow 0 is an alternate spelling of Sunday', () => {
    const dates = firesWith(QuartzParser, '0 0 12 ? * 0 *', 2);
    expect(dates.every(d => d.dayOfWeek === 7)).toBe(true);
  });

  it('quartz 6L is the last Friday', () => {
    const dates = firesWith(QuartzParser, '0 0 12 ? * 6L *', 2);
    expect(dates[0].toString().slice(0, 10)).toBe('2026-07-31');
  });

  it('quartz 5#3 is the 3rd Thursday', () => {
    const dates = firesWith(QuartzParser, '0 0 12 ? * 5#3 *', 2);
    expect(dates[0].toString().slice(0, 10)).toBe('2026-07-16');
    expect(dates[0].dayOfWeek).toBe(4);
  });

  it('quartz 1-5 with ? dom iterates Sun-Thu', () => {
    const dates = firesWith(QuartzParser, '0 0 12 ? * 1-5 *', 3);
    // 1-5 is Sun..Thu in the one-based convention.
    expect(dates.map(d => d.toString().slice(0, 10))).toEqual([
      '2026-07-01',
      '2026-07-02',
      '2026-07-05',
    ]);
  });
});

describe('iterator: year support', () => {
  function firesInYear(expr: string, count: number): Temporal.PlainDateTime[] {
    const dates: Temporal.PlainDateTime[] = [];
    for (const d of QuartzParser.iterate(expr, START)) {
      dates.push(d);
      if (dates.length === count) break;
    }
    return dates;
  }

  it('0 0 0 1 1 ? 2027 fires on 2027-01-01 only', () => {
    const dates = firesInYear('0 0 0 1 1 ? 2027', 2);
    expect(dates.length).toBe(1);
    expect(dates[0].toString().slice(0, 10)).toBe('2027-01-01');
  });

  it('a year range skips to the first allowed year', () => {
    const dates = firesInYear('0 0 0 1 1 ? 2026-2027', 2);
    expect(dates.length).toBe(1);
    expect(dates[0].toString().slice(0, 10)).toBe('2027-01-01');
  });

  it('a year in the past yields no matches', () => {
    expect(firesInYear('0 0 0 1 1 ? 2020', 1)).toEqual([]);
  });
});
