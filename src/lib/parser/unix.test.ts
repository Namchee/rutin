import { describe, expect, it } from 'vitest';
import type { ScheduleFormat } from '@/types/schedule';

import { Parsers } from '../parsers';
import { UNIXParser } from './unix';

function convert(expr: string, from: ScheduleFormat): string {
  const { tokens } = Parsers[from].normalize(expr);
  return UNIXParser.convert(tokens, expr, from).value;
}

describe('convert to unix', () => {
  it('unix -> unix is identity', () => {
    expect(convert('0 12 * * *', 'unix')).toBe('0 12 * * *');
    // Unix supports the same macros, so they are preserved, not expanded.
    expect(convert('@daily', 'unix')).toBe('@daily');
  });

  it('node: drops optional seconds', () => {
    expect(convert('0 30 9 * * 1-5', 'node')).toBe('30 9 * * 1-5');
    expect(convert('0 0 12 * * *', 'node')).toBe('0 12 * * *');
    expect(convert('@weekly', 'node')).toBe('0 0 * * 0');
    expect(convert('0 0 * * 1', 'node')).toBe('0 0 * * 1');
  });

  it('quartz: drops seconds and year, shifts dow to zero-based', () => {
    expect(convert('0 0 12 * * ? *', 'quartz')).toBe('0 12 * * *');
    expect(convert('0 0 12 ? * 1 *', 'quartz')).toBe('0 12 * * 0');
    expect(convert('0 0 12 ? * 7 *', 'quartz')).toBe('0 12 * * 6');
    expect(convert('0 30 9 ? * MON-FRI *', 'quartz')).toBe('30 9 * * 1-5');
    expect(convert('0 0 12 1,15 * ? *', 'quartz')).toBe('0 12 1,15 * *');
    expect(convert('0 0 0 ? * SUN *', 'quartz')).toBe('0 0 * * 0');
    expect(convert('0 15 10 ? * 1-5 2024', 'quartz')).toBe('15 10 * * 0-4');
    expect(convert('0 0 12 L * ? *', 'quartz')).toBe('0 12 L * *');
    // 6-field quartz: sec min hour dom month dow (no year)
    expect(convert('0 0 12 ? * 1', 'quartz')).toBe('0 12 * * 0');
  });

  it('amazon: drops year, shifts dow to zero-based, ? -> *', () => {
    expect(convert('0 12 ? * MON *', 'amazon')).toBe('0 12 * * 1');
    expect(convert('0 12 ? * 5 2024', 'amazon')).toBe('0 12 * * 4');
    expect(convert('15 10 ? * 6L 2024', 'amazon')).toBe('15 10 * * 6L');
    expect(convert('0 0 ? * 2,4 *', 'amazon')).toBe('0 0 * * 1,3');
  });

  it('cf-workers: shifts dow to zero-based', () => {
    expect(convert('0 0 * * 1', 'cf-workers')).toBe('0 0 * * 0');
    expect(convert('0 0 * * 7', 'cf-workers')).toBe('0 0 * * 6');
    expect(convert('30 9 * * 2-6', 'cf-workers')).toBe('30 9 * * 1-5');
  });

  it('systemd: maps weekday/date/time onto the 5 unix fields', () => {
    expect(convert('daily', 'systemd')).toBe('0 0 * * *');
    expect(convert('hourly', 'systemd')).toBe('0 * * * *');
    expect(convert('minutely', 'systemd')).toBe('* * * * *');
    expect(convert('weekly', 'systemd')).toBe('0 0 * * 1');
    expect(convert('Mon..Fri *-*-* 09:00:00', 'systemd')).toBe('0 9 * * 1-5');
    expect(convert('*-*-15 12:30', 'systemd')).toBe('30 12 15 * *');
    expect(convert('Sat,Sun *-*-* 00:00:00', 'systemd')).toBe('0 0 * * 6,0');
    expect(convert('Mon *-*-*', 'systemd')).toBe('0 0 * * 1');
    expect(convert('2024-01-01 00:00:00', 'systemd')).toBe('0 0 1 1 *');
    expect(convert('*-01..06-* 0/30:15:00', 'systemd')).toBe('15 0/30 * 1-6 *');
    expect(convert('*-*-~1 12:00:00', 'systemd')).toBe('0 12 L * *');
    expect(convert('*-*-~4 12:00:00', 'systemd')).toBe('0 12 L-3 * *');
  });
});

describe('unix: process status', () => {
  function statusOf(expr: string) {
    const result = UNIXParser.process(expr);
    return { error: result.error, normal: result.normal, status: result.status };
  }

  it('accepts well-formed 5-field expressions', () => {
    for (const expr of [
      '0 12 * * *',
      '0 0 1 1,4,7,10 *',
      '30 9 * * 1-5',
      '0 0 * * 0',
      '0 0 * * 7',
      '0 0 * * 1-7',
      '*/15 * * * *',
      '0 12 1-31/2 * *',
    ]) {
      expect(statusOf(expr)).toMatchObject({ status: 'valid' });
    }
  });

  it('produces a descriptor and a generator for valid expressions', () => {
    const result = UNIXParser.process('0 12 * * *');
    expect(result.status).toBe('valid');
    if (result.status === 'valid') {
      expect(result.descriptor.length).toBeGreaterThan(0);
      expect(typeof result.generator.next).toBe('function');
    }
  });

  it('marks non-canonical but valid expressions as not normal', () => {
    expect(statusOf('0 0 * * SUN')).toMatchObject({ status: 'valid', normal: false });
    expect(statusOf('0 0 1,2,3 * *')).toMatchObject({ status: 'valid', normal: false });
  });

  it('expands macros and marks them as not normal', () => {
    for (const macro of [
      '@daily',
      '@hourly',
      '@midnight',
      '@weekly',
      '@monthly',
      '@annually',
      '@yearly',
    ]) {
      expect(statusOf(macro)).toMatchObject({ status: 'valid', normal: false });
    }
  });

  it('treats macro prefixes as incomplete', () => {
    expect(statusOf('@d')).toMatchObject({ status: 'incomplete' });
    expect(statusOf('@da')).toMatchObject({ status: 'incomplete' });
    expect(statusOf('@y')).toMatchObject({ status: 'incomplete' });
    expect(statusOf('@')).toMatchObject({ status: 'incomplete' });
  });

  it('rejects unknown macros as invalid', () => {
    expect(statusOf('@foo')).toMatchObject({ status: 'invalid' });
  });

  it('treats missing fields as incomplete', () => {
    for (const expr of ['0 12 * *', '0 12', '0', '']) {
      expect(statusOf(expr)).toMatchObject({ status: 'incomplete' });
    }
  });

  it('rejects out-of-range values with the offending field', () => {
    expect(statusOf('60 12 * * *')).toMatchObject({ status: 'invalid', error: ['minute'] });
    expect(statusOf('0 24 * * *')).toMatchObject({ status: 'invalid', error: ['hour'] });
    expect(statusOf('0 12 * 13 *')).toMatchObject({ status: 'invalid', error: ['month'] });
    expect(statusOf('0 12 * * 8')).toMatchObject({ status: 'invalid', error: ['dayOfWeek'] });
    expect(statusOf('0 0 32 * *')).toMatchObject({ status: 'invalid', error: ['dayOfMonth'] });
    expect(statusOf('0 0 0 * *')).toMatchObject({ status: 'invalid', error: ['dayOfMonth'] });
  });

  it('rejects garbage tokens with the offending field', () => {
    expect(statusOf('x 12 * * *')).toMatchObject({ status: 'invalid', error: ['minute'] });
    expect(statusOf('0 12 * * foo')).toMatchObject({ status: 'invalid', error: ['dayOfWeek'] });
    expect(statusOf('0-60 12 * * *')).toMatchObject({ status: 'invalid', error: ['minute'] });
  });

  it('reports every invalid field at once', () => {
    const result = statusOf('60 24 32 13 8');
    expect(result.status).toBe('invalid');
    expect([...(result.error ?? [])].sort()).toEqual([
      'dayOfMonth',
      'dayOfWeek',
      'hour',
      'minute',
      'month',
    ]);
  });

  it('rejects too many fields as invalid, not incomplete', () => {
    expect(statusOf('0 12 * * * extra')).toMatchObject({ status: 'invalid', error: [] });
    expect(statusOf('0 12 * * * * *')).toMatchObject({ status: 'invalid', error: [] });
  });
});
