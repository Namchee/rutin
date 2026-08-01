import { Temporal } from '@js-temporal/polyfill';

import { toString as describeSchedule } from 'cronstrue';

import type { ScheduleParser } from './types';

interface Field {
  readonly max: number;
  readonly min: number;
  readonly aliases?: Record<string, number>;
}

interface ScheduleParserOptions {
  minimumTokens: number;
  maximumTokens: number;
  fields: Field[];
}

type DayMatcher = (year: number, month: number, day: number) => boolean;

interface CompiledDayField {
  matchers: DayMatcher[];
  hasSpecial: boolean;
}

export function createScheduleParser({ fields, minimumTokens, maximumTokens }: ScheduleParserOptions) {
  return {
    /**
     * Collapse redundant CRON expressions into most compact form, usually
     * related with numeric range and wildcards.
     *
     * Used during normalization phase.
     *
     * @param {string} token Token to be collapsed
     * @param {Field} field Field rules that should be used when collapsing.
     * @returns {string} A more compact form of the token
     */
    collapseExpressions(token: string, field: Field): string {
      const { max, min } = field;
      const aliases = 'aliases' in field ? field.aliases : undefined;

      let t = token;

      // names -> numbers
      if (aliases) {
        const regex = new RegExp(`(${Object.keys(aliases).join('|')})`, 'gi');
        t = t.replace(regex, m => String(aliases[m.toLowerCase() as keyof typeof aliases]));
      }

      // token -> value set
      const hasStep = t.includes('/');
      let values: number[];
      try {
        values = this.getNumericRange(t, min, max);
      } catch {
        return t;
      }

      if (values.length === max - min + 1) {
        return '*';
      }

      if (hasStep) {
        return t;
      }

      // Find shortest equivalent form
      const parts: string[] = [];
      for (let i = 0; i < values.length;) {
        let j = i;
        while (j + 1 < values.length && values[j + 1] === values[j] + 1) {
          j++;
        }

        if (j - i >= 2) {
          parts.push(`${values[i]}-${values[j]}`);
        } else {
          for (let k = i; k <= j; k++) {
            parts.push(String(values[k]));
          }
        }

        i = j + 1;
      }

      return parts.join(',');
    },

    /**
     * Perform compilation to day of month / week for easier comparison
     *
     * @param {string} token Expression to validate
     * @param {string} field Field of interest, may be `dom` or `dow`
     * @returns {CompiledDayField} A 'compiled' day field that will be used
     * for later iteration
     */
    compileDayField(token: string, field: 'dom' | 'dow'): CompiledDayField {
      if (!/[LW#]/.test(token)) {
        const values = this.getNumericRange(
          token,
          field === 'dom' ? 1 : 0,
          field === 'dom' ? 31 : 7,
        );
        const set = new Set(values);
        const isNumeric = (y: number, m: number, d: number) => {
          if (field === 'dom') {
            return set.has(d);
          }

          return set.has(this.dayOfWeek(y, m, d));
        };

        return { hasSpecial: false, matchers: [isNumeric] };
      }

      const compileOne = field === 'dom' ? this.compileDOMToken : this.compileDOWToken;
      const parts = token.split(',');
      const matchers: DayMatcher[] = [];

      for (const part of parts) {
        const special = compileOne(part);
        if (special) {
          matchers.push(special);
          continue;
        }

        const values = this.getNumericRange(
          part,
          field === 'dom' ? 1 : 0,
          field === 'dom' ? 31 : 7,
        );
        const set = new Set(values);
        const isNumeric = (y: number, m: number, d: number) => {
          if (field === 'dom') {
            return set.has(d);
          }

          return set.has(this.dayOfWeek(y, m, d));
        };

        matchers.push(isNumeric);
      }

      return { hasSpecial: true, matchers };
    },

    /**
     * Compile Date of Month expression to create date matching utilities.
     *
     * @param {string} expr Date of Month expression
     * @returns A `DayMatcher` object if the expression is not a wildcard.
     * `null` otherwise.
     */
    compileDOMToken(expr: string): DayMatcher | null {
      if (expr === 'L') {
        return (y, m, d) => d === this.daysInMonth(y, m);
      }

      if (expr === 'LW') {
        return (y, m, d) => d === this.lastWeekdayOfMonth(y, m);
      }

      const w = /^(\d+)W$/.exec(expr);
      if (w) {
        const target = Number(w[1]);
        return (y, m, d) => d === this.nearestWeekdayToDay(y, m, target);
      }

      const lx = /^L-(\d+)$/.exec(expr);
      if (lx) {
        const n = Number(lx[1]);
        return (y, m, d) => {
          const target = this.daysInMonth(y, m) - n;
          return d === target && target >= 1;
        };
      }

      return null;
    },

    /**
     * Compile Weekday expression to create date matching utilities.
     *
     * @param {string} token Weekday expression
     * @returns A `DayMatcher` object if the expression is not a wildcard.
     * `null` otherwise.
     */
    compileDOWToken(token: string): DayMatcher | null {
      // 1=Mon..7=Sun
      if (token === 'L') {
        return (y, m, d) => this.dayOfWeek(y, m, d) === 6;
      }
      const l = /^(\d+)L$/.exec(token);
      if (l) {
        const dow = Number(l[1]);
        return (y, m, d) => d === this.lastDayOfWeekInMonth(y, m, dow);
      }
      const w = /^(\d+)W$/.exec(token);
      if (w) {
        const target = Number(w[1]);
        return (y, m, d) => d === this.nearestWeekdayToDay(y, m, target);
      }
      const hash = /^(\d+)#(\d+)$/.exec(token);
      if (hash) {
        const dow = Number(hash[1]);
        const n = Number(hash[2]);
        return (y, m, d) => d === this.nthDayOfWeekInMonth(y, m, dow, n);
      }

      // L-x
      const lx = /^L-(\d+)$/.exec(token);
      if (lx) {
        const n = Number(lx[1]);
        let dow = 6 - n;
        while (dow <= 0) {
          dow += 7;
        }

        return (y, m, d) => this.dayOfWeek(y, m, d) === dow;
      }

      return null;
    },

    /**
     * Create a reusable token validator, that includes range, wildcard, and step support
     *
     * @param {string} regex Allowed expression for the token
     * @param {number} min Numeric lower bound of the token
     * @param {number} max Numeric upper bound of the token
     * @param {(string) => string} preprocess Preprocessing step for the token before checked
     * for validity. Usually used to normalize aliases. Optional.
     * @returns {(string) => boolean} A function that returns a boolean indicating the validity of the token.
     */
    createTokenValidator(
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

          const matched =
            t === '*' ||
            t === '?' ||
            this.isValidL(t, max) ||
            this.isValidW(t, min, max) ||
            this.isValidOccurence(t) ||
            this.isValidStep(t, min, max) ||
            this.isValidRange(t, min, max) ||
            this.isValidNumber(t, min, max);

          if (!matched) {
            return false;
          }
        }

        return true;
      };
    },

    /**
     * Get the weekday of current date
     *
     * @param {number} year Current year
     * @param {number} month Current month
     * @param {number} day Current date
     * @returns {number} Numeric weekday representation
     */
    dayOfWeek(year: number, month: number, day: number): number {
      return Temporal.PlainDate.from({ day, month, year }).dayOfWeek;
    },

    /**
     * Get number of days in a certain month
     *
     * @param {number} year Current year
     * @param {number} month Current month
     * @returns {number} Number of day in that month
     */
    daysInMonth(year: number, month: number): number {
      return new Temporal.PlainDate(year, month, 1).add({ months: 1 }).subtract({ days: 1 }).day;
    },

    /**
     * Get possible numerical range from a schedule token.
     *
     * Do note that this function doesn't check if the token is valid or not, it just assumes that
     * it's valid. If it's somehow invalid, it will throw an Error object with _unfriendly_ message.
     *
     * @param {string} token Expression token
     * @param {number} min Numeric lower bound of the token
     * @param {number} max Numeric upper bound of the token
     * @returns {number[]} Valid numerical range of the token
     */
    getNumericRange(token: string, min: number, max: number): number[] {
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

        if (this.isValidStep(t, min, max)) {
          const [possiblyRange, step] = t.split('/');
          const s = Number(step);

          let start = min;
          let end = max;

          // if the first token is range, use that as lower-upper bound
          if (this.isValidRange(possiblyRange, min, max)) {
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

        if (this.isValidRange(t, min, max)) {
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
    },

    /**
     * Checks whether the provided expression is already normalized or not.
     *
     * @param {string} expr Expression to check
     * @returns A boolean
     */
    isNormal(expr: string): boolean {
      return this.normalize(expr) === expr;
    },

    /**
     * Check whether an expression is a valid Last (x) expression.
     *
     * Bounded in upper direction only.
     *
     * @param {string} expr Expression to check
     * @param {number} max Numeric upper bound of the expression
     * @returns {boolean} `true` if the expression is valid. `false` otherwise.
     */
    isValidL(expr: string, max: number): boolean {
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
    },

    /**
     * Check whether an expression is a valid numeric expression.
     *
     * @param {string} expr Expression to check
     * @param {number} min Numeric lower bound of the expression
     * @param {number} max Numeric upper bound of the expression
     * @returns {boolean} `true` if the expression is valid. `false` otherwise.
     */
    isValidNumber(expr: string, min: number, max: number): boolean {
      if (!/^\d+$/.test(expr)) {
        return false;
      }

      const n = Number(expr);
      return n >= min && n <= max;
    },

    /**
     * Check whether an expression is a valid occurence expression.
     *
     * @param {string} expr Expression to check
     * @returns {boolean} `true` if the expression is valid. `false` otherwise.
     */
    isValidOccurence(expr: string): boolean {
      const m = /^(\d+)#(\d+)$/.exec(expr);
      if (!m) {
        return false;
      }

      const dow = Number(m[1]);
      const n = Number(m[2]);

      return dow >= 1 && dow <= 7 && n >= 1 && n <= 5;
    },

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
    isValidRange(expr: string, min: number, max: number): boolean {
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
    },

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
    isValidStep(expr: string, min: number, max: number): boolean {
      const tokens = expr.split('/').filter(Boolean);

      if (tokens.length !== 2) {
        return false;
      }

      const isFirstTokenStep = /-/.test(tokens[0]);

      if (isFirstTokenStep) {
        if (!this.isValidRange(tokens[0], min, max)) {
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
    },

    /**
     * Check whether an expression is a valid weekday expressions.
     *
     * @param {string} expr Expression to check
     * @param {number} min Numeric lower bound of the expression
     * @param {number} max Numeric upper bound of the expression
     * @returns {boolean} `true` if the expression is valid. `false` otherwise.
     */
    isValidW(expr: string, min: number, max: number): boolean {
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
    },

    /**
     * Create a date time generator for the current expression.
     *
     * @param {string} expr Schedule expression
     * @param {Temporal.PlainDateTime} start Starting date time
     * @returns {Generator<Temporal.PlainDateTime, unknown, unknown>} Generator object that yields
     * `Temporal.PlainDateTime` object
     */
    *iterate(expr: string, start: Temporal.PlainDateTime) {
      const tokens = this.normalize(expr).trim().split(/\s+/);

      // to be parsed, the expression must be complete
      if (tokens.length !== 5) {
        return undefined;
      }

      const ranges = [
        this.getNumericRange(tokens[0], 0, 59),
        this.getNumericRange(tokens[1], 0, 23),
        this.getNumericRange(tokens[3], 1, 12),
      ];

      const domCompiled = this.compileDayField(tokens[2], 'dom');
      const dowCompiled = this.compileDayField(tokens[4], 'dow');

      const isDomWild = tokens[2] === '*';
      const isDowWild = tokens[4] === '*';

      const curr = start
        .with({ microsecond: 0, millisecond: 0, nanosecond: 0, second: 0 })
        .add({ minutes: 1 });

      let next = this.nextMatch(curr, ranges, domCompiled, dowCompiled, isDomWild, isDowWild);
      while (next !== null) {
        yield next;

        next = this.nextMatch(
          next.add({ minutes: 1 }),
          ranges,
          domCompiled,
          dowCompiled,
          isDomWild,
          isDowWild,
        );
      }
    },

    /**
     * Find the the specified last day of week of the current month (e.g: last friday of the month)
     *
     * @param {number} year Current year
     * @param {number} month Current month
     * @param {number} dow Weekday numeric representation
     * @returns {number} Numeric representation of specified last day of week of the current month
     */
    lastDayOfWeekInMonth(year: number, month: number, dow: number): number {
      const last = this.daysInMonth(year, month);
      for (let d = last; d >= 1; d--) {
        if (this.dayOfWeek(year, month, d) === dow) {
          return d;
        }
      }
      return last;
    },

    /**
     * Get the last weekday of the month
     *
     * @param {number} year Current year
     * @param {number} month Current month
     * @returns {number} Numeric representation of last weekday of the month
     */
    lastWeekdayOfMonth(year: number, month: number): number {
      const last = this.daysInMonth(year, month);
      const dow = this.dayOfWeek(year, month, last);
      if (dow === 6) {
        return last - 1;
      }
      if (dow === 7) {
        return last - 2;
      }
      return last;
    },

    /**
     * Get the nearest weekday from a day.
     *
     * @param {number} year Current year
     * @param {number} month Current month
     * @param {number} target Numeric representation of the day
     * @returns
     */
    nearestWeekdayToDay(year: number, month: number, target: number): number {
      const day = Math.min(target, this.daysInMonth(year, month));
      const dow = this.dayOfWeek(year, month, day);
      if (dow === 6) {
        // Saturday -> Friday
        return day === 1 ? 3 : day - 1;
      }
      if (dow === 7) {
        // Sunday -> Monday
        const last = this.daysInMonth(year, month);
        return day === last ? day - 2 : day + 1;
      }
      return day;
    },

    /**
     * Find next date time that matches the current expression.
     *
     * @param {Temporal.PlainDateTime} curr Current date time
     * @param {number[][]} ranges Valid time range
     * @param {CompiledDayField} dom Date of month matcher
     * @param {CompiledDayField} dow Weekday matcher
     * @param {boolean} isDomWild Whether or not the date of month is a wildcard
     * @param {boolean} isDowWild Whether or not the weekday is a wildcard
     * @returns {Temporal.PlainDateTime} Next matched date time.
     */
    nextMatch(
      curr: Temporal.PlainDateTime,
      ranges: number[][],
      dom: CompiledDayField,
      dow: CompiledDayField,
      isDomWild: boolean,
      isDowWild: boolean,
    ): Temporal.PlainDateTime {
      while (true) {
        if (!ranges[2].includes(curr.month)) {
          const nextMonth = ranges[2].find(m => m > curr.month) ?? ranges[2][0];
          const year = nextMonth <= curr.month ? curr.year + 1 : curr.year;
          curr = curr.with({ day: 1, hour: 0, minute: 0, month: nextMonth, second: 0, year });

          continue;
        }

        const domMatch = dom.matchers.some(m => m(curr.year, curr.month, curr.day));
        const dowMatch = dow.matchers.some(m => m(curr.year, curr.month, curr.day));
        const dateValid = isDomWild || isDowWild ? domMatch && dowMatch : domMatch || dowMatch;
        if (!dateValid) {
          curr = curr.add({ days: 1 }).with({ hour: 0, minute: 0, second: 0 });
          continue;
        }

        if (!ranges[1].includes(curr.hour)) {
          const nextHour = ranges[1].find(h => h > curr.hour) ?? ranges[1][0];
          curr = (nextHour <= curr.hour ? curr.add({ days: 1 }) : curr).with({
            hour: nextHour,
            minute: 0,
            second: 0,
          });

          continue;
        }

        if (!ranges[0].includes(curr.minute)) {
          const nextMin = ranges[0].find(m => m > curr.minute) ?? ranges[0][0];
          curr = (nextMin <= curr.minute ? curr.add({ hours: 1 }) : curr).with({
            minute: nextMin,
            second: 0,
          });
          continue;
        }

        return curr;
      }
    },

    /**
     * Perform a normalization on the current expression.
     *
     * A normalization is a process that:
     *   1. Removes extratenous whitespaces
     *   2. Replaces day / month alias with numerical values
     *   3. Simplify range operations
     *
     * @param {string} expr Expression to normalize
     * @returns {string} Normalized expression
     */
    normalize(expr: string): string {
      const trimmed = expr.trim().replaceAll(/\s+/g, ' ');

      return trimmed
        .split(' ')
        .map((t, i) => (i < fields.length ? this.collapseExpressions(t, fields[i]) : t))
        .join(' ');
    },

    /**
     * Get nth weekday of the month.
     *
     * @param {number} year Current year
     * @param {number} month Current month
     * @param {number} dow Current weekday
     * @param {number} n xth day to get
     * @returns {number | null} A number representing weekday. in Temporal
     * value instead of Date
     */
    nthDayOfWeekInMonth(year: number, month: number, dow: number, n: number): number | null {
      let count = 0;
      const last = this.daysInMonth(year, month);
      for (let d = 1; d <= last; d++) {
        if (this.dayOfWeek(year, month, d) === dow) {
          count++;
          if (count === n) {
            return d;
          }
        }
      }

      return null;
    },

    validate(expr: string): ReturnType<ScheduleParser['validate']> {
      const trimmedExpr = expr.trim();

      const rawTokens = trimmedExpr.split(/\s+/);
      const tokens = this.normalize(trimmedExpr).split(/\s+/).filter(Boolean);
      const error: number[] = [];

      for (let idx = 0; idx < tokens.length && idx < maximumTokens; idx++) {
        if (!Validator[idx](tokens[idx])) {
          error.push(idx);
        }
      }

      if (error.length > 0) {
        return {
          error,
          normal: this.isNormal(trimmedExpr),
          status: 'invalid',
          tokens: rawTokens.filter(Boolean),
        };
      }

      if (tokens.length < minimumTokens) {
        return {
          error: [],
          normal: this.isNormal(trimmedExpr),
          status: 'incomplete',
          tokens: rawTokens.filter(Boolean),
        };
      }

      if (tokens.length > maximumTokens) {
        return {
          error: [],
          normal: this.isNormal(trimmedExpr),
          status: 'invalid',
          tokens: rawTokens.filter(Boolean),
        };
      }

      try {
        return {
          descriptor: describeSchedule(this.normalize(expr)),
          generator: this.iterate(trimmedExpr, Temporal.Now.plainDateTimeISO()),
          normal: this.isNormal(trimmedExpr),
          status: 'valid',
          tokens: rawTokens.filter(Boolean),
        };
        // handle cronstrue error
      } catch {
        return {
          error: [],
          normal: this.isNormal(trimmedExpr),
          status: 'invalid',
          tokens: rawTokens.filter(Boolean),
        };
      }
    },
  };
}
