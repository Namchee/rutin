import type { Temporal } from '@js-temporal/polyfill';
import type { FieldName, NormalizedSchedule, TokenMap } from '@/types';

interface BaseValidationResult {
  normal: boolean;
  tokens: TokenMap;
  positions?: Record<FieldName, number>;
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
  process: (expr: string) => ValidationResult;
  normalize: (expr: string) => NormalizedSchedule;
}
