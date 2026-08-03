export type ScheduleFormat = 'unix' | 'quartz' | 'systemd' | 'node' | 'cf-workers' | 'amazon';
export interface Format {
  label: string;
  description: string;
}

export type ScheduleGenerator = Generator<Date, void, void> | undefined;

export type TokenMap = Partial<Record<FieldName, string>>;
export type FieldName =
  | 'second'
  | 'minute'
  | 'hour'
  | 'dayOfMonth'
  | 'month'
  | 'dayOfWeek'
  | 'year';
