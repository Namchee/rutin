import { Temporal } from '@js-temporal/polyfill';
import { describe, expect, it } from 'vitest';

import { CloudflareWorkersParser } from './cf-workers';

const START = Temporal.PlainDateTime.from('2026-07-01T00:00:00');

function fires(expr: string, count: number): Temporal.PlainDateTime[] {
  const dates: Temporal.PlainDateTime[] = [];
  for (const d of CloudflareWorkersParser.iterate(expr, START)) {
    dates.push(d);
    if (dates.length === count) break;
  }
  return dates;
}

describe('CloudflareWorkersParser iterator — L, W, # in DoM/DoW', () => {
  describe('DoW: L (Saturday)', () => {
    it('fires only on Saturdays', () => {
      const dates = fires('0 12 * * L', 6);

      expect(dates.every(d => d.dayOfWeek === 6)).toBe(true);
      expect(dates.map(d => d.day)).toEqual([4, 11, 18, 25, 1, 8]);
    });
  });

  describe('DoW: 5L (last Friday)', () => {
    it('fires on the last Friday of each month', () => {
      const dates = fires('0 12 * * 5L', 4);

      expect(dates.every(d => d.dayOfWeek === 5)).toBe(true);
      expect(dates.map(d => d.day)).toEqual([31, 28, 25, 30]);
    });
  });

  describe('DoW: 5#3 (3rd Friday)', () => {
    it('fires on the 3rd Friday of each month', () => {
      const dates = fires('0 12 * * 5#3', 3);

      expect(dates.every(d => d.dayOfWeek === 5)).toBe(true);
      expect(dates.map(d => d.day)).toEqual([17, 21, 18]);
    });
  });

  describe('DoW: list with L', () => {
    it('fires on last Friday OR last Tuesday', () => {
      const dates = fires('0 12 * * 5L,2L', 6);

      expect(dates.every(d => d.dayOfWeek === 5 || d.dayOfWeek === 2)).toBe(true);
      expect(dates[0].day).toBe(28);
      expect(dates[1].day).toBe(31);
    });
  });

  describe('DoW: 5#3 combined with 5L', () => {
    it('fires on 3rd OR last Friday', () => {
      const dates = fires('0 12 * * 5#3,5L', 4);

      expect(dates.every(d => d.dayOfWeek === 5)).toBe(true);
      expect(dates[0].day).toBe(17);
      expect(dates[1].day).toBe(31);
    });
  });

  describe('DoW: 5W (nearest weekday to the 5th)', () => {
    it('fires on a weekday near the 5th', () => {
      const dates = fires('0 12 * * 5W', 4);

      expect(dates.every(d => d.dayOfWeek >= 1 && d.dayOfWeek <= 5)).toBe(true);
      expect(dates[0].day).toBe(6);
      expect(dates[1].day).toBe(5);
    });
  });

  describe('DoM: L (last day of month)', () => {
    it('fires on the last day of each month', () => {
      const dates = fires('0 12 L * *', 4);

      expect(dates.map(d => d.day)).toEqual([31, 31, 30, 31]);
    });
  });

  describe('DoM: LW (last weekday of month)', () => {
    it('fires on the last weekday, never on a weekend', () => {
      const dates = fires('0 12 LW * *', 4);

      expect(dates.every(d => d.dayOfWeek >= 1 && d.dayOfWeek <= 5)).toBe(true);
      expect(dates[0].day).toBe(31);
      expect(dates[1].day).toBe(31);
    });
  });

  describe('DoM: 15W (nearest weekday to the 15th)', () => {
    it('fires on the nearest weekday to the 15th', () => {
      const dates = fires('0 12 15W * *', 3);

      expect(dates.every(d => d.dayOfWeek >= 1 && d.dayOfWeek <= 5)).toBe(true);
      expect(dates[0].day).toBe(15);
      expect(dates[1].day).toBe(14);
    });
  });

  describe('DoM: list with W and LW', () => {
    it('fires on 1W OR LW', () => {
      const dates = fires('0 12 1W,LW * *', 4);

      expect(dates.every(d => d.dayOfWeek >= 1 && d.dayOfWeek <= 5)).toBe(true);
      expect(dates[0].day).toBe(1);
      expect(dates[1].day).toBe(31);
    });
  });
});
