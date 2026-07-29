export type ScheduleFormat = 'unix' | 'quartz' | 'systemd' | 'node' | 'cf-workers' | 'amazon';
export interface Format {
  label: string;
  description: string;
}

export type ScheduleGenerator = Generator<Date, void, void> | undefined;
