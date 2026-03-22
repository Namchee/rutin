import type { ScheduleFormat } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/Table';

const CommonOperators = {
  '*': 'Every...',
  ',': 'Only on...',
  '-': 'From ... through ...',
  '/': 'In increments of...',
};

const Macros = {
  '@yearly': 'Every year (macro)',
  '@annually': 'Every year (macro)',
  '@monthly': 'Every month (macro)',
  '@weekly': 'Every week (macro)',
  '@daily': 'Every day (macro)',
  '@hourly': 'Every hour (macro)',
  '@reboot': 'After reboot (macro)',
};

const MinuteField = { ...CommonOperators, '0 - 59': 'Minute value' };
const HourField = { ...CommonOperators, '0 - 23': 'Hour value' };
const DateField = { ...CommonOperators, '1 - 31': 'Date value' };

const Syntaxes: Record<ScheduleFormat, Record<string, Record<string, string>>> = {
  unix: {
    '-2': {
      '@yearly': 'Every year',
      '@annually': 'Every year',
      '@monthly': 'Every month',
      '@weekly': 'Every week',
      '@daily': 'Every day',
      '@hourly': 'Every hour',
      '@reboot': 'After reboot',
    },
    '-1': { ...CommonOperators, ...Macros },
    '0': MinuteField,
    '1': HourField,
    '2': DateField,
    '3': { ...CommonOperators, '1 - 12': 'Month value', 'JAN - DEC': 'Month value (alt.)' },
    '4': {
      ...CommonOperators,
      '0 - 7': 'Weekday value',
      'SUN - SAT': 'Weekday value (alt.)',
      '7': 'Sunday',
    },
  },
  quartz: {
    '-2': Macros,
    '-1': { ...CommonOperators, ...Macros },
    '0': { ...CommonOperators, '0 - 59': 'Second value' },
    '1': MinuteField,
    '2': HourField,
    '3': { ...DateField, L: 'Last ... (date)', '?': 'Any value' },
    '4': { ...CommonOperators, '1 - 12': 'Month value', 'JAN - DEC': 'Month value (alt.)' },
    '5': {
      ...CommonOperators,
      '1 - 7': 'Weekday value',
      'SUN - SAT': 'Weekday value (alt.)',
      L: 'Last ... (day)',
      W: 'Weekdays',
      '#': 'N-th weekday',
      '?': 'Any value',
    },
    '6': { ...CommonOperators, '1970 - 2199': 'Year value' },
  },
  systemd: {
    '-2': {
      minutely: 'Every minute (macro)',
      hourly: 'Every hour (macro)',
      daily: 'Every day (macro)',
      midnight: 'Every day (macro)',
      weekly: 'Every week (macro)',
      monthly: 'Every month (macro)',
      quarterly: 'Every 3 month (macro)',
      yearly: 'Every year (macro)',
      annually: 'Every year (macro)',
    },
    '-1': {
      '*': 'Every...',
      ',': 'Only on...',
      '..': 'From ... through ...',
      minutely: 'Every minute (macro)',
      hourly: 'Every hour (macro)',
      daily: 'Every day (macro)',
      midnight: 'Every day (macro)',
      weekly: 'Every week (macro)',
      monthly: 'Every month (macro)',
      quarterly: 'Every 3 month (macro)',
      yearly: 'Every year (macro)',
      annually: 'Every year (macro)',
    },
    '0': {
      '*': 'Every...',
      ',': 'Only on...',
      '..': 'From ... through ...',
      '0 - 6': 'Day value',
      'Sun - Sat': 'Day value (alt.)',
    },
    '1': {
      '*': 'Every...',
      ',': 'Only on...',
      '..': 'From ... through ...',
      '1970 - 9999': 'Year value',
      '1 - 12': 'Month value',
      'JAN - DEC': 'Month value (alt.)',
      '1 - 31': 'Date value',
    },
    '2': {
      '*': 'Every...',
      ',': 'Only on...',
      '..': 'From ... through ...',
      '0 - 23': 'Hour value',
      '0 - 59': 'Second / Minute value',
    },
  },
};

interface ScheduleSyntaxProps {
  format: ScheduleFormat;
  index: number;
}

export function ScheduleSyntax(props: Readonly<ScheduleSyntaxProps>) {
  const dict = () => Syntaxes[props.format][props.index.toString()];

  return (
    <Table class="text-foreground/70">
      <TableHeader>
        <TableHead class="text-center font-medium" colSpan={2}>
          Syntaxes
        </TableHead>
      </TableHeader>

      <TableBody>
        {Object.entries(dict()).map(([key, value]) => (
          <TableRow>
            <TableCell class="font-mono text-right w-1/2">{key}</TableCell>
            <TableCell class="w-1/2">{value}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
