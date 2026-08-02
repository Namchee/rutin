import { Temporal } from '@js-temporal/polyfill';

import { toString as describeSchedule } from 'cronstrue';
import type { FieldName, ScheduleParser } from './types';
import { isValidRange, isValidStep } from './validator';

interface Field {
  max: number;
  min: number;
  aliases?: Record<string, number>;
  optional?: boolean;
}

interface ScheduleParserOptions {
  fields: Partial<Record<FieldName, Field>>;
  validators: Partial<Record<FieldName, (token: string) => boolean>>;
  tokenizer: (expr: string) => Partial<Record<FieldName, string>>;
  macros?: Record<string, string>;
}

type DayMatcher = (year: number, month: number, day: number) => boolean;

interface CompiledDayField {
  matchers: DayMatcher[];
  hasSpecial: boolean;
}

export function createScheduleParser({
  fields,
  validators,
  macros,
  tokenizer,
}: ScheduleParserOptions) {
  return {
    /**
     * Replace aliases in token values (e.g. `SUN` -> `0`) using the
     * field definitions' `aliases` records. Operates on the named-token
     * map, so the position order doesn't matter.
     */
    applyAliases(tokens: TokenMap): TokenMap {
      const out: TokenMap = {};
      for (const [name, value] of Object.entries(tokens)) {
        if (typeof value !== 'string') {
          continue;
        }

        const def = fields[name as keyof typeof fields];
        if (!def?.aliases) {
          out[name as FieldName] = value;
          continue;
        }
        const aliases = def.aliases;
        const regex = new RegExp(`(${Object.keys(aliases).join('|')})`, 'gi');
        out[name as FieldName] = value.replace(regex, m =>
          String(aliases[m.toLowerCase() as keyof typeof aliases]),
        );
      }
      return out;
    },

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
        // 0 and 7 are both Sunday
        const set = new Set(field === 'dow' ? values.map(d => (d === 0 ? 7 : d)) : values);
        const isNumeric = (y: number, m: number, d: number) => {
          if (field === 'dom') {
            return set.has(d);
          }

          return set.has(this.dayOfWeek(y, m, d));
        };

        return { hasSpecial: false, matchers: [isNumeric] };
      }

      const compileDOM = this.compileDOMToken.bind(this);
      const compileDOW = this.compileDOWToken.bind(this);
      const getNumericRange = this.getNumericRange;
      const dayOfWeekFn = this.dayOfWeek;
      const compileOne = field === 'dom' ? compileDOM : compileDOW;
      const parts = token.split(',');
      const matchers: DayMatcher[] = [];

      for (const part of parts) {
        const special = compileOne(part);
        if (special) {
          matchers.push(special);
          continue;
        }

        const values = getNumericRange(part, field === 'dom' ? 1 : 0, field === 'dom' ? 31 : 7);
        // 0 and 7 are both Sunday
        const set = new Set(field === 'dow' ? values.map(d => (d === 0 ? 7 : d)) : values);
        const isNumeric = (y: number, m: number, d: number) => {
          if (field === 'dom') {
            return set.has(d);
          }

          return set.has(dayOfWeekFn(y, m, d));
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
      const daysInMonth = this.daysInMonth.bind(this);
      const lastWeekdayOfMonth = this.lastWeekdayOfMonth.bind(this);
      const nearestWeekdayToDay = this.nearestWeekdayToDay.bind(this);

      if (expr === 'L') {
        return (y, m, d) => d === daysInMonth(y, m);
      }

      if (expr === 'LW') {
        return (y, m, d) => d === lastWeekdayOfMonth(y, m);
      }

      const w = /^(\d+)W$/.exec(expr);
      if (w) {
        const target = Number(w[1]);
        return (y, m, d) => d === nearestWeekdayToDay(y, m, target);
      }

      const lx = /^L-(\d+)$/.exec(expr);
      if (lx) {
        const n = Number(lx[1]);
        return (y, m, d) => {
          const target = daysInMonth(y, m) - n;
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
      const dayOfWeek = this.dayOfWeek.bind(this);
      const lastDayOfWeekInMonth = this.lastDayOfWeekInMonth.bind(this);
      const nearestWeekdayToDay = this.nearestWeekdayToDay.bind(this);
      const nthDayOfWeekInMonth = this.nthDayOfWeekInMonth.bind(this);

      if (token === 'L') {
        return (y, m, d) => dayOfWeek(y, m, d) === 6;
      }
      const l = /^(\d+)L$/.exec(token);
      if (l) {
        const dow = Number(l[1]);
        return (y, m, d) => d === lastDayOfWeekInMonth(y, m, dow);
      }
      const w = /^(\d+)W$/.exec(token);
      if (w) {
        const target = Number(w[1]);
        return (y, m, d) => d === nearestWeekdayToDay(y, m, target);
      }
      const hash = /^(\d+)#(\d+)$/.exec(token);
      if (hash) {
        const dow = Number(hash[1]);
        const n = Number(hash[2]);
        return (y, m, d) => d === nthDayOfWeekInMonth(y, m, dow, n);
      }

      // L-x
      const lx = /^L-(\d+)$/.exec(token);
      if (lx) {
        const n = Number(lx[1]);
        let dow = 6 - n;
        while (dow <= 0) {
          dow += 7;
        }

        return (y, m, d) => dayOfWeek(y, m, d) === dow;
      }

      return null;
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
     * Create a date time generator for the current expression.
     *
     * @param {string} expr Schedule expression
     * @param {Temporal.PlainDateTime} start Starting date time
     * @returns {Generator<Temporal.PlainDateTime, unknown, unknown>} Generator object that yields
     * `Temporal.PlainDateTime` object
     */
    *iterate(expr: string, start: Temporal.PlainDateTime): Generator<Temporal.PlainDateTime, unknown, unknown> {
      const { tokens } = this.tokenize(expr);
      const present = (n: FieldName) => tokens[n] !== undefined;

      if (Object.keys(tokens).length === 0) {
        return undefined;
      }

      const ranges: Partial<Record<FieldName, number[]>> = {};
      for (const name of fieldOrder) {
        const value = tokens[name];
        if (value === undefined) {
          continue;
        }

        if ((name === 'dayOfMonth' || name === 'dayOfWeek') && /[LW#]/.test(value)) {
          continue;
        }

        const def = fields[name];
        if (!def) {
          continue;
        }

        ranges[name] = this.getNumericRange(value, def.min, def.max);
      }

      const domCompiled = this.compileDayField(tokens.dayOfMonth, 'dom');
      const dowCompiled = this.compileDayField(tokens.dayOfWeek, 'dow');

      const isDomWild = tokens.dayOfMonth === '*';
      const isDowWild = tokens.dayOfWeek === '*';

      const hasSeconds = present('second');

      const base = start.with({
        microsecond: 0,
        millisecond: 0,
        nanosecond: 0,
        second: 0,
      });

      // 5-field: minute-precision. 6-field with seconds: second-precision.
      let curr = hasSeconds ? base.add({ seconds: 1 }) : base.add({ minutes: 1, seconds: 0 });

      while (true) {
        const matched = this.nextMatch(
          curr,
          ranges,
          domCompiled,
          dowCompiled,
          isDomWild,
          isDowWild,
        );
        if (matched === null) return;

        if (hasSeconds && ranges.second) {
          // For 6-field, yield each second in the second range at this matched minute.
          const seconds = [...ranges.second].sort((a, b) => a - b);
          for (const sec of seconds) {
            const candidate = matched.with({ second: sec });
            if (Temporal.PlainDateTime.compare(candidate, base) <= 0) continue;
            yield candidate;
          }
          curr = matched.add({ minutes: 1, seconds: 0 });
        } else {
          yield matched;
          curr = matched.add({ minutes: 1, seconds: 0 });
        }
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
     * @returns {number} Numeric representation of nearest weekday
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
     * Works in *named fields* (minute, hour, month), not positions.
     *
     * @param {Temporal.PlainDateTime} curr Current date time
     * @param {Partial<Record<FieldName, number[]>>} ranges Valid time range per field
     * @param {CompiledDayField} dom Date of month matcher
     * @param {CompiledDayField} dow Weekday matcher
     * @param {boolean} isDomWild Whether or not the date of month is a wildcard
     * @param {boolean} isDowWild Whether or not the weekday is a wildcard
     * @returns {Temporal.PlainDateTime} Next matched date time.
     */
    nextMatch(
      curr: Temporal.PlainDateTime,
      ranges: Partial<Record<FieldName, number[]>>,
      dom: CompiledDayField,
      dow: CompiledDayField,
      isDomWild: boolean,
      isDowWild: boolean,
    ): Temporal.PlainDateTime | null {
      const monthRange = ranges.month;
      const hourRange = ranges.hour;
      const minuteRange = ranges.minute;
      if (!monthRange || !hourRange || !minuteRange) {
        return null;
      }

      while (true) {
        if (!monthRange.includes(curr.month)) {
          const nextMonth = monthRange.find(m => m > curr.month) ?? monthRange[0];
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

        if (!hourRange.includes(curr.hour)) {
          const nextHour = hourRange.find(h => h > curr.hour) ?? hourRange[0];
          curr = (nextHour <= curr.hour ? curr.add({ days: 1 }) : curr).with({
            hour: nextHour,
            minute: 0,
            second: 0,
          });

          continue;
        }

        if (!minuteRange.includes(curr.minute)) {
          const nextMin = minuteRange.find(m => m > curr.minute) ?? minuteRange[0];
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
      const { raw, tokens } = this.tokenize(expr);

      const collapsed: string[] = [];
      for (const name of fieldOrder) {
        const value = tokens[name];
        if (value === undefined) continue;
        const def = fields[name];
        if (!def) {
          collapsed.push(value);
        } else {
          collapsed.push(this.collapseExpressions(value, def));
        }
      }

      let idx = 0;
      const out: (string | null)[] = raw.map(r => {
        if (r === null) {
          return null;
        }

        const c = collapsed[idx++];
        return c ?? r;
      });

      while (idx < collapsed.length) {
        out.push(collapsed[idx++]);
      }

      return out
        .filter(t => t !== null)
        .join(' ')
        .trim();
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

      // handle macro validation
      if (trimmedExpr.startsWith('@') && macros) {
        // it's complete
        if (trimmedExpr in macros) {
          return {
            descriptor: describeSchedule(this.normalize(expr)),
            generator: this.iterate(macros[trimmedExpr], Temporal.Now.plainDateTimeISO()),
            normal: false,
            status: 'valid',
            tokens: tokenizer(macros[trimmedExpr]),
          };
        }

        let mightBeValid = false;
        for (const macro of Object.keys(macros)) {
          if (macro.startsWith(expr)) {
            mightBeValid = true;
            break;
          }
        }

        if (!mightBeValid) {
          return {
            error: [],
            normal: true, // do not attempt to normalize
            status: 'invalid',
            tokens: {},
          };
        }

        return {
          error: [],
          normal: true, // do not attempt to normalize
          status: 'incomplete',
          tokens: {},
        };
      }

      const tokenized = this.tokenize(trimmedExpr);
      const { raw: rawTokens, tokens } = tokenized;
      const presentCount = Object.keys(tokens).length;

      // Defaults to [fieldOrder.length, fieldOrder.length] when not configured.
      const range = tokenRange ?? [fieldOrder.length, fieldOrder.length];

      const error: FieldName[] = [];

      // Validate each *present* field by name. If a validator isn't configured
      // for a name, skip it (the parser didn't define validation for that field).
      for (const name of fieldOrder) {
        const value = tokens[name];
        if (value === undefined) continue;
        const validator = validators[name];
        if (validator && !validator(value)) {
          error.push(name);
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

      if (presentCount < range[0]) {
        return {
          error: [],
          normal: this.isNormal(trimmedExpr),
          status: 'incomplete',
          tokens: rawTokens.filter(Boolean),
        };
      }

      if (presentCount > range[1]) {
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
