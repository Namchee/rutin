import type { ScheduleFormat } from '@/types';

import { useEditorContext } from './context';

const Operators: Record<ScheduleFormat, string[]> = {
  amazon: ['-', ',', '*', '/', '?', 'L', 'W', '#'],
  'cf-workers': ['-', ',', '*', '/', 'L', 'W', '#'],
  node: ['-', ',', '*', '/', '?', 'L', 'W', '#'],
  posix: ['-', ',', '*', '/'],
  quartz: ['-', ',', '*', '/', '?', 'L', 'W', '#'],
  systemd: [',', '..', '*'],
};

const Range: Record<ScheduleFormat, any> = {
  node: {
    date: ['1-31'],
    day: ['0-6', 'SUN-SAT'],
    hours: ['0-23'],
    minutes: ['0-59'],
    month: ['1-12'],
    seconds: ['0-59'],
    year: ['1970-2099'],
  },
  posix: {
    date: ['1-31'],
    day: ['0-6', 'SUN-SAT'],
    hours: ['0-23'],
    minutes: ['0-59'],
    year: ['1970-2099'],
  },
  quartz: {
    date: ['1-31'],
    day: ['0-6', 'SUN-SAT'],
    hours: ['0-23'],
    minutes: ['0-59'],
    month: ['1-12'],
    seconds: ['0-59'],
    year: ['1970-2099'],
  },
};

const Labels = {
  '-': 'From ... through ...',
  ',': 'Only on...',
  '?': 'Every... (alias of *)',
  '*': 'Every...',
  '/': 'In increments of...',
  '#': 'nth weekday',
  L: 'Last day',
  W: 'Nearest weekday',
};

export function ScheduleSyntax() {
  const { format } = useEditorContext();

  return (
    <div class="rounded-lg border border-separator">
      <div class="flex items-center justify-between border-separator border-b p-4 transition-colors">
        <p class="font-medium text-content-tertiary text-sm">Field References</p>

        <p class="text-content-tertiary text-xs">Hover for more details</p>
      </div>
    </div>
  );
}
