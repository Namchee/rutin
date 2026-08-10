import { describe, expect, it } from 'vitest';

import { UNIXParser } from './unix';

describe('convert to unix', () => {
  it('unix -> unix is identity', () => {
    expect(UNIXParser.convert('0 12 * * *', 'unix')).toBe('0 12 * * *');
    expect(UNIXParser.convert('@daily', 'unix')).toBe('0 0 * * *');
  });

  it('node: drops optional seconds', () => {
    expect(UNIXParser.convert('0 30 9 * * 1-5', 'node')).toBe('30 9 * * 1-5');
    expect(UNIXParser.convert('0 0 12 * * *', 'node')).toBe('0 12 * * *');
    expect(UNIXParser.convert('@weekly', 'node')).toBe('0 0 * * 0');
    expect(UNIXParser.convert('0 0 * * 1', 'node')).toBe('0 0 * * 1');
  });

  it('quartz: drops seconds and year, shifts dow to zero-based', () => {
    expect(UNIXParser.convert('0 0 12 * * ? *', 'quartz')).toBe('0 12 * * *');
    expect(UNIXParser.convert('0 0 12 ? * 1 *', 'quartz')).toBe('0 12 * * 0');
    expect(UNIXParser.convert('0 0 12 ? * 7 *', 'quartz')).toBe('0 12 * * 6');
    expect(UNIXParser.convert('0 30 9 ? * MON-FRI *', 'quartz')).toBe('30 9 * * 1-5');
    expect(UNIXParser.convert('0 0 12 1,15 * ? *', 'quartz')).toBe('0 12 1,15 * *');
    expect(UNIXParser.convert('0 0 0 ? * SUN *', 'quartz')).toBe('0 0 * * 0');
    expect(UNIXParser.convert('0 15 10 ? * 1-5 2024', 'quartz')).toBe('15 10 * * 0-4');
    expect(UNIXParser.convert('0 0 12 L * ? *', 'quartz')).toBe('0 12 L * *');
    // 6-field quartz: minute hour dom month dow year (no seconds)
    expect(UNIXParser.convert('0 12 ? * 1 2024', 'quartz')).toBe('0 12 * * 0');
  });

  it('amazon: drops year, shifts dow to zero-based, ? -> *', () => {
    expect(UNIXParser.convert('0 12 ? * MON *', 'amazon')).toBe('0 12 * * 1');
    expect(UNIXParser.convert('0 12 ? * 5 2024', 'amazon')).toBe('0 12 * * 4');
    expect(UNIXParser.convert('15 10 ? * 6L 2024', 'amazon')).toBe('15 10 * * 6L');
    expect(UNIXParser.convert('0 0 ? * 2,4 *', 'amazon')).toBe('0 0 * * 1,3');
  });

  it('cf-workers: shifts dow to zero-based', () => {
    expect(UNIXParser.convert('0 0 * * 1', 'cf-workers')).toBe('0 0 * * 0');
    expect(UNIXParser.convert('0 0 * * 7', 'cf-workers')).toBe('0 0 * * 6');
    expect(UNIXParser.convert('30 9 * * 2-6', 'cf-workers')).toBe('30 9 * * 1-5');
  });

  it('systemd: maps weekday/date/time onto the 5 unix fields', () => {
    expect(UNIXParser.convert('daily', 'systemd')).toBe('0 0 * * *');
    expect(UNIXParser.convert('hourly', 'systemd')).toBe('0 * * * *');
    expect(UNIXParser.convert('minutely', 'systemd')).toBe('* * * * *');
    expect(UNIXParser.convert('Mon..Fri *-*-* 09:00:00', 'systemd')).toBe('0 9 * * 1-5');
    expect(UNIXParser.convert('*-*-15 12:30', 'systemd')).toBe('30 12 15 * *');
    expect(UNIXParser.convert('Sat,Sun *-*-* 00:00:00', 'systemd')).toBe('0 0 * * 6,0');
    expect(UNIXParser.convert('Mon *-*-*', 'systemd')).toBe('0 0 * * 1');
    expect(UNIXParser.convert('2024-01-01 00:00:00', 'systemd')).toBe('0 0 1 1 *');
    expect(UNIXParser.convert('*-01..06-* 0/30:15:00', 'systemd')).toBe('15 0/30 * 1-6 *');
    expect(UNIXParser.convert('*-*-~1 12:00:00', 'systemd')).toBe('0 12 ~1 * *');
  });
});
