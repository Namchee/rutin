import assert from 'node:assert';
import { describe, it } from 'node:test';

import { isValidRange } from './shared.js';

describe('isValidRange', () => {
  it('should return false when there are multiple range', () => {
    const input = '0-94-3';
    const min = 0;
    const max = 59;

    const expected = false;
    const actual = isValidRange(input, min, max);

    assert.equal(expected, actual);
  });
});
