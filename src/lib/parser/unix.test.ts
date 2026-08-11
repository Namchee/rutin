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
    // 6-field quartz: minute hour dom month dow year (no seconds)
    expect(convert('0 12 ? * 1 2024', 'quartz')).toBe('0 12 * * 0');
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

  // Systemd conversion is deferred.
});
