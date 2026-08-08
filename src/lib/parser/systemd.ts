import { OneBasedDayToNumber } from './base';

const DayToNumber = {
  ...OneBasedDayToNumber,
  friday: 5,
  monday: 1,
  saturday: 6,
  sunday: 7,
  thursday: 4,
  tuesday: 2,
  wednesday: 3,
};

export const SystemdParser = {
  /**
   * Get numeric range of an expression
   *
   * @param {string} expr Expression to check
   * @param {number} min Numeric lower bound
   * @param {number} max Numeric
   * @returns {number[]} Numeric range of that expression
   */
  getNumericRange: (expr: string, min: number, max: number): number[] => {
    const set = new Set<number>();

    for (const part of expr.split(',')) {
      if (part === '*') {
        for (let i = min; i <= max; i++) {
          set.add(i);
        }

        continue;
      }

      const range = /^(\d+)\.\.(\d+)(?:\/(\d+))?$/.exec(part);
      if (range) {
        const [, loStr, hiStr, stepStr] = range;
        const lo = Number(loStr);
        const hi = Number(hiStr);
        const step = stepStr ? Number(stepStr) : 1;
        if (step <= 0) {
          throw new Error('Repetition value must be positive');
        }

        for (let i = lo; i <= hi; i += step) {
          set.add(i);
        }

        continue;
      }

      const step = /^\*?\/(\d+)$/.exec(part);
      if (step) {
        const actualStep = Number(step[1]);
        if (actualStep <= 0) {
          throw new Error('Repetition value must be positive');
        }

        for (let i = min; i <= max; i += actualStep) {
          set.add(i);
        }

        continue;
      }

      const valueStepMatch = /^(\d+)\/(\d+)$/.exec(part);
      if (valueStepMatch) {
        const start = Number(valueStepMatch[1]);
        const step = Number(valueStepMatch[2]);
        if (step <= 0) {
          throw new Error('Repetition value must be positive');
        }

        for (let i = start; i <= max; i += step) {
          set.add(i);
        }

        continue;
      }

      const num = Number(part);
      if (!Number.isNaN(num)) {
        set.add(num);
        continue;
      }

      throw new Error(`Invalid calendar component: ${expr}`);
    }

    const values = Array.from(set).filter(v => v >= min && v <= max);
    if (values.length === 0) {
      throw new Error(`Component out of range: ${expr}`);
    }

    return values.sort((a, b) => a - b);
  },

  parseDate(expr: string): {
    year: number[];
    month: number[];
    day: number[];
    lastDayOffset?: number;
  } {
    // systemd allows `~`. Split on `-`, then split the
    // tail on `~` if present.
    const [yearPart, ...rest] = expr.split('-');

    if (!yearPart || rest.length === 0 || rest.length > 2) {
      throw new Error(`Invalid date: ${expr}`);
    }

    let monthPart: string;
    let dayPart: string;

    if (rest.length === 2) {
      [monthPart, dayPart] = rest;
    } else {
      const tildeIdx = rest[0].indexOf('~');
      if (tildeIdx === -1) {
        throw new Error(`Invalid date: ${expr}`);
      }

      monthPart = rest[0].slice(0, tildeIdx);
      dayPart = rest[0].slice(tildeIdx);
    }

    // `~N` in the day component = Nth-last day of month; `~` alone = last day.
    const tilde = /^~(\d*)$/.exec(dayPart);
    if (tilde) {
      const offset = tilde[1] === '' ? 1 : Number(tilde[1]);
      if (offset < 1) throw new Error(`Invalid last-day offset: ${dayPart}`);
      return {
        day: [],
        lastDayOffset: offset,
        month: this.collapseExpression(monthPart, 1, 12),
        year: this.collapseExpression(yearPart, 1970, 2099),
      };
    }

    return {
      day: this.collapseExpression(dayPart, 1, 31),
      month: this.collapseExpression(monthPart, 1, 12),
      year: this.collapseExpression(yearPart, 1970, 2099),
    };
  },

  parseWeekday(expr: string): number[] | undefined {
    const out = new Set<number>();

    for (const part of expr.split(',')) {
      const range = /^([a-z]+)\.\.([a-z]+)$/i.exec(part);
      if (range) {
        const lo = DayToNumber[range[1].toLowerCase() as keyof typeof DayToNumber];
        const hi = DayToNumber[range[2].toLowerCase() as keyof typeof DayToNumber];

        if (lo === undefined || hi === undefined) {
          throw new Error(`Invalid weekday range: ${part}`);
        }
        for (let d = lo; d <= hi; d++) {
          out.add(d);
        }

        continue;
      }

      const num = DayToNumber[part.toLowerCase() as keyof typeof DayToNumber];
      if (num === undefined) {
        throw new Error(`Invalid weekday: ${part}`);
      }

      out.add(num);
    }

    return out.size > 0 ? Array.from(out) : undefined;
  }
};
