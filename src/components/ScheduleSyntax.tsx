import type { ScheduleFormat } from '@/types';
import { Table, TableBody, TableCell, TableRow } from './ui/Table';

const CommonOperators = {
  '-': 'From ... through ...',
  ',': 'Only on...',
  '*': 'Every...',
  '/': 'In increments of...',
};

const SystemdOperators = {
  ',': 'Only on...',
  '..': 'From ... through ...',
  '*': 'Every...',
};

const Macros = {
  '@annually': 'Every year (macro)',
  '@daily': 'Every day (macro)',
  '@hourly': 'Every hour (macro)',
  '@monthly': 'Every month (macro)',
  '@reboot': 'After reboot (macro)',
  '@weekly': 'Every week (macro)',
  '@yearly': 'Every year (macro)',
};

const SystemdMacros = {
  annually: 'Every year (macro)',
  daily: 'Every day (macro)',
  hourly: 'Every hour (macro)',
  midnight: 'Every day (macro)',
  minutely: 'Every minute (macro)',
  monthly: 'Every month (macro)',
  quarterly: 'Every 3 month (macro)',
  weekly: 'Every week (macro)',
  yearly: 'Every year (macro)',
};

const MinuteField = { ...CommonOperators, '0 - 59': 'Minute value' };
const HourField = { ...CommonOperators, '0 - 23': 'Hour value' };
const DateField = { ...CommonOperators, '1 - 31': 'Date value' };
const MonthField = {
  ...CommonOperators,
  '1 - 12': 'Month value',
  'JAN - DEC': 'Month value (alt.)',
};

const Syntaxes: Record<ScheduleFormat, Record<string, Record<string, string>>> = {
  'cf-workers': {
    '-1': { ...CommonOperators, ...Macros },
    '0': MinuteField,
    '1': HourField,
    '2': DateField,
    '3': MonthField,
    '4': {
      ...CommonOperators,
      '0 - 7': 'Weekday value',
      '7': 'Sunday',
      'SUN - SAT': 'Weekday value (alt.)',
    },
  },
  cloudwatch: {
    '-1': { ...CommonOperators, ...Macros },
    '0': MinuteField,
    '1': HourField,
    '2': DateField,
    '3': MonthField,
    '4': {
      ...CommonOperators,
      '0 - 7': 'Weekday value',
      '7': 'Sunday',
      'SUN - SAT': 'Weekday value (alt.)',
    },
  },
  node: {
    '-1': { ...CommonOperators, '@': 'Macro' },
    '-2': Object.fromEntries(
      Object.entries(Macros).map(([k, v]) => [k, v.replace(' (macro)', '')]),
    ),
    '0': MinuteField,
    '1': HourField,
    '2': DateField,
    '3': MonthField,
    '4': {
      ...CommonOperators,
      '0 - 7': 'Weekday value',
      '7': 'Sunday',
      'SUN - SAT': 'Weekday value (alt.)',
    },
  },
  posix: {
    '-1': { ...CommonOperators, '@': 'Macro' },
    '-2': Object.fromEntries(
      Object.entries(Macros).map(([k, v]) => [k, v.replace(' (macro)', '')]),
    ),
    '0': MinuteField,
    '1': HourField,
    '2': DateField,
    '3': MonthField,
    '4': {
      ...CommonOperators,
      '0 - 7': 'Weekday value',
      '7': 'Sunday',
      'SUN - SAT': 'Weekday value (alt.)',
    },
  },
  quartz: {
    '-1': { ...CommonOperators, '@': 'Macro' },
    '-2': Macros,
    '0': { ...CommonOperators, '0 - 59': 'Second value' },
    '1': MinuteField,
    '2': HourField,
    '3': { ...DateField, '?': 'Any value', L: 'Last ... (date)' },
    '4': MonthField,
    '5': {
      ...CommonOperators,
      '?': 'Any value',
      '#': 'N-th weekday',
      '1 - 7': 'Weekday value',
      L: 'Last ... (day)',
      'SUN - SAT': 'Weekday value (alt.)',
      W: 'Weekdays',
    },
    '6': { ...CommonOperators, '1970 - 2199': 'Year value' },
  },
  systemd: {
    '-1': { ...SystemdOperators, '..ly': 'Macro' },
    '-2': SystemdMacros,
    '0': { ...SystemdOperators, '0 - 6': 'Day value', 'Sun - Sat': 'Day value (alt.)' },
    '1': {
      ...SystemdOperators,
      '1 - 12': 'Month value',
      '1 - 31': 'Date value',
      '1970 - 9999': 'Year value',
      'JAN - DEC': 'Month value (alt.)',
    },
    '2': { ...SystemdOperators, '0 - 23': 'Hour value', '0 - 59': 'Second / Minute value' },
  },
};

interface ScheduleSyntaxProps {
  format: ScheduleFormat;
  index: number;
}

export function ScheduleSyntax(props: Readonly<ScheduleSyntaxProps>) {
  const dict = () => Syntaxes[props.format][props.index.toString()];

  return (
    <div class="flex basis-3/5 flex-col">
      <p class="grid h-10 place-items-center text-center font-medium text-muted-foreground text-sm">
        Syntaxes
      </p>

      <Table class="mt-2 text-muted-foreground">
        <TableBody>
          {Object.entries(dict()).map(([key, value]) => (
            <TableRow class="border-none">
              <TableCell class="w-1/2 text-right font-mono">{key}</TableCell>
              <TableCell class="w-1/2">{value}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
