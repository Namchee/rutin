import { describe, expect, it } from 'vitest';
import type { ScheduleFormat } from '@/types/schedule';

import { Parsers } from '../parsers';

/**
 * Convert `expr` from format `from` into format `to`.
 */
function convert(expr: string, from: ScheduleFormat, to: ScheduleFormat): string {
  const { tokens } = Parsers[from].normalize(expr);
  return Parsers[to].convert(tokens, expr, from).value;
}

const ALL_FORMATS: ScheduleFormat[] = ['unix', 'node', 'quartz', 'amazon', 'cf-workers', 'systemd'];

describe('cross-format conversion', () => {
  it.each<[string, ScheduleFormat, ScheduleFormat, string]>([
    // unix <-> amazon
    ['0 12 * * *', 'unix', 'amazon', '0 12 * * * *'],
    ['0 0 * * 1-5', 'unix', 'amazon', '0 0 * * 2-6 *'],
    ['30 9 15 3 *', 'unix', 'amazon', '30 9 15 3 * *'],
    ['0 0 * * 2-6 *', 'amazon', 'unix', '0 0 * * 1-5'],
    ['0 12 ? * MON *', 'amazon', 'unix', '0 12 * * 1'],
    // unix <-> node
    ['30 9 * * 1-5', 'unix', 'node', '30 9 * * 1-5'],
    ['0 12 * * 0', 'node', 'unix', '0 12 * * 0'],
    // unix <-> quartz
    ['0 12 * * *', 'unix', 'quartz', '0 0 12 * * *'],
    ['30 9 * * 1-5', 'unix', 'quartz', '0 30 9 * * 2-6'],
    ['0 0 1 1,4,7,10 *', 'unix', 'quartz', '0 0 0 1 1,4,7,10 *'],
    ['0 0 12 * * * *', 'quartz', 'unix', '0 12 * * *'],
    ['0 15 10 ? * 1-5 2024', 'quartz', 'unix', '15 10 * * 0-4'],
    // unix <-> cf-workers
    ['0 12 * * 1', 'unix', 'cf-workers', '0 12 * * 2'],
    ['0 0 * * 0,6', 'unix', 'cf-workers', '0 0 * * 1,7'],
    ['0 0 * * 2-6', 'cf-workers', 'unix', '0 0 * * 1-5'],
    // unix <-> systemd
    ['0 12 * * *', 'unix', 'systemd', '12:00:00'],
    ['0 0 15 * *', 'unix', 'systemd', '*-*-15 00:00:00'],
    ['30 9 * * 1-5', 'unix', 'systemd', 'Mon..Fri 09:30:00'],
    ['0 0 * * 0,6', 'unix', 'systemd', 'Sun,Sat 00:00:00'],
    ['12:00:00', 'systemd', 'unix', '0 12 * * *'],
    ['*-*-15 00:00:00', 'systemd', 'unix', '0 0 15 * *'],
    ['Mon..Fri 09:30:00', 'systemd', 'unix', '30 9 * * 1-5'],
    // node <-> quartz
    ['30 0 12 15 * *', 'node', 'quartz', '30 0 12 15 * *'],
    ['0 30 9 * * 1-5', 'node', 'quartz', '0 30 9 * * 2-6'],
    ['0 0 12 * * 0', 'node', 'quartz', '0 0 12 * * 1'],
    ['0 0 12 ? * 1 *', 'quartz', 'node', '0 0 12 * * 0'],
    ['30 0 12 15 * * *', 'quartz', 'node', '30 0 12 15 * *'],
    // amazon <-> quartz
    ['0 12 ? * MON *', 'amazon', 'quartz', '0 0 12 ? * 2 *'],
    ['0 0 12 ? * 1 *', 'quartz', 'amazon', '0 12 ? * 1 *'],
    ['0 0 12 ? * 6L *', 'quartz', 'amazon', '0 12 ? * 6L *'],
    // amazon <-> cf-workers
    ['0 12 ? * MON *', 'amazon', 'cf-workers', '0 12 * * 2'],
    ['0 12 * * 2', 'cf-workers', 'amazon', '0 12 * * 2 *'],
    // systemd <-> quartz
    ['*-*-15 12:30:00', 'systemd', 'quartz', '0 30 12 15 * * *'],
    ['Mon..Fri *-*-* 09:30:00', 'systemd', 'quartz', '0 30 9 * * 2-6 *'],
    ['2026-01-01 00:00:00', 'systemd', 'quartz', '0 0 0 1 1 * 2026'],
    // systemd <-> amazon
    ['Mon..Fri *-*-* 09:00:00', 'systemd', 'amazon', '0 9 * * 2-6 *'],
    ['2026-01-01 00:00:00', 'systemd', 'amazon', '0 0 1 1 * 2026'],
    // node <-> amazon
    ['0 0 12 * * 1-5', 'node', 'amazon', '0 12 * * 2-6 *'],
    // macros
    ['@daily', 'unix', 'amazon', '0 0 * * * *'],
    ['@weekly', 'node', 'cf-workers', '0 0 * * 1'],
    ['@yearly', 'unix', 'systemd', '*-01-01 00:00:00'],
    ['daily', 'systemd', 'unix', '0 0 * * *'],
  ])('%s (%s -> %s)', (expr, from, to, expected) => {
    expect(convert(expr, from, to)).toBe(expected);
  });
});

describe('cross-format round trips', () => {
  // Convert A -> B -> A and expect the original expression back.
  it.each<[string, ScheduleFormat, ScheduleFormat]>([
    ['0 12 * * *', 'unix', 'amazon'],
    ['0 0 * * 1-5', 'unix', 'amazon'],
    ['30 9 15 3 *', 'unix', 'amazon'],
    ['0 12 * * 1', 'unix', 'cf-workers'],
    ['0 0 * * 0,6', 'unix', 'cf-workers'],
    ['30 9 * * 1-5', 'unix', 'node'],
    ['0 12 * * *', 'unix', 'quartz'],
    ['30 9 * * 1-5', 'unix', 'quartz'],
    ['0 0 1 1,4,7,10 *', 'unix', 'quartz'],
    ['0 12 * * *', 'unix', 'systemd'],
    ['0 0 15 * *', 'unix', 'systemd'],
    ['30 9 * * 1-5', 'unix', 'systemd'],
    ['0 0 * * 0,6', 'unix', 'systemd'],
    ['30 0 12 15 * *', 'node', 'quartz'],
    ['0 0 12 * * 0', 'node', 'quartz'],
    // seconds cannot round-trip through amazon, so use a 5-field node input
    ['30 9 * * 1-5', 'node', 'amazon'],
    ['0 12 * * 2 *', 'amazon', 'cf-workers'],
    ['0 0 * * 2,4 *', 'amazon', 'cf-workers'],
    ['0 0 12 ? * 1 *', 'quartz', 'amazon'],
    // ? in dom cannot round-trip through node, so use a plain dom; the year
    // is optional in quartz, so a 6-field expression round-trips exactly
    ['0 0 12 * * 1', 'quartz', 'node'],
    ['*-*-15 12:30:00', 'systemd', 'quartz'],
    // the default *-*-* date is elided by the systemd convert
    ['Mon..Fri 09:30:00', 'systemd', 'unix'],
    ['2026-01-01 00:00:00', 'systemd', 'quartz'],
  ])('%s (%s <-> %s)', (expr, a, b) => {
    expect(convert(convert(expr, a, b), b, a)).toBe(expr);
  });
});

describe('converted output is valid in the target format', () => {
  // Canonical expressions per source format. Every one of them must convert
  // to a *valid* expression in every other format.
  const sources: Array<[string, ScheduleFormat]> = [
    ['0 12 * * *', 'unix'],
    ['30 9 * * 1-5', 'unix'],
    ['0 0 1 1,4,7,10 *', 'unix'],
    ['0 0 * * 0,6', 'unix'],
    ['*/15 9 * * *', 'unix'],
    ['0 30 9 * * 1-5', 'node'],
    ['30 0 12 15 * *', 'node'],
    ['0 0 12 * * 0', 'node'],
    ['0 0 12 ? * 1 *', 'quartz'],
    ['0 30 9 ? * 1-5 *', 'quartz'],
    ['0 0 0 1 1 ? *', 'quartz'],
    ['0 12 ? * MON *', 'amazon'],
    ['0 0 ? * 2-6 *', 'amazon'],
    ['0 0 1 1,4,7,10 ? *', 'amazon'],
    ['0 12 * * 1', 'cf-workers'],
    ['30 9 * * 2-6', 'cf-workers'],
    ['0 0 * * 7,1', 'cf-workers'],
    ['Mon..Fri *-*-* 09:30:00', 'systemd'],
    ['*-*-15 12:30:00', 'systemd'],
    ['2026-01-01 00:00:00', 'systemd'],
  ];

  for (const [expr, from] of sources) {
    for (const to of ALL_FORMATS) {
      if (to === from) {
        continue;
      }

      it(`${from} -> ${to}: ${expr}`, () => {
        const converted = convert(expr, from, to);
        const result = Parsers[to].process(converted);
        expect(result.status, `${from}->${to} produced ${converted}`).toBe('valid');
      });
    }
  }
});
