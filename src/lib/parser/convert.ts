/**
 * Shift a day-of-week expression from zero-based
 * convention to the one-based convention.
 *
 * @param {string} token Day-of-week expression to convert
 * @returns {string} One-based day-of-week expression
 */
export function toOneBasedDayOfWeek(token: string): string {
  if (token === '*' || /[LW#]/.test(token)) {
    return token;
  }

  if (token === '?') {
    return '*';
  }

  return token
    .split(',')
    .map(part => {
      // `*/step` selects the same weekdays in both conventions
      if (part.startsWith('*/')) {
        return part;
      }

      // a, a-b, a-b/s, a/s — shift numeric bounds up by one, keep the step
      const match = /^(\d+)(?:-(\d+))?(?:\/(\d+))?$/.exec(part);
      if (!match) {
        return part;
      }

      // 7 is an alternate spelling of Sunday in Unix; one-based Sunday is 1.
      const shift = (n: string) => {
        const value = Number(n);
        return value === 7 ? '1' : String(value + 1);
      };
      const lo = shift(match[1]);
      const hi = match[2] ? `-${shift(match[2])}` : '';
      const step = match[3] ? `/${match[3]}` : '';

      return `${lo}${hi}${step}`;
    })
    .join(',');
}

/**
 * Shift a day-of-week expression from the one-based convention
 * zero-based convention.
 *
 * @param {string} token Day-of-week expression to convert
 * @returns {string} Zero-based day-of-week expression
 */
export function toZeroBasedDayOfWeek(token: string): string {
  if (token === '*' || /[LW#]/.test(token)) {
    return token;
  }

  if (token === '?') {
    return '*';
  }

  return token
    .split(',')
    .map(part => {
      if (part.startsWith('*/')) {
        return part;
      }

      const match = /^(\d+)(?:-(\d+))?(?:\/(\d+))?$/.exec(part);
      if (!match) {
        return part;
      }

      const shift = (n: string) => (n === '0' ? '0' : String(Number(n) - 1));
      const lo = shift(match[1]);
      const hi = match[2] ? `-${shift(match[2])}` : '';
      const step = match[3] ? `/${match[3]}` : '';

      return `${lo}${hi}${step}`;
    })
    .join(',');
}
