export type ScheduleFormat = 'unix' | 'quartz' | 'systemd' | 'node' | 'cf-workers' | 'amazon';
export interface Format {
  label: string;
  description: string;
}

// biome-ignore assist/source/useSortedKeys: Need to preserve order
const Formats: Record<ScheduleFormat, Format> = {
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

export type ScheduleGenerator = Generator<Date, void, void> | undefined;
interface Token {
  value: string;
  position: [number, number];
}

export type TokenMap = Partial<Record<FieldName, Token>>;
export type FieldName =
  | 'second'
  | 'minute'
  | 'hour'
  | 'dayOfMonth'
  | 'month'
  | 'dayOfWeek'
  | 'year'
  // special Systemd
  | 'time'
  | 'date';
export interface NormalizedSchedule {
  value: string;
  tokens: TokenMap;
}
