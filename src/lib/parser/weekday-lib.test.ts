import { describe, expect, it } from 'vitest';

import { toOneBasedDayOfWeek, toZeroBasedDayOfWeek } from './weekday-lib';

describe('toOneBasedDayOfWeek', () => {
  it('passes through wildcards and special tokens untouched', () => {
    expect(toOneBasedDayOfWeek('*')).toBe('*');
    expect(toOneBasedDayOfWeek('?')).toBe('*');
    expect(toOneBasedDayOfWeek('6L')).toBe('6L');
    expect(toOneBasedDayOfWeek('5#3')).toBe('5#3');
    expect(toOneBasedDayOfWeek('2W')).toBe('2W');
    // name aliases are handled by applyAliases before conversion
    expect(toOneBasedDayOfWeek('MON')).toBe('MON');
  });

  it('keeps */step unchanged (same weekdays in both conventions)', () => {
    expect(toOneBasedDayOfWeek('*/2')).toBe('*/2');
    expect(toOneBasedDayOfWeek('*/3')).toBe('*/3');
  });

  it('shifts single values up by one, wrapping 7 (Sunday) to 1', () => {
    expect(toOneBasedDayOfWeek('0')).toBe('1');
    expect(toOneBasedDayOfWeek('1')).toBe('2');
    expect(toOneBasedDayOfWeek('6')).toBe('7');
    expect(toOneBasedDayOfWeek('7')).toBe('1');
  });

  it('shifts plain ranges', () => {
    expect(toOneBasedDayOfWeek('1-5')).toBe('2-6');
    expect(toOneBasedDayOfWeek('0-6')).toBe('1-7');
    expect(toOneBasedDayOfWeek('2-4')).toBe('3-5');
    expect(toOneBasedDayOfWeek('5-6')).toBe('6-7');
  });

  it('expands ranges that cross the Sunday boundary into a list', () => {
    expect(toOneBasedDayOfWeek('5-7')).toBe('6,7,1');
    expect(toOneBasedDayOfWeek('6-7')).toBe('7,1');
    expect(toOneBasedDayOfWeek('4-7')).toBe('5,6,7,1');
    expect(toOneBasedDayOfWeek('1-7')).toBe('2,3,4,5,6,7,1');
  });

  it('shifts lists element-wise', () => {
    expect(toOneBasedDayOfWeek('6,0')).toBe('7,1');
    expect(toOneBasedDayOfWeek('5,6,7')).toBe('6,7,1');
    expect(toOneBasedDayOfWeek('1,2,3')).toBe('2,3,4');
  });

  it('shifts step expressions and keeps the step', () => {
    expect(toOneBasedDayOfWeek('1-5/2')).toBe('2-6/2');
    expect(toOneBasedDayOfWeek('0/2')).toBe('1/2');
    expect(toOneBasedDayOfWeek('1/2')).toBe('2/2');
    expect(toOneBasedDayOfWeek('0-6/3')).toBe('1-7/3');
  });

  it('expands stepped ranges crossing the Sunday boundary', () => {
    expect(toOneBasedDayOfWeek('5-7/2')).toBe('6,1');
  });
});

describe('toZeroBasedDayOfWeek', () => {
  it('passes through wildcards and special tokens untouched', () => {
    expect(toZeroBasedDayOfWeek('*')).toBe('*');
    expect(toZeroBasedDayOfWeek('?')).toBe('*');
    expect(toZeroBasedDayOfWeek('6L')).toBe('6L');
    expect(toZeroBasedDayOfWeek('5#3')).toBe('5#3');
    expect(toZeroBasedDayOfWeek('2W')).toBe('2W');
    expect(toZeroBasedDayOfWeek('MON')).toBe('MON');
  });

  it('keeps */step unchanged', () => {
    expect(toZeroBasedDayOfWeek('*/2')).toBe('*/2');
  });

  it('shifts single values down by one, keeping 0 as 0', () => {
    expect(toZeroBasedDayOfWeek('1')).toBe('0');
    expect(toZeroBasedDayOfWeek('7')).toBe('6');
    expect(toZeroBasedDayOfWeek('6')).toBe('5');
    expect(toZeroBasedDayOfWeek('0')).toBe('0');
  });

  it('shifts plain ranges', () => {
    expect(toZeroBasedDayOfWeek('1-5')).toBe('0-4');
    expect(toZeroBasedDayOfWeek('2-6')).toBe('1-5');
    expect(toZeroBasedDayOfWeek('1-7')).toBe('0-6');
    expect(toZeroBasedDayOfWeek('6-7')).toBe('5-6');
  });

  it('shifts lists element-wise', () => {
    expect(toZeroBasedDayOfWeek('1,7')).toBe('0,6');
    expect(toZeroBasedDayOfWeek('5,6,7')).toBe('4,5,6');
    expect(toZeroBasedDayOfWeek('1,2,3')).toBe('0,1,2');
  });

  it('shifts step expressions and keeps the step', () => {
    expect(toZeroBasedDayOfWeek('1-5/2')).toBe('0-4/2');
    expect(toZeroBasedDayOfWeek('1/2')).toBe('0/2');
    expect(toZeroBasedDayOfWeek('0/2')).toBe('0/2');
    expect(toZeroBasedDayOfWeek('2-6/2')).toBe('1-5/2');
  });
});

describe('day-of-week conversion round trips', () => {
  // Converting a zero-based token to one-based and back must restore the
  // original token, as long as it does not span the Sunday boundary.
  it.each([
    '1',
    '6',
    '0',
    '1-5',
    '2-4',
    '6,0',
    '1,2,3',
    '1-5/2',
    '0/2',
    '*/2',
    '*',
  ])('toZeroBased(toOneBased(%s)) === %s', token => {
    expect(toZeroBasedDayOfWeek(toOneBasedDayOfWeek(token))).toBe(token);
  });
});
