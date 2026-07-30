import type { Temporal } from '@js-temporal/polyfill';

import type { ScheduleFormat } from '@/types';
import { CloudflareWorkersParser } from './cf-workers';
import { UNIXParser } from './unix';

interface BaseValidationResult {
  normal: boolean;
  tokens: string[];
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
  hasMacro: boolean;
  convert: (expr: string, from: ScheduleFormat) => string;
  validate: (expr: string) => ValidationResult;
  normalize: (expr: string) => string;
}

export const Parsers: Record<ScheduleFormat, ScheduleParser> = {
  'cf-workers': CloudflareWorkersParser,
  unix: UNIXParser,
};
