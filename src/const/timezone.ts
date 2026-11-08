import { Temporal } from 'temporal-polyfill';

export const Timezones: Record<string, { label: string; description: string }> = {
  [Temporal.Now.timeZoneId()]: {
    description: `GMT ${Temporal.Now.zonedDateTimeISO().offset}`,
    label: Temporal.Now.timeZoneId(),
  },
  utc: {
    description: 'GMT +00:00',
    label: 'UTC',
  },
};
