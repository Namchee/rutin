export type ScheduleFormat = 'posix' | 'quartz' | 'systemd' | 'cf-workers' | 'cloudwatch' | 'human';
export type Dialect = 'posix' | 'quartz';

export type ScheduleGenerator = Generator<Date, void, void> | undefined;
