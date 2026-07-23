import type { ScheduleFormat } from '@/types';
import { POSIXParser } from './posix';

interface ValidationResult {
  normal: boolean;
}

interface ValidSchedule extends ValidationResult {
  status: 'valid';
  tokens: string[];
  iterator: Generator<Date, unknown, unknown>;
  descriptor: string;
}

interface IncompleteSchedule extends ValidationResult {
  status: 'incomplete';
}

interface InvalidSchedule extends ValidationResult {
  status: 'invalid';
  error: number[];
}

export interface ScheduleParser {
  convert: (expr: string, from: ScheduleFormat) => string;
  validate: (expr: string) => ValidSchedule | IncompleteSchedule | InvalidSchedule;
}

export const Parsers: Record<ScheduleFormat, ScheduleParser> = {
  posix: POSIXParser,
}
