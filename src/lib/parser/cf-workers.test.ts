import { Temporal } from '@js-temporal/polyfill';
import { describe, expect, it } from 'vitest';
import type { ScheduleFormat } from '@/types/schedule';

import { Parsers } from '../parsers';
import { CloudflareWorkersParser } from './cf-workers';

function convert(expr: string, from: ScheduleFormat): string {
  const { tokens } = Parsers[from].normalize(expr);
  return CloudflareWorkersParser.convert(tokens, expr, from).value;
}

describe('convert to cf-workers', () => {
  it('cf-workers -> cf-workers is identity', () => {
    expect(convert('0 12 * * 1', 'cf-workers')).toBe('0 12 * * 1');
  });

  it('unix: shifts dow to one-based', () => {
    expect(convert('0 12 * * 0', 'unix')).toBe('0 12 * * 1');
    expect(convert('0 0 * * 1-5', 'unix')).toBe('0 0 * * 2-6');
    expect(convert('0 0 * * 6,0', 'unix')).toBe('0 0 * * 1,7');
    expect(convert('@daily', 'unix')).toBe('0 0 * * *');
  });

  it('node: drops seconds, shifts dow to one-based', () => {
    expect(convert('0 30 9 * * 1-5', 'node')).toBe('30 9 * * 2-6');
    expect(convert('@weekly', 'node')).toBe('0 0 * * 1');
  });

  it('quartz: drops seconds/year, keeps one-based dow, ? -> *', () => {
    expect(convert('0 0 12 ? * 1 *', 'quartz')).toBe('0 12 * * 1');
    expect(convert('0 0 12 ? * 7 *', 'quartz')).toBe('0 12 * * 7');
    expect(convert('0 30 9 ? * MON-FRI *', 'quartz')).toBe('30 9 * * 2-6');
    expect(convert('0 0 12 L * ? *', 'quartz')).toBe('0 12 L * *');
    expect(convert('0 0 12 ? * 6L *', 'quartz')).toBe('0 12 * * 6L');
  });

  it('amazon: drops year, keeps one-based dow, ? -> *', () => {
    expect(convert('0 12 ? * MON *', 'amazon')).toBe('0 12 * * 2');
    expect(convert('0 0 ? * 2,4 *', 'amazon')).toBe('0 0 * * 2,4');
  });

  it('systemd: maps weekday/date/time onto the 5 fields, dow one-based', () => {
    expect(convert('daily', 'systemd')).toBe('0 0 * * *');
    expect(convert('Mon..Fri *-*-* 09:00:00', 'systemd')).toBe('0 9 * * 2-6');
    expect(convert('Sat,Sun *-*-* 00:00:00', 'systemd')).toBe('0 0 * * 7,1');
    expect(convert('*-*-15 12:30', 'systemd')).toBe('30 12 15 * *');
  });

  it('unix: expands Fri-Sun dow ranges correctly (regression: 5-7 -> 6-1)', () => {
    expect(convert('0 0 * * 5-7', 'unix')).toBe('0 0 * * 6,7,1');
    expect(convert('0 0 * * 5,6,7', 'unix')).toBe('0 0 * * 6,7,1');
    expect(convert('0 0 * * 6-7', 'unix')).toBe('0 0 * * 7,1');
  });
});

describe('cf-workers: process status', () => {
  function process(expr: string) {
    return CloudflareWorkersParser.process(expr);
  }

  it('accepts one-based dow 1 (Sunday) through 7 (Saturday)', () => {
    expect(process('0 12 * * 1')).toMatchObject({ status: 'valid' });
    expect(process('0 12 * * 7')).toMatchObject({ status: 'valid' });
  });

  it('rejects dow 0 and out-of-range values', () => {
    expect(process('0 0 * * 0')).toMatchObject({ error: ['dayOfWeek'], status: 'invalid' });
    expect(process('0 0 * * 8')).toMatchObject({ error: ['dayOfWeek'], status: 'invalid' });
  });

  it('rejects out-of-range minute/hour/month', () => {
    expect(process('60 12 * * *')).toMatchObject({ error: ['minute'], status: 'invalid' });
    expect(process('0 24 * * *')).toMatchObject({ error: ['hour'], status: 'invalid' });
    expect(process('0 12 * 13 *')).toMatchObject({ error: ['month'], status: 'invalid' });
  });

  it('collapses a full-week dow range to a wildcard (not normal)', () => {
    expect(process('0 0 * * 1-7')).toMatchObject({ normal: false, status: 'valid' });
  });

  it('treats missing fields as incomplete', () => {
    expect(process('0 12 * *')).toMatchObject({ status: 'incomplete' });
  });

  it('rejects too many fields as invalid', () => {
    expect(process('0 12 * * * extra')).toMatchObject({ error: [], status: 'invalid' });
  });

  it('does not support @-macros', () => {
    expect(process('@daily')).toMatchObject({ error: ['minute'], status: 'invalid' });
  });
});

describe('cf-workers: normalize', () => {
  it('normalizes names, aliases, and lists', () => {
    expect(CloudflareWorkersParser.normalize('0 0 * * SUN').value).toBe('0 0 * * 1');
    expect(CloudflareWorkersParser.normalize('0 0 1 JAN,MAR *').value).toBe('0 0 1 1,3 *');
    expect(CloudflareWorkersParser.normalize('0 0 1,2,3 * *').value).toBe('0 0 1-3 * *');
  });
});

describe('cf-workers: iterate', () => {
  const START = Temporal.PlainDateTime.from('2026-07-01T00:00:00');

  function firstN(expr: string, n: number): Temporal.PlainDateTime[] {
    const dates: Temporal.PlainDateTime[] = [];
    for (const d of CloudflareWorkersParser.iterate(expr, START)) {
      dates.push(d);
      if (dates.length === n) break;
    }
    return dates;
  }

  it('dow 1 means Sunday', () => {
    const dates = firstN('0 12 * * 1', 2);
    expect(dates.every(d => d.dayOfWeek === 7)).toBe(true);
    expect(dates[0].toString().slice(0, 10)).toBe('2026-07-05');
  });

  it('dow 7 means Saturday', () => {
    const dates = firstN('0 12 * * 7', 2);
    expect(dates.every(d => d.dayOfWeek === 6)).toBe(true);
    expect(dates[0].toString().slice(0, 10)).toBe('2026-07-04');
  });
});
