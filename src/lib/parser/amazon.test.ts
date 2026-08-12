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
});
