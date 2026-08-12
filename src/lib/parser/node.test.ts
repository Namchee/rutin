import { describe, expect, it } from 'vitest';
import type { ScheduleFormat } from '@/types/schedule';

import { Parsers } from '../parsers';
import { NodeParser } from './node';

function convert(expr: string, from: ScheduleFormat): string {
  const { tokens } = Parsers[from].normalize(expr);
  return NodeParser.convert(tokens, expr, from).value;
}

describe('convert to node', () => {
  it('node -> node is identity', () => {
    expect(convert('0 30 9 * * 1-5', 'node')).toBe('0 30 9 * * 1-5');
    // Node supports the same macros, so they are preserved, not expanded.
    expect(convert('@daily', 'node')).toBe('@daily');
  });

  it('unix: seconds added only when the source has them, dow stays zero-based', () => {
    expect(convert('0 12 * * *', 'unix')).toBe('0 12 * * *');
    expect(convert('30 9 * * 1-5', 'unix')).toBe('30 9 * * 1-5');
    // Unix macros are compatible with node, so they are preserved.
    expect(convert('@daily', 'unix')).toBe('@daily');
  });

  it('quartz: keeps seconds, drops year, shifts dow to zero-based, ? -> *', () => {
    expect(convert('0 0 12 ? * 1 *', 'quartz')).toBe('0 0 12 * * 0');
    expect(convert('30 0 12 ? * 7 *', 'quartz')).toBe('30 0 12 * * 6');
    expect(convert('0 0 12 ? * MON-FRI *', 'quartz')).toBe('0 0 12 * * 1-5');
    expect(convert('0 0 12 ? * 6L *', 'quartz')).toBe('0 0 12 * * 6L');
  });

  it('amazon: no seconds, drops year, shifts dow to zero-based, ? -> *', () => {
    expect(convert('0 12 ? * MON *', 'amazon')).toBe('0 12 * * 1');
    expect(convert('15 10 ? * 6L 2024', 'amazon')).toBe('15 10 * * 6L');
  });

  it('cf-workers: no seconds, shifts dow to zero-based', () => {
    expect(convert('0 12 * * 1', 'cf-workers')).toBe('0 12 * * 0');
    expect(convert('30 9 * * 2-6', 'cf-workers')).toBe('30 9 * * 1-5');
  });

  it('systemd: decomposes date/time, dow one-based -> zero-based', () => {
    expect(convert('daily', 'systemd')).toBe('0 0 0 * * *');
    expect(convert('Mon..Fri *-*-* 09:00:00', 'systemd')).toBe('0 0 9 * * 1-5');
    expect(convert('Sat,Sun *-*-* 00:00:00', 'systemd')).toBe('0 0 0 * * 6,0');
    expect(convert('*-*-15 12:30', 'systemd')).toBe('0 30 12 15 * *');
    expect(convert('2024-01-01 00:00:00', 'systemd')).toBe('0 0 0 1 1 *');
  });
});
