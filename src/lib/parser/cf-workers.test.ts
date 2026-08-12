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
});
