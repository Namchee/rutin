import { Temporal } from '@js-temporal/polyfill';
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

describe('node: optional seconds in process', () => {
  function process(expr: string) {
    return NodeParser.process(expr);
  }

  it('5-field expression is complete and valid', () => {
    expect(NodeParser.process('0 0 1 1,4,7,10 *').status).toBe('valid');
  });

  it('6-field expression stays valid', () => {
    expect(NodeParser.process('0 0 0 1 1,4,7,10 *').status).toBe('valid');
  });

  it('too many fields is invalid, not incomplete', () => {
    expect(NodeParser.process('0 0 0 0 1 1,4,7,10 *').status).toBe('invalid');
  });

  it('accepts 6-field expressions with explicit seconds', () => {
    expect(process('0 30 9 * * 1-5')).toMatchObject({ status: 'valid' });
    expect(process('30 0 12 15 * *')).toMatchObject({ status: 'valid' });
    expect(process('* * * * * *')).toMatchObject({ status: 'valid' });
  });

  it('rejects a 7th field (year) as invalid', () => {
    expect(process('0 0 0 1 1 * *')).toMatchObject({ error: [], status: 'invalid' });
    expect(process('0 0 0 1 1 * 2025')).toMatchObject({ error: [], status: 'invalid' });
  });

  it('rejects out-of-range seconds', () => {
    expect(process('60 0 12 * * *')).toMatchObject({ error: ['second'], status: 'invalid' });
  });

  it('rejects out-of-range fields', () => {
    expect(process('0 0 25 * * *')).toMatchObject({ error: ['hour'], status: 'invalid' });
    expect(process('0 0 12 * * 8')).toMatchObject({ error: ['dayOfWeek'], status: 'invalid' });
  });

  it('treats missing fields as incomplete', () => {
    expect(process('0 12 * *')).toMatchObject({ status: 'incomplete' });
  });
});

describe('node: normalize', () => {
  it('normalizes aliases and lists', () => {
    expect(NodeParser.normalize('0 0 1 JAN,MAR *').value).toBe('0 0 1 1,3 *');
    expect(NodeParser.normalize('0 0 1,2,3 * *').value).toBe('0 0 1-3 * *');
  });

  it('leaves canonical expressions untouched', () => {
    expect(NodeParser.normalize('0 30 9 * * 1-5').value).toBe('0 30 9 * * 1-5');
    expect(NodeParser.normalize('30 0 12 15 * *').value).toBe('30 0 12 15 * *');
  });

  it('keeps the seconds field when collapsing dom', () => {
    expect(NodeParser.normalize('0 0 1,2,3 * *').value).toBe('0 0 1-3 * *');
  });
});

describe('node: iterate with seconds', () => {
  const START = Temporal.PlainDateTime.from('2026-07-01T00:00:00');

  function firstN(expr: string, n: number): Temporal.PlainDateTime[] {
    const dates: Temporal.PlainDateTime[] = [];
    for (const d of NodeParser.iterate(expr, START)) {
      dates.push(d);
      if (dates.length === n) break;
    }
    return dates;
  }

  it('yields each day at the configured second', () => {
    const dates = firstN('30 0 12 * * *', 3);
    expect(dates.map(d => d.toString())).toEqual([
      '2026-07-01T12:00:30',
      '2026-07-02T12:00:30',
      '2026-07-03T12:00:30',
    ]);
  });

  it('respects weekday constraints with seconds', () => {
    const dates = firstN('10 30 9 * * 1-5', 3);
    expect(dates.map(d => d.toString())).toEqual([
      '2026-07-01T09:30:10',
      '2026-07-02T09:30:10',
      '2026-07-03T09:30:10',
    ]);
  });

  it('second 0 is explicit and iterates normally', () => {
    const dates = firstN('0 30 9 * * 1-5', 2);
    expect(dates.map(d => d.toString())).toEqual(['2026-07-01T09:30:00', '2026-07-02T09:30:00']);
  });
});
