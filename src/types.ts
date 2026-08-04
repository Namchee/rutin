export type ScheduleFormat = 'unix' | 'quartz' | 'systemd' | 'node' | 'cf-workers' | 'amazon';
export interface Format {
  label: string;
  description: string;
}

export type ScheduleGenerator = Generator<Date, void, void> | undefined;
interface Token {
  value: string;
  position: [number, number];
}

export type TokenMap = Partial<Record<FieldName, Token>>;
export type FieldName =
  | 'second'
  | 'minute'
  | 'hour'
  | 'dayOfMonth'
  | 'month'
  | 'dayOfWeek'
  | 'year';
export interface NormalizedSchedule {
  value: string;
  tokens: TokenMap;
}
