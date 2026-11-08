import type { Format, ScheduleFormat, ScheduleHint } from '@/types/schedule';

// biome-ignore assist/source/useSortedKeys: Need to preserve order
export const FormatLabel: Record<ScheduleFormat, Format> = {
  unix: {
    description: '5 fields ⋅ Classic CRON',
    label: 'UNIX',
  },
  quartz: {
    description: '6 - 7 fields ⋅ Java-based',
    label: 'Quartz',
  },
  node: {
    description: '5 - 6 fields ⋅ Optional seconds field',
    label: 'Node.js',
  },
  amazon: {
    description: '5 - 6 fields ⋅ Optional year field',
    label: 'Amazon',
  },
  'cf-workers': {
    description: '5 fields ⋅ Day start with 1 to 7',
    label: 'Cloudflare Workers',
  },
  systemd: {
    description: '3 fields ⋅ OnCalendar ⋅ Linux',
    label: 'Systemd',
  },
};

export const Hints: Record<ScheduleFormat, ScheduleHint[]> = {
  amazon: [
    { field: 'minute', label: 'Minute' },
    { field: 'hour', label: 'Hour' },
    { field: 'dayOfMonth', label: 'Date' },
    { field: 'month', label: 'Month' },
    { field: 'dayOfWeek', label: 'Day' },
    { field: 'year', label: 'Year' },
  ],
  'cf-workers': [
    { field: 'minute', label: 'Minute' },
    { field: 'hour', label: 'Hour' },
    { field: 'dayOfMonth', label: 'Date' },
    { field: 'month', label: 'Month' },
    { field: 'dayOfWeek', label: 'Day' },
  ],
  node: [
    { field: 'second', label: 'Second', optional: true },
    { field: 'minute', label: 'Minute' },
    { field: 'hour', label: 'Hour' },
    { field: 'dayOfMonth', label: 'Date' },
    { field: 'month', label: 'Month' },
    { field: 'dayOfWeek', label: 'Day' },
  ],
  quartz: [
    { field: 'second', label: 'Second' },
    { field: 'minute', label: 'Minute' },
    { field: 'hour', label: 'Hour' },
    { field: 'dayOfMonth', label: 'Date' },
    { field: 'month', label: 'Month' },
    { field: 'dayOfWeek', label: 'Day' },
    { field: 'year', label: 'Year', optional: true },
  ],
  systemd: [
    { field: 'dayOfWeek', label: 'Day' },
    { field: 'date', label: 'Year-Month-Day' },
    { field: 'time', label: 'Hour:Minute:Second' },
  ],
  unix: [
    { field: 'minute', label: 'Minute' },
    { field: 'hour', label: 'Hour' },
    { field: 'dayOfMonth', label: 'Date' },
    { field: 'month', label: 'Month' },
    { field: 'dayOfWeek', label: 'Day' },
  ],
};
