import { describe, expect, it } from 'vitest';

import { createTokenValidator, getNumericRange } from './shared';

describe('createTokenValidator', () => {
  it('should return false when there are multiple range', () => {
    const input = '0-94-3';
    const min = 0;
    const max = 59;

    const expected = false;
    const actual = createTokenValidator(/[^0-9*,\-/]/, min, max)(input);

    expect(actual).toBe(expected);
  });

  it('should return false when there are only one token', () => {
    const input = '0-';
    const min = 0;
    const max = 59;

    const expected = false;
    const actual = createTokenValidator(/[^0-9*,\-/]/, min, max)(input);

    expect(actual).toBe(expected);
  });

  it('should return false when the separated tokens are not numbers', () => {
    const input = 'foo-2';
    const min = 0;
    const max = 59;

    const expected = false;
    const actual = createTokenValidator(/[^0-9*,\-/]/, min, max)(input);

    expect(actual).toBe(expected);
  });

  it('should return false when lower limit is lower than min', () => {
    const input = '0-5';
    const min = 1;
    const max = 59;

    const expected = false;
    const actual = createTokenValidator(/[^0-9*,\-/]/, min, max)(input);

    expect(actual).toBe(expected);
  });

  it('should return false when upper limit is higher than max', () => {
    const input = '0-4';
    const min = 0;
    const max = 3;

    const expected = false;
    const actual = createTokenValidator(/[^0-9*,\-/]/, min, max)(input);

    expect(actual).toBe(expected);
  });

  it('should return false when the upper limit is lower than lower limit', () => {
    const input = '4-3';
    const min = 0;
    const max = 59;

    const expected = false;
    const actual = createTokenValidator(/[^0-9*,\-/]/, min, max)(input);

    expect(actual).toBe(expected);
  });

  it('should return true when the range is valid', () => {
    const input = '0-5';
    const min = 0;
    const max = 59;

    const expected = true;
    const actual = createTokenValidator(/[^0-9*,\-/]/, min, max)(input);

    expect(actual).toBe(expected);
  });

  it('should return false when there are multiple steps', () => {
    const input = '1/2/3';

    const min = 0;
    const max = 59;

    const expected = false;
    const actual = createTokenValidator(/[^0-9*,\-/]/, min, max)(input);

    expect(actual).toBe(expected);
  });

  it('should return false when the first token is a range, but invalid', () => {
    const input = '10-9/3';

    const min = 0;
    const max = 59;

    const expected = false;
    const actual = createTokenValidator(/[^0-9*,\-/]/, min, max)(input);

    expect(actual).toBe(expected);
  });

  it('should return false when the first token is not a number', () => {
    const input = 'fooo/3';

    const min = 0;
    const max = 59;

    const expected = false;
    const actual = createTokenValidator(/[^0-9*,\-/]/, min, max)(input);

    expect(actual).toBe(expected);
  });

  it('should return false when the second token is not a Number', () => {
    const input = '3/fooo';

    const min = 0;
    const max = 59;

    const expected = false;
    const actual = createTokenValidator(/[^0-9*,\-/]/, min, max)(input);

    expect(actual).toBe(expected);
  });

  it('should return false when the first token exist outside allowed range', () => {
    const input = '60/5';

    const min = 0;
    const max = 59;

    const expected = false;
    const actual = createTokenValidator(/[^0-9*,\-/]/, min, max)(input);

    expect(actual).toBe(expected);
  });

  it('should return false when the second token is not a positive number', () => {
    const input = '*/0';

    const min = 0;
    const max = 59;

    const expected = false;
    const actual = createTokenValidator(/[^0-9*,\-/]/, min, max)(input);

    expect(actual).toBe(expected);
  });

  it('should return true when the step is valid', () => {
    const input = '10-30/5';

    const min = 0;
    const max = 59;

    const expected = true;
    const actual = createTokenValidator(/[^0-9*,\-/]/, min, max)(input);

    expect(actual).toBe(expected);
  });

  it('should allow asterisks', () => {
    const input = '*/5';

    const min = 0;
    const max = 59;

    const expected = true;
    const actual = createTokenValidator(/[^0-9*,\-/]/, min, max)(input);

    expect(actual).toBe(expected);
  });

  it('should not allow multi asterisk', () => {
    const input = '**/5';

    const min = 0;
    const max = 59;

    const expected = false;
    const actual = createTokenValidator(/[^0-9*,\-/]/, min, max)(input);

    expect(actual).toBe(expected);
  });

  it('should allow comma-separated values', () => {
    const input = '1,2,3';

    const min = 0;
    const max = 59;

    const expected = true;
    const actual = createTokenValidator(/[^0-9*,\-/]/, min, max)(input);

    expect(actual).toBe(expected);
  });

  it('should not allow comma-separated values with empties', () => {
    const input = '1,,3';

    const min = 0;
    const max = 59;

    const expected = false;
    const actual = createTokenValidator(/[^0-9*,\-/]/, min, max)(input);

    expect(actual).toBe(expected);
  });

  it('should allow number literals', () => {
    const input = '1';

    const min = 0;
    const max = 59;

    const expected = true;
    const actual = createTokenValidator(/[^0-9*,\-/]/, min, max)(input);

    expect(actual).toBe(expected);
  });
});

describe('getNumericRange', () => {
  it('should return only one value', () => {
    const token = '1';
    const min = 0;
    const max = 59;

    const expected = [1];
    const actual = getNumericRange(token, min, max);

    expect(actual).toEqual(expected);
  });

  it('should return list separated values', () => {
    const token = '1,2,3';
    const min = 0;
    const max = 59;

    const expected = [1, 2, 3];
    const actual = getNumericRange(token, min, max);

    expect(actual).toEqual(expected);
  });

  it('should return range', () => {
    const token = '0-50';
    const min = 0;
    const max = 59;

    const expected = Array.from({ length: 51 }, (_, i) => i);
    const actual = getNumericRange(token, min, max);

    expect(actual).toEqual(expected);
  });

  it('should return all valid ranges if the value is a wildcard', () => {
    const token = '*';
    const min = 0;
    const max = 59;

    const expected = Array.from({ length: 60 }, (_, i) => i);
    const actual = getNumericRange(token, min, max);

    expect(actual).toEqual(expected);
  });

  it('should return steps range correctly', () => {
    const token = '*/10';
    const min = 0;
    const max = 59;

    const expected = [0, 10, 20, 30, 40, 50];
    const actual = getNumericRange(token, min, max);

    expect(actual).toEqual(expected);
  });

  it('should return steps range correctly starting from a specific value', () => {
    const token = '5/10';
    const min = 0;
    const max = 59;

    const expected = [5, 15, 25, 35, 45, 55];
    const actual = getNumericRange(token, min, max);

    expect(actual).toEqual(expected);
  });

  it('should be able to parse range within steps', () => {
    const token = '10-30/5';
    const min = 0;
    const max = 59;

    const expected = [10, 15, 20, 25, 30];
    const actual = getNumericRange(token, min, max);

    expect(actual).toEqual(expected);
  });
});
