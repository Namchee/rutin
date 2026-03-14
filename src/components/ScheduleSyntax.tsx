import type { ScheduleFormat } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/Table';

const Syntaxes: Record<ScheduleFormat, Record<string, Record<string, string>>> = {
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
    '0': {
      '*': 'Every...',
      ',': 'Only on...',
      '-': 'From ... through ...',
      '/': 'In increments of...',
      '0 - 59': 'Minute value',
    },
    '1': {
      '*': 'Every...',
      ',': 'Only on...',
      '-': 'From ... through ...',
      '/': 'In increments of...',
      '0 - 23': 'Hour value',
    },
    '2': {
      '*': 'Every...',
      ',': 'Only on...',
      '-': 'From ... through ...',
      '/': 'In increments of...',
      '1 - 31': 'Date value',
    },
    '3': {
      '*': 'Every...',
      ',': 'Only on...',
      '-': 'From ... through ...',
      '/': 'In increments of...',
      '1 - 12': 'Month value',
      'JAN - DEC': 'Alternative month value',
    },
    '4': {
      '*': 'Every...',
      ',': 'Only on...',
      '-': 'From ... through ...',
      '/': 'In increments of...',
      '0 - 6': 'Weekday value',
      'SUN - SAT': 'Alternative weekday value',
    },
  },
  quartz: {
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
    '0': {
      '*': 'Every...',
      ',': 'Only on...',
      '-': 'From ... through ...',
      '/': 'In increments of...',
      '0 - 59': 'Minute value',
    },
    '1': {
      '*': 'Every...',
      ',': 'Only on...',
      '-': 'From ... through ...',
      '/': 'In increments of...',
      '0 - 23': 'Hour value',
    },
    '2': {
      '*': 'Every...',
      ',': 'Only on...',
      '-': 'From ... through ...',
      '/': 'In increments of...',
      '1 - 31': 'Date value',
    },
    '3': {
      '*': 'Every...',
      ',': 'Only on...',
      '-': 'From ... through ...',
      '/': 'In increments of...',
      '1 - 12': 'Month value',
      'JAN - DEC': 'Alternative month value',
    },
    '4': {
      '*': 'Every...',
      ',': 'Only on...',
      '-': 'From ... through ...',
      '/': 'In increments of...',
      '0 - 6': 'Weekday value',
      'SUN - SAT': 'Alternative weekday value',
    },
  },
  systemd: {
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
    '0': {
      '*': 'Every...',
      ',': 'Only on...',
      '-': 'From ... through ...',
      '/': 'In increments of...',
      '0 - 59': 'Minute value',
    },
    '1': {
      '*': 'Every...',
      ',': 'Only on...',
      '-': 'From ... through ...',
      '/': 'In increments of...',
      '0 - 23': 'Hour value',
    },
    '2': {
      '*': 'Every...',
      ',': 'Only on...',
      '-': 'From ... through ...',
      '/': 'In increments of...',
      '1 - 31': 'Date value',
    },
    '3': {
      '*': 'Every...',
      ',': 'Only on...',
      '-': 'From ... through ...',
      '/': 'In increments of...',
      '1 - 12': 'Month value',
      'JAN - DEC': 'Alternative month value',
    },
    '4': {
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
  const dict = Syntaxes[props.format][props.index.toString()];

  return (
    <Table class="max-w-content w-full mx-auto text-foreground/75 mt-8">
      <TableHeader>
        <TableHead class="text-right">Syntax</TableHead>
        <TableHead>Description</TableHead>
      </TableHeader>

      <TableBody>
        {Object.entries(dict).map(([key, value]) => (
          <TableRow>
            <TableCell class="font-mono text-right">{key}</TableCell>
            <TableCell>{value}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
