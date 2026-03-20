/**
 * Check whether a schedule range is valid or not.
 *
 * A schedule range is valid if:
 *  1. It contain 2 numbers, separated by a dash
 *  2. Both numbers are within the bounds of min and max
 *  3. Upper bound is greater than equal the lower bound
 *
 * @param {string} expr Range expression to evaluate
 * @param {number} min Minimum number of the lower bound
 * @param {number} max Maximum number of the upper bound
 * @returns {boolean} `true` if the range is valid. `false` otherwise.
 */
export function isValidRange(expr: string, min: number, max: number): boolean {
  const tokens = expr.split('-');

  if (tokens.length !== 2) {
    return false;
  }

  const from = Number(tokens[0]);
  const to = Number(tokens[1]);

  if (Number.isNaN(from) || Number.isNaN(to)) {
    return false;
  }

  return from >= min && from <= max && to >= min && to <= max && from <= to;
}

/**
 * Check whether a schedule step is valid or not.
 *
 * A schedule step is valid if:
 *  1. It contain 2 tokens, separated by slash
 *  2. The first token should either be a valid:
 *    a. Range
 *    b. An asterisk
 *    c. A number between specified range
 *  3. The second token must be a non negative number
 *
 * @param {string} expr Range expression to evaluate
 * @param {number} min Minimum number of the lower bound
 * @param {number} max Maximum number of the upper bound
 * @returns {boolean} `true` if the range is valid. `false` otherwise.
 */
export function isValidStep(expr: string, min: number, max: number): boolean {
  const tokens = expr.split('/');

  if (tokens.length !== 2) {
    return false;
  }

  const isFirstTokenStep = /-/.test(tokens[0]);

  if (isFirstTokenStep) {
    if (!isValidRange(tokens[0], min, max)) {
      return false;
    }
  } else {
    if (tokens[0] !== '*') {
      const range = Number(tokens[0]);

      if (Number.isNaN(range) || range < min || range > max) {
        return false;
      }
    }
  }

  const step = Number(tokens[1]);

  return !Number.isNaN(step) && step > 0;
}

export function createTokenValidator(
  regex: RegExp,
  min: number,
  max: number,
  preprocess?: (token: string) => string,
) {
  return (token: string) => {
    token = preprocess ? preprocess(token) : token;

    const badToken = regex.test(token);
    if (badToken) {
      return false;
    }

    const subToken = token.split(',');

    for (const t of subToken) {
      const isRange = t.includes('-');

      if (isRange && !isValidRange(t, min, max)) {
        return false;
      }

      const isStep = t.includes('/');

      if (isStep && !isValidStep(t, min, max)) {
        return false;
      }

      const singular = Number(t);

      if (Number.isNaN(singular)) {
        return false;
      }

      if (singular < min || singular > max) {
        return false;
      }
    }

    return true;
  };
}
