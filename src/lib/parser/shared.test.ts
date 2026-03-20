import { describe, expect, it } from 'vitest';

import { isValidRange, isValidStep } from './shared';

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

describe('isValidStep', () => {
  it('should return false when there are multiple steps', () => {
    const input = '1/2/3';

    const min = 0;
    const max = 59;

    const expected = false;
    const actual = isValidStep(input, min, max);

    expect(actual).toBe(expected);
  });

  it('should return false when the first token is a range, but invalid', () => {
    const input = '10-9/3';

    const min = 0;
    const max = 59;

    const expected = false;
    const actual = isValidStep(input, min, max);

    expect(actual).toBe(expected);
  });

  it('should return false when the first token is not a number', () => {
    const input = 'fooo/3';

    const min = 0;
    const max = 59;

    const expected = false;
    const actual = isValidStep(input, min, max);

    expect(actual).toBe(expected);
  });

  it('should return false when the second token is not a Number', () => {
    const input = '3/fooo';

    const min = 0;
    const max = 59;

    const expected = false;
    const actual = isValidStep(input, min, max);

    expect(actual).toBe(expected);
  });

  it('should return false when the first token exist outside allowed range', () => {
    const input = '60/5';

    const min = 0;
    const max = 59;

    const expected = false;
    const actual = isValidStep(input, min, max);

    expect(actual).toBe(expected);
  });

  it('should return false when the second token is not a positive number', () => {
    const input = '*/0';

    const min = 0;
    const max = 59;

    const expected = false;
    const actual = isValidStep(input, min, max);

    expect(actual).toBe(expected);
  });

  it('should return true when the step is valid', () => {
    const input = '10-30/5';

    const min = 0;
    const max = 59;

    const expected = true;
    const actual = isValidStep(input, min, max);

    expect(actual).toBe(expected);
  });

  it('should allow asterisks', () => {
    const input = '*/5';

    const min = 0;
    const max = 59;

    const expected = true;
    const actual = isValidStep(input, min, max);

    expect(actual).toBe(expected);
  });

  it('should not allow multi asterisk', () => {
    const input = '**/5';

    const min = 0;
    const max = 59;

    const expected = false;
    const actual = isValidStep(input, min, max);

    expect(actual).toBe(expected);
  });
});
