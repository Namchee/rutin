import { describe, expect, it } from 'vitest';

import type { ScheduleFormat } from '@/types/schedule';

import { Parsers } from '../parsers';

import { decomposeSystemdTokens, generator, SystemdParser } from './systemd';

const START = Temporal.PlainDateTime.from('2026-07-01T00:00:00');

function firstN(expr: string, n: number): Temporal.PlainDateTime[] {
  const dates: Temporal.PlainDateTime[] = [];
  for (const d of generator(expr, START)) {
    dates.push(d);
    if (dates.length === n) break;
  }
  return dates;
}

function firstNFrom(expr: string, startISO: string, n: number): Temporal.PlainDateTime[] {
  const dates: Temporal.PlainDateTime[] = [];
  for (const d of generator(expr, Temporal.PlainDateTime.from(startISO))) {
    dates.push(d);
    if (dates.length === n) break;
  }
  return dates;
}

function errorsOf(expr: string): string[] | undefined {
  const result = SystemdParser.process(expr);
  return result.status === 'invalid' ? result.error : undefined;
}

describe('systemd: validation errors point at the offending field', () => {
  it('invalid time reports time', () => {
    expect(errorsOf('*-*-* 25:00:00')).toEqual(['time']);
  });

  it('out-of-range month reports date', () => {
    expect(errorsOf('*-13-01 00:00:00')).toEqual(['date']);
  });

  it('invalid weekday name reports dayOfWeek', () => {
    expect(errorsOf('Funday 00:00:00')).toEqual(['dayOfWeek']);
  });

  it('reports every invalid component at once', () => {
    expect(errorsOf('Funday *-13-01 25:00:00')?.sort()).toEqual(['date', 'dayOfWeek', 'time']);
  });

  it('unrecognised date-like token reports date', () => {
    expect(errorsOf('2012-01 00:00:00')).toEqual(['date']);
  });

  it('unrecognised time-like token reports time', () => {
    expect(errorsOf('25:00 00:00:00')).toEqual(['time']);
  });

  it('unrecognised weekday-like token reports dayOfWeek', () => {
    expect(errorsOf('Foo/Bar')).toEqual(['dayOfWeek']);
  });

  it('empty input is incomplete, not invalid', () => {
    const result = SystemdParser.process('');
    expect(result.status).toBe('incomplete');
  });

  it('valid input has no errors', () => {
    const result = SystemdParser.process('*-*-* 00:00:00');
    expect(result.status).toBe('valid');
  });
});

describe('systemd: iteration', () => {
  it('daily midnight', () => {
    expect(firstN('*-*-* 00:00:00', 1)[0].toString()).toBe('2026-07-02T00:00:00');
  });

  it('weekday range Mon..Fri at noon', () => {
    // 2026-07-01 is a Wednesday and falls inside Mon..Fri.
    const dates = firstN('Mon..Fri 12:00:00', 2);
    expect(dates[0].toString()).toBe('2026-07-01T12:00:00');
    expect(dates[1].toString()).toBe('2026-07-02T12:00:00');
  });

  it('weekday list Mon,Fri at 09:00', () => {
    expect(firstN('Mon,Fri 09:00:00', 1)[0].toString()).toBe('2026-07-03T09:00:00');
  });

  it('3rd-last day of February via ~N', () => {
    // Start just before the target so the second-by-second scan stays fast.
    expect(firstNFrom('*-02~03 00:00:00', '2027-02-25T00:00:00', 1)[0].toString()).toBe(
      '2027-02-26T00:00:00',
    );
  });

  it('every 3rd minute starting at :02', () => {
    expect(firstN('*:02/3:00', 1)[0].toString()).toBe('2026-07-01T00:02:00');
  });

  it('weekday-only input defaults to daily midnight', () => {
    expect(firstN('Mon', 1)[0].toString()).toBe('2026-07-06T00:00:00');
  });

  it('time-only input defaults to every-day', () => {
    expect(firstN('12:00', 1)[0].toString()).toBe('2026-07-01T12:00:00');
  });
});

describe('systemd: normalization', () => {
  it('trims and collapses internal whitespace', () => {
    const { value } = SystemdParser.normalize('Mon *-*-*  12:00:00');
    expect(value).toBe('Mon *-*-* 12:00:00');
  });

  it('leaves invalid input untouched instead of throwing', () => {
    const { value, tokens } = SystemdParser.normalize('12:00:00 *-*-* Mon');
    expect(value).toBe('12:00:00 *-*-* Mon');
    expect(Object.keys(tokens)).toHaveLength(0);
  });

  it('marks canonical input as normal', () => {
    const result = SystemdParser.process('Mon *-*-* 12:00:00');
    expect(result.status).toBe('valid');
    if (result.status === 'valid') {
      expect(result.normal).toBe(true);
    }
  });

  it('rejects components out of canonical order', () => {
    // weekday must precede date must precede time.
    expect(errorsOf('*-*-* 12:00:00 Mon')).toEqual(['dayOfWeek']);
    expect(errorsOf('12:00:00 *-*-*')).toEqual(['date']);
    expect(errorsOf('Mon 12:00:00 *-*-*')).toEqual(['date']);
  });
});

describe('systemd: macros', () => {
  it.each([
    'daily',
    'hourly',
    'minutely',
    'monthly',
    'quarterly',
    'semianually',
    'weekly',
    'yearly',
  ])('%s is valid but not normal', macro => {
    const result = SystemdParser.process(macro);
    expect(result.status).toBe('valid');
    expect(result.normal).toBe(false);
  });

  it('treats macro prefixes as incomplete', () => {
    expect(SystemdParser.process('dai').status).toBe('incomplete');
    expect(SystemdParser.process('da').status).toBe('incomplete');
  });

  it('rejects unknown words as invalid dayOfWeek', () => {
    const result = SystemdParser.process('foo');
    expect(result.status).toBe('invalid');
    if (result.status === 'invalid') {
      expect(result.error).toEqual(['dayOfWeek']);
    }
  });
});

describe('systemd: fixed-date generator terminates (regression for infinite loop)', () => {
  it('yields the single matching datetime and then finishes', () => {
    const dates = firstN('2026-07-15 12:30:00', 5);
    expect(dates.map(d => d.toString())).toEqual(['2026-07-15T12:30:00']);
  });

  it('yields nothing when the start is already past the target', () => {
    expect(firstNFrom('2026-07-15 12:30:00', '2026-07-15T12:30:01', 5)).toEqual([]);
  });

  it('iterates across a year range and terminates', () => {
    const dates = firstN('2026..2027-07-15 12:30:00', 5);
    expect(dates.map(d => d.toString())).toEqual(['2026-07-15T12:30:00', '2027-07-15T12:30:00']);
  });
});

describe('systemd: decomposeSystemdTokens', () => {
  function decompose(expr: string) {
    const result = SystemdParser.process(expr);
    if (result.status !== 'valid') {
      throw new Error(`expected valid: ${expr}`);
    }
    return decomposeSystemdTokens(result.tokens);
  }

  it('maps weekday/date/time onto cron fields', () => {
    expect(decompose('Mon..Fri *-*-* 09:00:00')).toEqual({
      dayOfMonth: '*',
      dayOfWeek: '2-6',
      hour: '9',
      minute: '0',
      month: '*',
      second: '0',
      year: '*',
    });
  });

  it('maps ~N last-day markers to L / L-N', () => {
    expect(decompose('*-*-~1 12:00:00').dayOfMonth).toBe('L');
    expect(decompose('*-*-~4 12:00:00').dayOfMonth).toBe('L-3');
  });

  it('maps .. ranges to - ranges', () => {
    expect(decompose('*-01..06-* 0/30:15:00')).toMatchObject({ hour: '0/30', month: '1-6' });
  });

  it('keeps explicit years and defaults missing components', () => {
    expect(decompose('2026-01-01 00:00:00')).toEqual({
      dayOfMonth: '1',
      dayOfWeek: undefined,
      hour: '0',
      minute: '0',
      month: '1',
      second: '0',
      year: '2026',
    });
    expect(decompose('2026..2027-01-01 00:00:00').year).toBe('2026-2027');
    expect(decompose('Mon')).toMatchObject({ dayOfWeek: '2', hour: '0', minute: '0' });
    expect(decompose('12:00')).toMatchObject({ hour: '12', minute: '0', second: '0' });
  });
});

describe('systemd: iteration extras', () => {
  it('second and minute steps', () => {
    expect(firstN('*:02/3:00', 1)[0].toString()).toBe('2026-07-01T00:02:00');
  });

  it('~1 on a leap-year February', () => {
    // 2028 is a leap year; Feb 29 must be matched.
    const dates = firstNFrom('*-02~1 00:00:00', '2028-02-28T00:00:00', 1);
    expect(dates[0].toString()).toBe('2028-02-29T00:00:00');
  });

  it('weekend list iterates Saturday then Sunday', () => {
    expect(firstN('Sat,Sun *-*-* 00:00:00', 2).map(d => d.toString())).toEqual([
      '2026-07-04T00:00:00',
      '2026-07-05T00:00:00',
    ]);
  });

  it('hour steps start from the configured hour', () => {
    expect(firstN('*-*-* 0/2:00:00', 2).map(d => d.toString().slice(11, 16))).toEqual([
      '02:00',
      '04:00',
    ]);
  });

  it('time-only defaults to every day', () => {
    expect(firstN('12:30', 2).map(d => d.toString())).toEqual([
      '2026-07-01T12:30:00',
      '2026-07-02T12:30:00',
    ]);
  });
});

describe('systemd: process generator', () => {
  it('yields future datetimes for a valid expression', () => {
    const result = SystemdParser.process('Mon..Fri 12:00:00');
    expect(result.status).toBe('valid');
    if (result.status === 'valid') {
      const first = result.generator.next().value as Temporal.PlainDateTime;
      expect(
        Temporal.PlainDateTime.compare(first, Temporal.Now.plainDateTimeISO()),
      ).toBeGreaterThan(0);
    }
  });
});

function convert(expr: string, from: ScheduleFormat): string {
  const { tokens } = Parsers[from].normalize(expr);
  return SystemdParser.convert(tokens, expr, from).value;
}

describe('convert to systemd', () => {
  it('systemd -> systemd is identity', () => {
    expect(convert('daily', 'systemd')).toBe('daily');
    expect(convert('Mon..Fri *-*-* 09:00:00', 'systemd')).toBe('Mon..Fri *-*-* 09:00:00');
  });

  it('unix: maps fields onto weekday/date/time', () => {
    expect(convert('0 12 * * *', 'unix')).toBe('12:00:00');
    expect(convert('0 0 15 * *', 'unix')).toBe('*-*-15 00:00:00');
    expect(convert('0 0 * * 1', 'unix')).toBe('Mon 00:00:00');
    expect(convert('30 9 * * 1-5', 'unix')).toBe('Mon..Fri 09:30:00');
    expect(convert('0 0 * * 0,6', 'unix')).toBe('Sun,Sat 00:00:00');
    expect(convert('0 0 * * 0-6', 'unix')).toBe('00:00:00');
    expect(convert('* * * * *', 'unix')).toBe('*:*:00');
    expect(convert('0 * * * *', 'unix')).toBe('*:00:00');
    expect(convert('0 0 13 * 5', 'unix')).toBe('Fri *-*-13 00:00:00');
    expect(convert('@daily', 'unix')).toBe('00:00:00');
  });

  it('node: keeps seconds', () => {
    expect(convert('0 30 9 * * 1-5', 'node')).toBe('Mon..Fri 09:30:00');
    expect(convert('30 0 12 15 * *', 'node')).toBe('*-*-15 12:00:30');
  });

  it('quartz: maps one-based dow, L -> ~1, L-N -> ~N+1, keeps year', () => {
    expect(convert('0 0 12 ? * 1 *', 'quartz')).toBe('Sun 12:00:00');
    expect(convert('0 30 9 ? * MON-FRI *', 'quartz')).toBe('Mon..Fri 09:30:00');
    expect(convert('0 0 12 L * ? *', 'quartz')).toBe('*-*-~1 12:00:00');
    expect(convert('0 0 0 L-3 * ? *', 'quartz')).toBe('*-*-~4 00:00:00');
    expect(convert('0 0 0 1 1 ? 2025', 'quartz')).toBe('2025-01-01 00:00:00');
  });

  it('amazon: maps one-based dow', () => {
    expect(convert('0 12 ? * MON *', 'amazon')).toBe('Mon 12:00:00');
  });

  it('cf-workers: maps one-based dow', () => {
    expect(convert('0 12 * * 1', 'cf-workers')).toBe('Sun 12:00:00');
    expect(convert('30 9 * * 2-6', 'cf-workers')).toBe('Mon..Fri 09:30:00');
  });

  it('maps ranges to .. syntax and zero-pads single digits', () => {
    expect(convert('0 0 1-15 * *', 'unix')).toBe('*-*-1..15 00:00:00');
    expect(convert('0 0 1,15 * *', 'unix')).toBe('*-*-01,15 00:00:00');
  });

  it('converts L and L-N dom to ~N', () => {
    expect(convert('0 0 12 L * ? *', 'quartz')).toBe('*-*-~1 12:00:00');
    expect(convert('0 0 12 L-3 * ? *', 'quartz')).toBe('*-*-~4 12:00:00');
  });

  it('keeps years when the source has them', () => {
    expect(convert('0 0 0 1 1 ? 2025', 'quartz')).toBe('2025-01-01 00:00:00');
    expect(convert('0 0 1 1 * 2025', 'amazon')).toBe('2025-01-01 00:00:00');
  });
});
