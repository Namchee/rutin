import type { Format, ScheduleFormat } from '@/types/schedule';

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
