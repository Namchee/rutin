import type { Temporal } from '@js-temporal/polyfill';
import type { FieldName, NormalizedSchedule, ScheduleFormat, TokenMap } from '@/types/schedule';

interface BaseValidationResult {
  normal: boolean;
  tokens: TokenMap;
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
  convert: (tokens: TokenMap, raw: string, from: ScheduleFormat) => string;
  // getCurrentToken: (expr: string) => FieldName;
  process: (expr: string) => ValidationResult;
  normalize: (expr: string) => NormalizedSchedule;
}
