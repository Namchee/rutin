import type { Temporal } from '@js-temporal/polyfill';

export type FieldName =
  | 'second'
  | 'minute'
  | 'hour'
  | 'dayOfMonth'
  | 'month'
  | 'dayOfWeek'
  | 'year';

interface BaseValidationResult {
  normal: boolean;
  tokens?: Partial<Record<FieldName, string>>;
}

interface ValidSchedule extends BaseValidationResult {
  status: 'valid';
  generator: Generator<Temporal.PlainDateTime, unknown, unknown>;
  descriptor: string;
}

interface IncompleteSchedule extends BaseValidationResult {
  status: 'incomplete';
  error: FieldName[];
}

interface InvalidSchedule extends BaseValidationResult {
  status: 'invalid';
  error: FieldName[];
}

export type ValidationResult = ValidSchedule | IncompleteSchedule | InvalidSchedule;

export interface ScheduleParser {
  // convert: (expr: string, from: ScheduleFormat) => string;
  validate: (expr: string) => ValidationResult;
  normalize: (expr: string) => string;
}
