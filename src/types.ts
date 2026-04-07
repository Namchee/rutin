export type ScheduleFormat = 'posix' | 'quartz' | 'systemd' | 'cf-workers' | 'cloudwatch';

export type ScheduleGenerator = Generator<Date, void, void> | undefined;
