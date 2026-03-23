export type ScheduleFormat = 'unix' | 'quartz' | 'systemd';

export type ScheduleGenerator = Generator<Date, void, void> | undefined;
