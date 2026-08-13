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
      if (part.startsWith('*/')) {
        return part;
      }

      const match = /^(\d+)(?:-(\d+))?(?:\/(\d+))?$/.exec(part);
      if (!match) {
        return part;
      }

      const shift = (n: string) => {
        const value = Number(n);
        return value === 7 ? '1' : String(value + 1);
      };
      const loShifted = shift(match[1]);
      const hiShifted = match[2] ? shift(match[2]) : undefined;
      const step = match[3] ? `/${match[3]}` : '';

      if (hiShifted !== undefined && Number(loShifted) > Number(hiShifted)) {
        const values: string[] = [];
        const loNum = Number(match[1]);
        const hiNum = Number(match[2]);
        const stepNum = match[3] ? Number(match[3]) : 1;

        for (let v = loNum; v <= hiNum; v += stepNum) {
          values.push(shift(String(v)));
        }

        return values.join(',');
      }

      return `${loShifted}${hiShifted !== undefined ? `-${hiShifted}` : ''}${step}`;
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
