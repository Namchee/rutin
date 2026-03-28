import type { ScheduleFormat } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/Select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/Table';

const CommonOperators = {
  '*': 'Every...',
  ',': 'Only on...',
  '-': 'From ... through ...',
  '/': 'In increments of...',
};

const SystemdOperators = {
  '*': 'Every...',
  ',': 'Only on...',
  '..': 'From ... through ...',
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

const SystemdMacros = {
  minutely: 'Every minute (macro)',
  hourly: 'Every hour (macro)',
  daily: 'Every day (macro)',
  midnight: 'Every day (macro)',
  weekly: 'Every week (macro)',
  monthly: 'Every month (macro)',
  quarterly: 'Every 3 month (macro)',
  yearly: 'Every year (macro)',
  annually: 'Every year (macro)',
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
  posix: {
    '-2': Object.fromEntries(
      Object.entries(Macros).map(([k, v]) => [k, v.replace(' (macro)', '')]),
    ),
    '-1': { ...CommonOperators, ...Macros },
    '0': MinuteField,
    '1': HourField,
    '2': DateField,
    '3': MonthField,
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
    '4': MonthField,
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
    '-2': SystemdMacros,
    '-1': { ...SystemdOperators, ...SystemdMacros },
    '0': { ...SystemdOperators, '0 - 6': 'Day value', 'Sun - Sat': 'Day value (alt.)' },
    '1': {
      ...SystemdOperators,
      '1970 - 9999': 'Year value',
      '1 - 12': 'Month value',
      'JAN - DEC': 'Month value (alt.)',
      '1 - 31': 'Date value',
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
    <Table class="text-foreground/70">
      <TableHeader>
        <TableHead class="text-center font-medium" colSpan={2}>
          Syntaxes
        </TableHead>
      </TableHeader>

      <Select
        value="posix"
        options={['posix', 'quartz', 'cf', 'google']}
        itemComponent={props => <SelectItem item={props.item}>{props.item.rawValue}</SelectItem>}>
        <SelectTrigger aria-label="Dialect" class="mx-auto h-10">
          <SelectValue<string>>{state => state.selectedOption()}</SelectValue>
        </SelectTrigger>

        <SelectContent />
      </Select>

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
