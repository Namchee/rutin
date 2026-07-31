import { Temporal } from '@js-temporal/polyfill';
import { describe, expect, it } from 'vitest';

import { NodeParser } from './node';

const START = Temporal.PlainDateTime.from('2026-07-01T00:00:00');

/**
 * Drive the iterator directly (bypassing `cronstrue`, which doesn't support
 * every L/W/# form).
 */
function fires(expr: string, count: number): Temporal.PlainDateTime[] {
  const dates: Temporal.PlainDateTime[] = [];
  for (const d of NodeParser.iterate(expr, START)) {
    dates.push(d);
    if (dates.length === count) break;
  }
  return dates;
}

const validate = (expr: string) => NodeParser.validate(expr);
const normalize = (expr: string) => NodeParser.normalize(expr);

describe('NodeParser', () => {
  // ─────────────────────────── Macros ───────────────────────────

  describe('macros', () => {
    it.each([
      ['@hourly',   '0 * * * *'],
      ['@daily',    '0 0 * * *'],
      ['@midnight', '0 0 * * *'],
      ['@weekly',   '0 0 * * 0'],
      ['@monthly',  '0 0 1 * *'],
      ['@yearly',   '0 0 1 1 *'],
      ['@annually', '0 0 1 1 *'],
    ])('expands %s to %s', (macro, expected) => {
      const result = validate(macro);
      expect(result.status).toBe('valid');
      expect(normalize(macro)).toBe(expected);
    });

    it('treats an unknown macro as invalid', () => {
      expect(validate('@nope').status).toBe('invalid');
    });

    it('treats a macro prefix as incomplete', () => {
      expect(validate('@dai').status).toBe('incomplete');
    });
  });

  // ─────────────────────────── Validate ───────────────────────────

  describe('validate', () => {
    it('accepts a complete 5-field expression', () => {
      expect(validate('0 12 * * *').status).toBe('valid');
    });

    it('accepts a complete 6-field expression', () => {
      expect(validate('0 0 12 * * *').status).toBe('valid');
    });

    it('rejects a 4-field expression as incomplete', () => {
      expect(validate('0 12 * *').status).toBe('incomplete');
    });

    it('rejects a 7-field expression as invalid', () => {
      expect(validate('0 0 0 * * * *').status).toBe('invalid');
    });

    it('reports out-of-bounds fields', () => {
      const result = validate('99 0 * * 9');
      expect(result.status).toBe('invalid');
      expect(result.error).toEqual([0, 4]);
    });

    it('rejects an empty string', () => {
      expect(validate('').status).toBe('incomplete');
    });

    it('accepts L, W, # in DoM and DoW (5-field)', () => {
      expect(validate('0 12 L * *').status).toBe('valid');
      expect(validate('0 12 LW * *').status).toBe('valid');
      expect(validate('0 12 15W * *').status).toBe('valid');
      expect(validate('0 12 * * L').status).toBe('valid');
      expect(validate('0 12 * * 5L').status).toBe('valid');
      expect(validate('0 12 * * 5#3').status).toBe('valid');
    });

    it('accepts L, W, # with seconds (6-field)', () => {
      expect(validate('0 0 12 L * *').status).toBe('valid');
      expect(validate('0 0 12 * * 5L').status).toBe('valid');
    });
  });

  // ─────────────────────────── Normalize ───────────────────────────

  describe('normalize', () => {
    it('expands a macro', () => {
      expect(normalize('@daily')).toBe('0 0 * * *');
    });

    it('collapses repeated whitespace', () => {
      expect(normalize('  0  0 *\t\t* *  ')).toBe('0 0 * * *');
    });

    it('sorts out-of-order values', () => {
      expect(normalize('2,1 * * * *')).toBe('1,2 * * * *');
    });

    it('collapses a run of three or more into a range', () => {
      expect(normalize('1,2,3 * * * *')).toBe('1-3 * * * *');
    });

    it('folds month and day names into numbers', () => {
      expect(normalize('0 0 * JAN-MAR *')).toBe('0 0 * 1-3 *');
      expect(normalize('0 0 * * SUN')).toBe('0 0 * * 7');
    });

    it.each([
      '0 0 * * *',
      '@daily',
      '*/15 * * * *',
    ])('is idempotent for %s', (input) => {
      const once = normalize(input);
      const twice = normalize(once);
      expect(twice).toBe(once);
    });
  });

  // ─────────────────────────── Convert ───────────────────────────

  describe('convert', () => {
    it('strips the seconds field when converting from a 6-token quartz expression', () => {
      expect(NodeParser.convert('0 0 12 * * * 2026', 'quartz')).toBe('0 12 * * *');
    });

    it('strips the seconds field when converting from a 5-token quartz expression', () => {
      expect(NodeParser.convert('0 12 * * * *', 'quartz')).toBe('12 * * * *');
    });

    it('strips the seconds field when converting from a cf-workers expression', () => {
      expect(NodeParser.convert('0 0 12 * * *', 'cf-workers')).toBe('0 12 * * *');
      expect(NodeParser.convert('0 12 * * *', 'cf-workers')).toBe('0 12 * * *');
    });

    it('returns empty string for systemd source', () => {
      expect(NodeParser.convert('0 12 * * *', 'systemd')).toBe('');
    });
  });

  // ─────────────────────────── Iterate: 5-field ───────────────────────────

  describe('iterate (5-field)', () => {
    it('every minute', () => {
      const dates = fires('* * * * *', 3);
      expect(dates.map(d => d.toString().slice(11))).toEqual(['00:01:00', '00:02:00', '00:03:00']);
    });

    it('every hour at :00', () => {
      const dates = fires('0 * * * *', 3);
      expect(dates.map(d => d.toString().slice(11, 16))).toEqual(['01:00', '02:00', '03:00']);
    });

    it('5L — last Friday of the month', () => {
      const dates = fires('0 12 * * 5L', 3);
      expect(dates.map(d => d.day)).toEqual([31, 28, 25]);
    });

    it('friL — last Friday via day name', () => {
      const dates = fires('0 18 * * friL', 3);
      expect(dates.map(d => d.day)).toEqual([31, 28, 25]);
    });

    it('5#3 — 3rd Friday of the month', () => {
      const dates = fires('0 9 * * 5#3', 3);
      expect(dates.map(d => d.day)).toEqual([17, 21, 18]);
    });
  });

  // ─────────────────────────── Iterate: 6-field ───────────────────────────

  describe('iterate (6-field with seconds)', () => {
    it('every second', () => {
      const dates = fires('* * * * * *', 3);
      expect(dates.map(d => d.toString().slice(11))).toEqual(['00:00:01', '00:00:02', '00:00:03']);
    });

    it('at second 0 every minute', () => {
      // First firing after START is the next minute at :00.
      const dates = fires('0 * * * * *', 3);
      expect(dates.map(d => d.toString().slice(11, 16))).toEqual(['00:01', '00:02', '00:03']);
    });

    it('every 30 seconds', () => {
      const dates = fires('*/30 * * * * *', 3);
      expect(dates.map(d => d.second)).toEqual([30, 0, 30]);
    });

    it('5L with second — last Friday at 12:00:30', () => {
      const dates = fires('30 0 12 * * 5L', 3);
      expect(dates.map(d => d.toString().slice(0, 19))).toEqual([
        '2026-07-31T12:00:30',
        '2026-08-28T12:00:30',
        '2026-09-25T12:00:30',
      ]);
    });
  });
});
