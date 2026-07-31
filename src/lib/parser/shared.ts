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

function isValidL(expr: string, _min: number, max: number): boolean {
  // Just L or LW
  if (expr === 'L' || expr === 'LW') {
    return true;
  }

  // Anchored: must be exactly \d+L, with dow in 1..7
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

function isValidW(expr: string, min: number, max: number): boolean {
  if (expr === 'W') {
    return true;
  }

  // Anchored + range-checked: must be exactly \d+W, with digit in [min, max]
  const match = /^(\d+)W$/.exec(expr);
  if (!match) {
    return false;
  }

  const n = Number(match[1]);
  return n >= min && n <= max;
}

function isValidHash(expr: string): boolean {
  const m = /^(\d+)#(\d+)$/.exec(expr);
  if (!m) {
    return false;
  }

  const dow = Number(m[1]);
  const n = Number(m[2]);

  return dow >= 1 && dow <= 7 && n >= 1 && n <= 5;
}

function isValidNumber(expr: string, min: number, max: number): boolean {
  if (!/^\d+$/.test(expr)) {
    return false;
  }

  const n = Number(expr);
  return n >= min && n <= max;
}

/**
 * Create a reusable token validator, that includes range, wildcard, and step support
 *
 * @param {string} regex Allowed expression for the token
 * @param {number} min Numeric lower bound of the token
 * @param {number} max Numeric upper bound of the token
 * @param {(string) => string} preprocess Preprocessing step for the token before checked
 * for validity. Optional
 * @returns {(string) => boolean} A function that returns a boolean indicating the validity of the token.
 */
export function createTokenValidator(
  regex: RegExp,
  min: number,
  max: number,
  preprocess?: (token: string) => string,
): (token: string) => boolean {
  return (token: string) => {
    token = preprocess ? preprocess(token) : token;

    const badToken = regex.test(token);
    if (badToken) {
      return false;
    }

    const subToken = token.split(',');

    for (const t of subToken) {
      if (!t) {
        return false;
      }

      // Each sub-token must match exactly one family.
      // The families are mutually exclusive and the validators
      // are fully anchored, so a token matches at most one.
      const matched =
        t === '*' ||
        t === '?' ||
        isValidL(t, min, max) ||
        isValidW(t, min, max) ||
        isValidHash(t) ||
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

/**
 * Get possible numerical range from a schedule token which may
 * exist in steps or range.
 *
 * Do note that this function doesn't check if the token is valid or not, it just assumes that
 * it's valid. If it's somehow invalid, it will throw an Error object with unfriendly message.
 *
 * @param {string} token Expression token
 * @param {number} min Numeric lower bound of the token
 * @param {number} max Numeric upper bound of the token
 * @returns {number[]} Valid numerical range of the token
 */
export function getNumericRange(token: string, min: number, max: number): number[] {
  const ranges = new Set<number>();

  const subTokens = token.split(',');

  for (const t of subTokens) {
    if (/^\d+$/.test(t)) {
      ranges.add(Number(t));

      continue;
    }

    // wildcard, return all
    if (t === '*') {
      for (let i = min; i <= max; i++) {
        ranges.add(i);
      }

      continue;
    }

    if (isValidStep(t, min, max)) {
      const [possiblyRange, step] = t.split('/');
      const s = Number(step);

      let start = min;
      let end = max;

      // if the first token is range, use that as lower-upper bound
      if (isValidRange(possiblyRange, min, max)) {
        const [lo, hi] = possiblyRange.split('-');
        start = Number(lo);
        end = Number(hi);
      } else if (!Number.isNaN(Number(possiblyRange))) {
        start = Number(possiblyRange);
      }

      while (start <= end) {
        ranges.add(start);
        start += s;
      }

      continue;
    }

    if (isValidRange(t, min, max)) {
      const [lo, hi] = t.split('-');
      let start = Number(lo);
      const end = Number(hi);

      while (start <= end) {
        ranges.add(start);
        start++;
      }

      continue;
    }

    throw new Error('Schedule expression is not valid!');
  }

  return Array.from(ranges).sort((a, b) => a - b);
}
