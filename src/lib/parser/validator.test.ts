import { describe, expect, it } from 'vitest';

import { createTokenValidator } from './validator';

describe('createTokenValidator', () => {
  const SEC = (min: number, max: number) =>
    createTokenValidator(/[^0-9*,\-/]/, min, max);
  const L_FIELD = createTokenValidator(/[^0-9*,\-/L]/, 0, 59);
  const W_FIELD = createTokenValidator(/[^0-9*,\-/W]/, 0, 59);
  const DOM = createTokenValidator(/[^0-9*,\-LW#?/]/i, 1, 31);
  const DOW = createTokenValidator(/[^0-9*,\-LW?#]/i, 0, 6);

  it.each<[string, boolean, number, number]>([
    ['0-94-3', false, 0, 59],
    ['0-', false, 0, 59],
    ['foo-2', false, 0, 59],
    ['0-5', false, 1, 59],
    ['0-4', false, 0, 3],
    ['4-3', false, 0, 59],
    ['0-5', true, 0, 59],
    ['1--2', false, 0, 59],
    ['-1-2', false, 0, 59],
  ])('range: %s → %s (min=%d, max=%d)', (input, expected, min, max) => {
    expect(SEC(min, max)(input)).toBe(expected);
  });

  it.each([
    ['1/2/3', false],
    ['10-9/3', false],
    ['fooo/3', false],
    ['3/fooo', false],
    ['60/5', false],
    ['*/0', false],
    ['10-30/5', true],
    ['*/5', true],
    ['**/5', false],
  ])('step: %s → %s', (input, expected) => {
    expect(SEC(0, 59)(input)).toBe(expected);
  });

  it.each([
    ['1,2,3', true],
    ['1,,3', false],
    ['1', true],
  ])('list/literal: %s → %s', (input, expected) => {
    expect(SEC(0, 59)(input)).toBe(expected);
  });

  it.each([
    ['L', true],
    ['L-', false],
    ['L-9999', false],
  ])('L: %s → %s', (input, expected) => {
    expect(L_FIELD(input)).toBe(expected);
  });

  it.each([
    ['W', true],
    ['5W', true],
    ['W6', false],
  ])('W: %s → %s', (input, expected) => {
    expect(W_FIELD(input)).toBe(expected);
  });

  it.each<[string, (i: string) => boolean, boolean]>([
    ['5L3W', DOM, false],
    ['5LW', DOM, false],
    ['5W3L', DOM, false],
    ['6#3L', DOW, false],
    ['6L#3', DOW, false],
    ['LW5', DOM, false],
    ['1W2', DOM, false],
    ['1L2W3', DOM, false],
  ])('mixed: %s', (input, validator, expected) => {
    expect(validator(input)).toBe(expected);
  });

  it.each<[string, (i: string) => boolean, boolean]>([
    ['99W', DOM, false],
    ['8L', DOW, false],
    ['0L', DOW, false],
  ])('out-of-range: %s', (input, validator, expected) => {
    expect(validator(input)).toBe(expected);
  });

  it.each<[string, (i: string) => boolean, boolean]>([
    ['#3', DOW, false],
    ['6#', DOW, false],
    ['#', DOW, false],
    ['999#999', DOW, false],
    ['6#3#2', DOW, false],
    ['6#0', DOW, false],
    ['6#6', DOW, false],
  ])('malformed hash: %s', (input, validator, expected) => {
    expect(validator(input)).toBe(expected);
  });

  it.each<[string, (i: string) => boolean, boolean]>([
    ['?', DOM, true],
    ['?', DOW, true],
  ])('?: %s', (input, validator, expected) => {
    expect(validator(input)).toBe(expected);
  });

  it.each<[string, (i: string) => boolean, boolean]>([
    ['L', DOM, true],
    ['LW', DOM, true],
    ['L-3', DOM, true],
    ['L-', DOM, false],
    ['L-abc', DOM, false],
    ['1W', DOM, true],
    ['6L', DOW, true],
    ['6#3', DOW, true],
    ['1,2,3-5', DOW, true],
  ])('valid: %s', (input, validator, expected) => {
    expect(validator(input)).toBe(expected);
  });
});
