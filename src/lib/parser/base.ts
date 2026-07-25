import type { Temporal } from '@js-temporal/polyfill';

import type { ScheduleFormat } from '@/types';
import { POSIXParser } from './posix';

interface BaseValidationResult {
  normal: boolean;
}

interface ValidSchedule extends BaseValidationResult {
  status: 'valid';
  tokens: string[];
  generator: Generator<Temporal.PlainDateTime, unknown, unknown>;
  descriptor: string;
}

interface IncompleteSchedule extends BaseValidationResult {
  status: 'incomplete';
}

interface InvalidSchedule extends BaseValidationResult {
  status: 'invalid';
  error: number[];
}

export type ValidationResult = ValidSchedule | IncompleteSchedule | InvalidSchedule;

export interface ScheduleParser {
  hasMacro: boolean;
  convert: (expr: string, from: ScheduleFormat) => string;
  validate: (expr: string) => ValidationResult;
  normalize: (expr: string) => string;
}

export const Parsers: Record<ScheduleFormat, ScheduleParser> = {
  posix: POSIXParser,
};
