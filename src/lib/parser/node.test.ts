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

  it('unix: adds seconds, keeps dow zero-based', () => {
    expect(convert('0 12 * * *', 'unix')).toBe('0 0 12 * * *');
    expect(convert('30 9 * * 1-5', 'unix')).toBe('0 30 9 * * 1-5');
    expect(convert('@daily', 'unix')).toBe('0 0 0 * * *');
  });

  it('quartz: keeps seconds, drops year, shifts dow to zero-based, ? -> *', () => {
    expect(convert('0 0 12 ? * 1 *', 'quartz')).toBe('0 0 12 * * 0');
    expect(convert('30 0 12 ? * 7 *', 'quartz')).toBe('30 0 12 * * 6');
    expect(convert('0 0 12 ? * MON-FRI *', 'quartz')).toBe('0 0 12 * * 1-5');
    expect(convert('0 0 12 ? * 6L *', 'quartz')).toBe('0 0 12 * * 6L');
  });

  it('amazon: adds seconds, drops year, shifts dow to zero-based, ? -> *', () => {
    expect(convert('0 12 ? * MON *', 'amazon')).toBe('0 0 12 * * 1');
    expect(convert('15 10 ? * 6L 2024', 'amazon')).toBe('0 15 10 * * 6L');
  });

  it('cf-workers: adds seconds, shifts dow to zero-based', () => {
    expect(convert('0 12 * * 1', 'cf-workers')).toBe('0 0 12 * * 0');
    expect(convert('30 9 * * 2-6', 'cf-workers')).toBe('0 30 9 * * 1-5');
  });

  // Systemd conversion is deferred.
});
