import { Temporal } from '@js-temporal/polyfill';

import { toString as describeSchedule } from 'cronstrue';
import type { FieldName, NormalizedSchedule, ScheduleFormat, TokenMap } from '@/types/schedule';
import type { ScheduleParser } from './types';
import { isValidRange, isValidStep } from './validator';

interface Field {
  max: number;
  min: number;
  aliases?: Record<string, number>;
  optional?: boolean;
}

interface ConvertedExpression {
  value: string;
  tokens: TokenMap;
}

interface ScheduleParserOptions {
  fields: Partial<Record<FieldName, Field>>;
  fieldOrder: FieldName[];
  validators: Partial<Record<FieldName, (token: string) => boolean>>;
  tokenizer: (expr: string) => TokenMap;
  convert: (tokens: TokenMap, raw: string, from: ScheduleFormat) => ConvertedExpression;
  macros?: Record<string, string>;
}

type DayMatcher = (year: number, month: number, day: number) => boolean;

interface CompiledDayField {
  matchers: DayMatcher[];
  hasSpecial: boolean;
}

export const MonthToNumber = {
  apr: 4,
  aug: 8,
  dec: 12,
  feb: 2,
  jan: 1,
  jul: 7,
  jun: 6,
  mar: 3,
  may: 5,
  nov: 11,
  oct: 10,
  sep: 9,
};

export const ZeroBasedDayToNumber = {
  fri: 5,
  mon: 1,
  sat: 6,
  sun: 0,
  thu: 4,
  tue: 2,
  wed: 3,
};

export const OneBasedDayToNumber = {
  fri: 6,
  mon: 2,
  sat: 7,
  sun: 1,
  thu: 5,
  tue: 3,
  wed: 4,
};

export const UnixLikeMacros: Record<string, string> = {
  '@annually': '0 0 1 1 *',
  '@daily': '0 0 * * *',
  '@hourly': '0 * * * *',
  '@midnight': '0 0 * * *',
  '@monthly': '0 0 1 * *',
  '@weekly': '0 0 * * 0',
  '@yearly': '0 0 1 1 *',
};

/**
 * Get number of days in a certain month
 *
 * @param {number} year Current year
 * @param {number} month Current month
 * @returns {number} Number of day in that month
 */
export function daysInMonth(year: number, month: number): number {
  return new Temporal.PlainDate(year, month, 1).add({ months: 1 }).subtract({ days: 1 }).day;
}

export function createScheduleParser({
  fields,
  fieldOrder,
  validators,
  macros,
  tokenizer,
  convert,
}: ScheduleParserOptions) {
  return {
    applyAliases(tokens: TokenMap): TokenMap {
      const out: TokenMap = {};
      for (const [name, v] of Object.entries(tokens)) {
        if (!v || typeof v.value !== 'string') {
          continue;
        }

        const def = fields[name as keyof typeof fields];
        if (!def?.aliases) {
          out[name as FieldName] = v;
          continue;
        }

        const aliases = def.aliases;
        const regex = new RegExp(`(${Object.keys(aliases).join('|')})`, 'gi');
        const newValue = v.value.replace(regex, m =>
          String(aliases[m.toLowerCase() as keyof typeof aliases]),
        );
        out[name as FieldName] = {
          position: [v.position[0], v.position[0] + newValue.length],
          value: newValue,
        };
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
    convert,

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
        if (['*', '?'].includes(t)) {
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
      return this.normalize(expr).value === expr;
    },

    /**
     * Create a date time generator for the current expression.
     *
     * @param {string} expr Schedule expression
     * @param {Temporal.PlainDateTime} start Starting date time
     * @returns {Generator<Temporal.PlainDateTime, unknown, unknown>} Generator object that yields
     * `Temporal.PlainDateTime` object
     */
    *iterate(
      expr: string,
      start: Temporal.PlainDateTime,
    ): Generator<Temporal.PlainDateTime, unknown, unknown> {
      const tokens = this.applyAliases(tokenizer(expr));
      const present = (n: FieldName) => tokens[n] !== undefined;

      if (Object.keys(tokens).length === 0) {
        return undefined;
      }

      const ranges: Partial<Record<FieldName, number[]>> = {};
      for (const name of fieldOrder) {
        const value = tokens[name]?.value;
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

      const domCompiled = this.compileDayField(tokens.dayOfMonth?.value ?? '', 'dom');
      const dowCompiled = this.compileDayField(tokens.dayOfWeek?.value ?? '', 'dow');

      const isDomWild = ['*', '?'].includes(tokens.dayOfMonth?.value ?? '');
      const isDowWild = ['*', '?'].includes(tokens.dayOfWeek?.value ?? '');

      const hasSeconds = present('second');

      const base = start.with({
        microsecond: 0,
        millisecond: 0,
        nanosecond: 0,
        second: 0,
      });

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

        if (matched === null) {
          return;
        }

        if (hasSeconds && ranges.second) {
          const seconds = [...ranges.second].sort((a, b) => a - b);
          for (const sec of seconds) {
            const candidate = matched.with({ second: sec });
            if (Temporal.PlainDateTime.compare(candidate, base) <= 0) {
              continue;
            }

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
      const last = daysInMonth(year, month);
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
      const last = daysInMonth(year, month);
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
      const day = Math.min(target, daysInMonth(year, month));
      const dow = this.dayOfWeek(year, month, day);
      if (dow === 6) {
        // Saturday -> Friday
        return day === 1 ? 3 : day - 1;
      }
      if (dow === 7) {
        // Sunday -> Monday
        const last = daysInMonth(year, month);
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
    normalize(expr: string): NormalizedSchedule {
      const tokens = tokenizer(expr.trim());
      const normalizedTokens: TokenMap = {};

      const collapsed: string[] = [];
      for (const name of fieldOrder) {
        const fieldName = name as FieldName;

        if (tokens[fieldName] && fields[fieldName]) {
          const endResult = this.collapseExpressions(tokens[fieldName].value, fields[fieldName]);
          const startPos = tokens[fieldName].position[0];

          collapsed.push(endResult);
          normalizedTokens[fieldName] = {
            position: [startPos, startPos + endResult.length],
            value: endResult,
          };
        }
      }

      return {
        tokens: normalizedTokens,
        value: collapsed.filter(Boolean).join(' '),
      };
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
      const last = daysInMonth(year, month);
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

    process(expr: string): ReturnType<ScheduleParser['process']> {
      const trimmedExpr = expr.trim();

      // handle macro validation
      if (trimmedExpr.startsWith('@') && macros) {
        // it's complete
        if (trimmedExpr in macros) {
          return {
            descriptor: describeSchedule(this.normalize(expr).value),
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

      // use non-trimmed version when tokenizing for UI!
      const tokens = tokenizer(expr);
      const normalizedTokens = this.applyAliases(tokenizer(trimmedExpr));
      const error: FieldName[] = [];

      for (const [token, v] of Object.entries(normalizedTokens)) {
        const fn = validators[token as FieldName];

        if (fn && !fn(v.value)) {
          error.push(token as FieldName);
        }
      }

      if (error.length > 0) {
        return {
          error,
          normal: this.isNormal(trimmedExpr),
          status: 'invalid',
          tokens,
        };
      }

      const availableTokens = Object.keys(normalizedTokens).length;
      const requiredFields = Object.entries(fields).filter(f => !f[1].optional).length;

      if (availableTokens < requiredFields) {
        return {
          error: [],
          normal: this.isNormal(trimmedExpr),
          status: 'incomplete',
          tokens,
        };
      }

      const rawTokens = trimmedExpr.split(/\s+/).filter(Boolean).length;

      if (rawTokens > requiredFields) {
        return {
          error: [],
          normal: this.isNormal(trimmedExpr),
          status: 'invalid',
          tokens,
        };
      }

      try {
        return {
          descriptor: describeSchedule(this.normalize(expr).value),
          generator: this.iterate(trimmedExpr, Temporal.Now.plainDateTimeISO()),
          normal: this.isNormal(trimmedExpr),
          status: 'valid',
          tokens,
        };
        // handle cronstrue error
      } catch {
        return {
          error: [],
          normal: this.isNormal(trimmedExpr),
          status: 'invalid',
          tokens,
        };
      }
    },
  };
}
