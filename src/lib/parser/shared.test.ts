import { describe, expect, it } from 'vitest';

import { isValidRange } from './shared';

describe('isValidRange', () => {
  it('should return false when there are multiple range', () => {
    const input = '0-94-3';
    const min = 0;
    const max = 59;

    const expected = false;
    const actual = isValidRange(input, min, max);

    expect(actual).toBe(expected);
  });

  it('should return false when the separated tokens are not numbers', () => {
    const input = 'foo-2';
    const min = 0;
    const max = 59;

    const expected = false;
    const actual = isValidRange(input, min, max);

    expect(actual).toBe(expected);
  });

  it('should return false when lower limit is lower than min', () => {
    const input = '0-5';
    const min = 1;
    const max = 59;

    const expected = false;
    const actual = isValidRange(input, min, max);

    expect(actual).toBe(expected);
  });

  it('should return false when upper limit is higher than max', () => {
    const input = '0-4';
    const min = 0;
    const max = 3;

    const expected = false;
    const actual = isValidRange(input, min, max);

    expect(actual).toBe(expected);
  });

  it('should return false when the upper limit is lower than lower limit', () => {
    const input = '4-3';
    const min = 0;
    const max = 59;

    const expected = false;
    const actual = isValidRange(input, min, max);

    expect(actual).toBe(expected);
  });

  it('should return true when the range is valid', () => {
    const input = '0-5';
    const min = 0;
    const max = 59;

    const expected = true;
    const actual = isValidRange(input, min, max);

    expect(actual).toBe(expected);
  });
});
