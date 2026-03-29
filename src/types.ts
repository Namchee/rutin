export type ScheduleFormat = 'posix' | 'quartz' | 'systemd';
export type Dialect = 'posix' | 'quartz';

export type ScheduleGenerator = Generator<Date, void, void> | undefined;
