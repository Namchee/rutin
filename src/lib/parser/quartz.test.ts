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

  it('unix: adds year, shifts dow to one-based', () => {
    expect(convert('0 12 * * *', 'unix')).toBe('0 12 * * * *');
    expect(convert('0 0 * * 1-5', 'unix')).toBe('0 0 * * 2-6 *');
  });

  it('systemd: maps weekday/date/time, dow one-based', () => {
    expect(convert('daily', 'systemd')).toBe('0 0 0 * * * *');
    expect(convert('Mon..Fri *-*-* 09:00:00', 'systemd')).toBe('0 0 9 * * 2-6 *');
    expect(convert('*-*-15 12:30', 'systemd')).toBe('0 30 12 15 * * *');
  });
});
