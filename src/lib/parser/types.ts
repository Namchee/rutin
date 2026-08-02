import type { Temporal } from '@js-temporal/polyfill';

interface BaseValidationResult {
  normal: boolean;
  tokens: (string
    | null)[];
}

interface ValidSchedule extends BaseValidationResult {
  status: 'valid';
  generator: Generator<Temporal.PlainDateTime, unknown, unknown>;
  descriptor: string;
}

interface IncompleteSchedule extends BaseValidationResult {
  status: 'incomplete';
  error: number[];
}

interface InvalidSchedule extends BaseValidationResult {
  status: 'invalid';
  error: number[];
}

export type ValidationResult = ValidSchedule | IncompleteSchedule | InvalidSchedule;

export interface ScheduleParser {
  // convert: (expr: string, from: ScheduleFormat) => string;
  validate: (expr: string) => ValidationResult;
  normalize: (expr: string) => string;
}
