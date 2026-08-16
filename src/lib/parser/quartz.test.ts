import { describe, expect, it } from 'vitest';
import type { ScheduleFormat } from '@/types/schedule';

import { Parsers } from '../parsers';
import { QuartzParser } from './quartz';

function convert(expr: string, from: ScheduleFormat): string {
  const { tokens } = Parsers[from].normalize(expr);
  return QuartzParser.convert(tokens, expr, from).value;
}

describe('convert to quartz', () => {
  it('quartz -> quartz is identity', () => {
    expect(convert('0 0 12 ? * 1 *', 'quartz')).toBe('0 0 12 ? * 1 *');
  });

  it('unix: adds seconds, shifts dow to one-based, omits the optional year', () => {
    expect(convert('0 12 * * *', 'unix')).toBe('0 0 12 * * *');
    expect(convert('0 0 * * 1-5', 'unix')).toBe('0 0 0 * * 2-6');

    expect(convert('0 0 1 1,4,7,10 *', 'unix')).toBe('0 0 0 1 1,4,7,10 *');
  });

  it('systemd: maps weekday/date/time, dow one-based', () => {
    expect(convert('daily', 'systemd')).toBe('0 0 0 * * * *');
    expect(convert('Mon..Fri *-*-* 09:00:00', 'systemd')).toBe('0 0 9 * * 2-6 *');
    expect(convert('*-*-15 12:30', 'systemd')).toBe('0 30 12 15 * * *');
  });

  it('amazon: keeps ? in day-of-month when dow is specific (last friday)', () => {
    expect(convert('0 12 ? * 6L *', 'amazon')).toBe('0 0 12 ? * 6L *');
  });

  it('amazon: keeps ? in day-of-week when dom is specific (last day of month)', () => {
    expect(convert('0 12 L * ? *', 'amazon')).toBe('0 0 12 L * ? *');
  });

  it('systemd: keeps the year field (regression: year used to be dropped)', () => {
    expect(convert('2026-01-01 00:00:00', 'systemd')).toBe('0 0 0 1 1 * 2026');
    expect(convert('2026..2027-01-01 00:00:00', 'systemd')).toBe('0 0 0 1 1 * 2026-2027');
  });
});

describe('quartz: process', () => {
  function process(expr: string) {
    return QuartzParser.process(expr);
  }

  it('6-field expression (seconds, no year) is complete and valid', () => {
    expect(QuartzParser.process('0 0 12 ? * 1').status).toBe('valid');
    expect(QuartzParser.process('0 0 12 ? * 6L').status).toBe('valid');
  });

  it('7-field expression stays valid', () => {
    expect(QuartzParser.process('0 0 12 ? * 1 2024').status).toBe('valid');
  });

  it('accepts wildcard year', () => {
    expect(process('0 0 12 ? * 1 *')).toMatchObject({ normal: true, status: 'valid' });
  });

  it('accepts dow 7', () => {
    expect(process('0 0 12 ? * 7 *')).toMatchObject({ status: 'valid' });
  });

  it('treats 5-field expressions as incomplete', () => {
    expect(process('0 12 * * *')).toMatchObject({ status: 'incomplete' });
    expect(process('0 0 * * 1')).toMatchObject({ status: 'incomplete' });
  });

  it('rejects 6 tokens whose third field is not a valid hour (regression: was read as min hour dom month dow year)', () => {
    // Under the old convention `0 17 L * ? 2000` was accepted as
    // minute=0 hour=17 dom=L month=* dow=? year=2000. Quartz's year is the
    // optional field, so 6 tokens are sec..dow and hour=L is invalid.
    const result = process('0 17 L * ? 2000');
    expect(result.status).toBe('invalid');
    if (result.status === 'invalid') {
      expect([...result.error].sort()).toEqual(['dayOfWeek', 'hour', 'month']);
    }
  });

  it('tokenizes 6 fields as sec..dow with no year', () => {
    const result = process('0 0 12 ? * 1');
    expect(result.status).toBe('valid');
    if (result.status === 'valid') {
      expect(result.tokens.second?.value).toBe('0');
      expect(result.tokens.year).toBeUndefined();
    }
  });

  it('enforces the year bounds 1970-2199', () => {
    expect(process('0 0 12 ? * 1 1969')).toMatchObject({ error: ['year'], status: 'invalid' });
    expect(process('0 0 12 ? * 1 2200')).toMatchObject({ error: ['year'], status: 'invalid' });
  });

  it('accepts year ranges but marks them as not normal', () => {
    expect(process('0 0 12 ? * 1 2025-2026')).toMatchObject({
      normal: false,
      status: 'valid',
    });
  });

  it('rejects out-of-range fields', () => {
    expect(process('0 60 12 ? * 1 *')).toMatchObject({ error: ['minute'], status: 'invalid' });
    expect(process('0 0 25 ? * 1 *')).toMatchObject({ error: ['hour'], status: 'invalid' });
    expect(process('0 0 12 ? * 8 *')).toMatchObject({ error: ['dayOfWeek'], status: 'invalid' });
    expect(process('0 0 12 32 * ? *')).toMatchObject({ error: ['dayOfMonth'], status: 'invalid' });
  });
});

describe('quartz: normalize', () => {
  it('normalizes day aliases', () => {
    expect(QuartzParser.normalize('0 0 12 ? * MON-FRI *').value).toBe('0 0 12 ? * 2-6 *');
  });

  it('leaves canonical 6- and 7-field expressions untouched', () => {
    expect(QuartzParser.normalize('0 0 12 ? * 1').value).toBe('0 0 12 ? * 1');
    expect(QuartzParser.normalize('0 0 12 ? * 6L *').value).toBe('0 0 12 ? * 6L *');
    expect(QuartzParser.normalize('0 0 12 L * ? *').value).toBe('0 0 12 L * ? *');
  });
});

describe('quartz: iterate', () => {
  const START = Temporal.PlainDateTime.from('2026-07-01T00:00:00');

  function firstN(expr: string, n: number): Temporal.PlainDateTime[] {
    const dates: Temporal.PlainDateTime[] = [];
    for (const d of QuartzParser.iterate(expr, START)) {
      dates.push(d);
      if (dates.length === n) break;
    }
    return dates;
  }

  it('iterates seconds when the expression has them', () => {
    const dates = firstN('30 0 12 ? * 1 *', 2);
    // dow 1 is Sunday
    expect(dates.map(d => d.toString())).toEqual(['2026-07-05T12:00:30', '2026-07-12T12:00:30']);
  });

  it('L in dom fires on the last day of the month', () => {
    expect(firstN('0 0 12 L * ? *', 2).map(d => d.toString().slice(0, 10))).toEqual([
      '2026-07-31',
      '2026-08-31',
    ]);
  });

  it('15W fires on the nearest weekday', () => {
    expect(firstN('0 0 12 15W * ? *', 2).map(d => d.toString().slice(0, 10))).toEqual([
      '2026-07-15',
      '2026-08-14',
    ]);
  });

  it('stops when the year range is exhausted', () => {
    expect(firstN('0 0 0 1 1 ? 2026-2027', 5)).toEqual([
      Temporal.PlainDateTime.from('2027-01-01T00:00:00'),
    ]);
  });

  it('yields nothing for a past year', () => {
    expect(firstN('0 0 0 1 1 ? 2020', 1)).toEqual([]);
  });
});
