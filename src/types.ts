export type ScheduleFormat = 'posix' | 'quartz' | 'systemd';

export type ScheduleGenerator = Generator<Date, void, void> | undefined;
