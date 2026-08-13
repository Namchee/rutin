import { Temporal } from '@js-temporal/polyfill';
import { describe, expect, it } from 'vitest';
import type { ScheduleFormat } from '@/types/schedule';

import { Parsers } from '../parsers';
import { AmazonParser } from './amazon';

function convert(expr: string, from: ScheduleFormat): string {
  const { tokens } = Parsers[from].normalize(expr);
  return AmazonParser.convert(tokens, expr, from).value;
}

describe('convert to amazon', () => {
  it('amazon -> amazon is identity', () => {
    expect(convert('0 12 ? * MON *', 'amazon')).toBe('0 12 ? * MON *');
  });

  it('unix: adds year, shifts dow to one-based', () => {
    expect(convert('0 12 * * *', 'unix')).toBe('0 12 * * * *');
    expect(convert('0 0 * * 1-5', 'unix')).toBe('0 0 * * 2-6 *');
  });

  it('systemd: maps weekday/date/time, keeps year', () => {
    expect(convert('daily', 'systemd')).toBe('0 0 * * * *');
    expect(convert('Mon..Fri *-*-* 09:00:00', 'systemd')).toBe('0 9 * * 2-6 *');
    expect(convert('2024-01-01 00:00:00', 'systemd')).toBe('0 0 1 1 * 2024');
  });

  it('quartz: keeps ? in day-of-month when dow is specific (last friday)', () => {
    expect(convert('0 0 12 ? * 6L *', 'quartz')).toBe('0 12 ? * 6L *');
  });

  it('quartz: keeps ? in day-of-week when dom is specific (last day of month)', () => {
    expect(convert('0 0 12 L * ? *', 'quartz')).toBe('0 12 L * ? *');
  });

  it('unix: expands Fri-Sun dow ranges correctly (regression: 5-7 -> 6-1)', () => {
    expect(convert('0 0 * * 5-7', 'unix')).toBe('0 0 * * 6,7,1 *');
    expect(convert('0 0 * * 5,6,7', 'unix')).toBe('0 0 * * 6,7,1 *');
  });
});

describe('amazon: process status', () => {
  function statusOf(expr: string) {
    const result = AmazonParser.process(expr);
    return { error: result.error, normal: result.normal, status: result.status };
  }

  it('accepts valid 6-field expressions', () => {
    expect(statusOf('0 12 ? * MON *')).toMatchObject({ status: 'valid' });
    expect(statusOf('0 12 * * 2 *')).toMatchObject({ status: 'valid' });
    expect(statusOf('0 0 1 1,4,7,10 ? *')).toMatchObject({ status: 'valid' });
  });

  it('enforces the year bounds 1970-2199', () => {
    expect(statusOf('0 12 ? * 1 1970')).toMatchObject({ status: 'valid' });
    expect(statusOf('0 12 ? * 1 2199')).toMatchObject({ status: 'valid' });
    expect(statusOf('0 12 ? * 1 1969')).toMatchObject({ status: 'invalid', error: ['year'] });
    expect(statusOf('0 12 ? * 1 2200')).toMatchObject({ status: 'invalid', error: ['year'] });
  });

  it('rejects ? in the year field', () => {
    expect(statusOf('0 12 ? * 1 ?')).toMatchObject({ status: 'invalid', error: ['year'] });
  });

  it('rejects out-of-range fields', () => {
    expect(statusOf('60 12 ? * 1 *')).toMatchObject({ status: 'invalid', error: ['minute'] });
    expect(statusOf('0 24 ? * 1 *')).toMatchObject({ status: 'invalid', error: ['hour'] });
    expect(statusOf('0 12 ? * 8 *')).toMatchObject({ status: 'invalid', error: ['dayOfWeek'] });
  });

  it('rejects 7-field (quartz-shaped) input', () => {
    expect(statusOf('0 0 12 ? * 1 *')).toMatchObject({ status: 'invalid' });
  });

  it('treats 5-field expressions as incomplete', () => {
    expect(statusOf('0 12 * * *')).toMatchObject({ status: 'incomplete' });
  });
});

describe('amazon: normalize', () => {
  it('normalizes day and month names', () => {
    expect(AmazonParser.normalize('0 12 ? * MON *').value).toBe('0 12 ? * 2 *');
    expect(AmazonParser.normalize('0 12 ? * MON-FRI *').value).toBe('0 12 ? * 2-6 *');
  });

  it('keeps ? and L tokens untouched', () => {
    expect(AmazonParser.normalize('0 12 ? * 6L *').value).toBe('0 12 ? * 6L *');
    expect(AmazonParser.normalize('0 12 L * ? *').value).toBe('0 12 L * ? *');
  });
});

describe('amazon: iterate', () => {
  const START = Temporal.PlainDateTime.from('2026-07-01T00:00:00');

  function firstN(expr: string, n: number): Temporal.PlainDateTime[] {
    const dates: Temporal.PlainDateTime[] = [];
    for (const d of AmazonParser.iterate(expr, START)) {
      dates.push(d);
      if (dates.length === n) break;
    }
    return dates;
  }

  it('MON iterates on Mondays (regression: was off by one)', () => {
    const dates = firstN('0 12 ? * MON *', 2);
    expect(dates.every(d => d.dayOfWeek === 1)).toBe(true);
    expect(dates[0].toString().slice(0, 10)).toBe('2026-07-06');
  });

  it('6L is the last Friday', () => {
    const dates = firstN('0 12 ? * 6L *', 2);
    expect(dates[0].toString().slice(0, 10)).toBe('2026-07-31');
    expect(dates[0].dayOfWeek).toBe(5);
  });

  it('L in dom fires on the last day of the month', () => {
    expect(firstN('0 12 L * ? *', 2).map(d => d.toString().slice(0, 10))).toEqual([
      '2026-07-31',
      '2026-08-31',
    ]);
  });
});
