export type ScheduleFormat = 'posix' | 'quartz' | 'systemd' | 'cf-workers' | 'cloudwatch';
export interface Format {
  label: string;
  description: string;
}

export type ScheduleGenerator = Generator<Date, void, void> | undefined;
