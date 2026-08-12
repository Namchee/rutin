/**
 * Check whether an expression is a valid Last (x) expression.
 *
 * Bounded in upper direction only.
 *
 * @param {string} expr Expression to check
 * @param {number} max Numeric upper bound of the expression
 * @returns {boolean} `true` if the expression is valid. `false` otherwise.
 */
export function isValidL(expr: string, max: number): boolean {
  // Just L or LW
  if (expr === 'L' || expr === 'LW') {
    return true;
  }

  // Number prefix, but must only be 1-7
  const dowMatch = /^(\d+)L$/.exec(expr);
  if (dowMatch) {
    return Number(dowMatch[1]) >= 1 && Number(dowMatch[1]) <= 7;
  }

  // L-x syntax: must be exactly L-<non-negative digits in [0, max-1]>
  const parts = expr.split('-');
  if (parts.length !== 2 || parts[0] !== 'L' || parts[1].length === 0) {
    return false;
  }

  const n = Number(parts[1]);
  return !Number.isNaN(n) && n >= 0 && n < max;
}

/**
 * Check whether an expression is a valid numeric expression.
 *
 * @param {string} expr Expression to check
 * @param {number} min Numeric lower bound of the expression
 * @param {number} max Numeric upper bound of the expression
 * @returns {boolean} `true` if the expression is valid. `false` otherwise.
 */
export function isValidNumber(expr: string, min: number, max: number): boolean {
  if (!/^\d+$/.test(expr)) {
    return false;
  }

  const n = Number(expr);
  return n >= min && n <= max;
}

/**
 * Check whether an expression is a valid occurence expression.
 *
 * @param {string} expr Expression to check
 * @returns {boolean} `true` if the expression is valid. `false` otherwise.
 */
export function isValidOccurence(expr: string): boolean {
  const m = /^(\d+)#(\d+)$/.exec(expr);
  if (!m) {
    return false;
  }

  const dow = Number(m[1]);
  const n = Number(m[2]);

  return dow >= 1 && dow <= 7 && n >= 1 && n <= 5;
}

/**
 * Check whether a schedule range is valid or not.
 *
 * A schedule range is valid if:s
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
  const tokens = expr.split('-').filter(Boolean);

  if (tokens.length !== 2 || expr.length - 1 !== tokens.join('').length) {
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
  const tokens = expr.split('/').filter(Boolean);

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

/**
 * Check whether an expression is a valid weekday expressions.
 *
 * @param {string} expr Expression to check
 * @param {number} min Numeric lower bound of the expression
 * @param {number} max Numeric upper bound of the expression
 * @returns {boolean} `true` if the expression is valid. `false` otherwise.
 */
export function isValidW(expr: string, min: number, max: number): boolean {
  if (expr === 'W') {
    return true;
  }

  // Numeric prefix, but must be within min and max.
  const match = /^(\d+)W$/.exec(expr);
  if (!match) {
    return false;
  }

  const n = Number(match[1]);
  return n >= min && n <= max;
}

/**
 * Create a reusable token validator, that includes range, wildcard, and step support
 *
 * @param {string} regex Allowed expression for the token
 * @param {number} min Numeric lower bound of the token
 * @param {number} max Numeric upper bound of the token
 * @returns {(string) => boolean} A function that returns a boolean indicating the validity of the token.
 */
export function createTokenValidator(
  regex: RegExp,
  min: number,
  max: number,
): (token: string) => boolean {
  return (token: string) => {
    const badToken = regex.test(token);
    if (badToken) {
      return false;
    }

    const subToken = token.split(',');

    for (const t of subToken) {
      if (!t) {
        return false;
      }

      const matched =
        t === '*' ||
        t === '?' ||
        isValidL(t, max) ||
        isValidW(t, min, max) ||
        isValidOccurence(t) ||
        isValidStep(t, min, max) ||
        isValidRange(t, min, max) ||
        isValidNumber(t, min, max);

      if (!matched) {
        return false;
      }
    }

    return true;
  };
}
