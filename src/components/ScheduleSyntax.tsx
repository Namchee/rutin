import type { ScheduleFormat } from '@/types';

const Hints = {
  unix: {
    '-1': {
      '*': 'Every...',
      ',': 'Only on...',
      '-': 'From ... through ...',
      '/': 'In increments of...',
      '@yearly': 'Every year (macro)',
      '@annually': 'Every year (macro)',
      '@monthly': 'Every month (macro)',
      '@weekly': 'Every week (macro)',
      '@daily': 'Every day (macro)',
      '@hourly': 'Every hour (macro)',
      '@reboot': 'After reboot (macro)',
    },
    0: {
      '*': 'Every...',
      ',': 'Only on...',
      '-': 'From ... through ...',
      '/': 'In increments of...',
      '0 - 59': 'Minute value',
    },
    1: {
      '*': 'Every...',
      ',': 'Only on...',
      '-': 'From ... through ...',
      '/': 'In increments of...',
      '0 - 23': 'Hour value',
    },
    2: {
      '*': 'Every...',
      ',': 'Only on...',
      '-': 'From ... through ...',
      '/': 'In increments of...',
      '1 - 31': 'Date value',
    },
    3: {
      '*': 'Every...',
      ',': 'Only on...',
      '-': 'From ... through ...',
      '/': 'In increments of...',
      '1 - 12': 'Month value',
      'JAN - DEC': 'Alternative month value',
    },
    4: {
      '*': 'Every...',
      ',': 'Only on...',
      '-': 'From ... through ...',
      '/': 'In increments of...',
      '0 - 6': 'Weekday value',
      'SUN - SAT': 'Alternative weekday value',
    },
  },
};

interface ScheduleSyntaxProps {
  format: ScheduleFormat;
  index: number;
}

export function ScheduleSyntax(props: Readonly<ScheduleSyntaxProps>) {
  return <SecondsHint />;
}

function UnixCronGeneralHint() {}

function SecondsHint() {
  return (
    <div class="mt-8 max-w-sm mx-auto w-full">
      <div class="grid grid-cols-2">
        <p class="text-right">*</p>
        <p>Every</p>
      </div>
    </div>
  );
}
