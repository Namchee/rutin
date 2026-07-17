import { Show } from 'solid-js';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip';
import type { ScheduleFormat } from '@/types';
import { useEditorContext } from './context';

const Operators = {
  amazon: ['-', ',', '*', '/', '?', 'L', 'W', '#'],
  'cf-workers': ['-', ',', '*', '/', 'L', 'W', '#'],
  node: ['-', ',', '*', '/', '?', 'L', 'W', '#'],
  posix: ['-', ',', '*', '/'],
  quartz: ['-', ',', '*', '/', '?', 'L', 'W', '#'],
  systemd: [',', '..', '*'],
} as const;

const Range: Record<ScheduleFormat, Record<string, { optional: boolean; range: string[] }>> = {
  amazon: {
    date: { optional: false, range: ['1-31'] },
    day: { optional: false, range: ['1-7', 'SUN-SAT'] },
    hours: { optional: false, range: ['0-23'] },
    minutes: { optional: false, range: ['0-59'] },
    month: { optional: false, range: ['1-12'] },
  },
  'cf-workers': {
    date: { optional: false, range: ['1-31'] },
    day: { optional: false, range: ['1-7', 'SUN-SAT'] },
    hours: { optional: false, range: ['0-23'] },
    minutes: { optional: false, range: ['0-59'] },
    month: { optional: false, range: ['1-12'] },
  },
  node: {
    date: { optional: false, range: ['1-31'] },
    day: { optional: false, range: ['0-6', 'SUN-SAT'] },
    hours: { optional: false, range: ['0-23'] },
    minutes: { optional: false, range: ['0-59'] },
    month: { optional: false, range: ['1-12'] },
    seconds: { optional: true, range: ['0-59'] },
    year: { optional: true, range: ['1970-2099'] },
  },
  posix: {
    date: { optional: false, range: ['1-31'] },
    day: { optional: false, range: ['0-6', 'SUN-SAT'] },
    hours: { optional: false, range: ['0-23'] },
    minutes: { optional: false, range: ['0-59'] },
    month: { optional: false, range: ['1-12'] },
  },
  quartz: {
    date: { optional: false, range: ['1-31'] },
    day: { optional: false, range: ['0-6', 'SUN-SAT'] },
    hours: { optional: false, range: ['0-23'] },
    minutes: { optional: false, range: ['0-59'] },
    month: { optional: false, range: ['1-12'] },
    seconds: { optional: true, range: ['0-59'] },
    year: { optional: true, range: ['1970-2099'] },
  },
  systemd: {
    date: { optional: false, range: ['1970-01-01 - 2099-12-31'] },
    day: { optional: false, range: ['Mon-Sun'] },
    time: { optional: false, range: ['00:00-23:59'] },
  },
};

const Labels = {
  '-': 'From ... through ...',
  ',': 'Only on...',
  '?': 'Every... (alias of *)',
  '..': 'From ... through ...',
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
        <p class="font-medium text-content-secondary text-sm">Field References</p>

        <p class="text-content-tertiary text-xs">Hover for more details</p>
      </div>

      <div class="flex flex-col gap-2 border-separator border-b p-4">
        <p class="text-content-secondary text-sm">Operators</p>

        <div class="flex flex-wrap items-center gap-2">
          {Operators[format()].map(op => (
            <Tooltip>
              <TooltipTrigger>
                <code class="rounded-md border border-separator bg-background px-2 py-1 font-mono text-sm">
                  {op}
                </code>
              </TooltipTrigger>

              <TooltipContent>{Labels[op]}</TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>

      <div>
        {Object.entries(Range[format()]).map(([key, value]) => (
          <div class="flex items-center justify-between px-4 py-3 text-sm transition-colors hover:bg-background">
            <div class='flex items-center gap-1 font-medium text-content-secondary'>
              {key.charAt(0).toUpperCase() + key.slice(1)}

              <Show when={value.optional}>
                <Tooltip>
                  <TooltipTrigger>
                    <div class="i-lucide-circle-question-mark size-[14px] text-content-tertiary" />
                  </TooltipTrigger>

                  <TooltipContent>
                    This field is optional
                  </TooltipContent>
                </Tooltip>
              </Show>
            </div>

            <p class="font-mono text-content-tertiary">{value.range.join(', ')}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
