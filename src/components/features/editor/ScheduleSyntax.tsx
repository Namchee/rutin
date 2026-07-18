import { For, Show } from 'solid-js';
import { Code } from '@/components/ui/Code';
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
  // biome-ignore assist/source/useSortedKeys: Keep fields in logical cron order rather than alphabetical
  amazon: {
    minutes: { optional: false, range: ['0-59'] },
    hours: { optional: false, range: ['0-23'] },
    date: { optional: false, range: ['1-31'] },
    month: { optional: false, range: ['1-12'] },
    day: { optional: false, range: ['1-7', 'SUN-SAT'] },
  },
  // biome-ignore assist/source/useSortedKeys: Keep fields in logical cron order rather than alphabetical
  'cf-workers': {
    minutes: { optional: false, range: ['0-59'] },
    hours: { optional: false, range: ['0-23'] },
    date: { optional: false, range: ['1-31'] },
    month: { optional: false, range: ['1-12'] },
    day: { optional: false, range: ['1-7', 'SUN-SAT'] },
  },
  // biome-ignore assist/source/useSortedKeys: Keep fields in logical cron order rather than alphabetical
  node: {
    seconds: { optional: true, range: ['0-59'] },
    minutes: { optional: false, range: ['0-59'] },
    hours: { optional: false, range: ['0-23'] },
    date: { optional: false, range: ['1-31'] },
    month: { optional: false, range: ['1-12'] },
    day: { optional: false, range: ['0-6', 'SUN-SAT'] },
    year: { optional: true, range: ['1970-2099'] },
  },
  // biome-ignore assist/source/useSortedKeys: Keep fields in logical cron order rather than alphabetical
  posix: {
    minutes: { optional: false, range: ['0-59'] },
    hours: { optional: false, range: ['0-23'] },
    date: { optional: false, range: ['1-31'] },
    month: { optional: false, range: ['1-12'] },
    day: { optional: false, range: ['0-6', 'SUN-SAT'] },
  },
  // biome-ignore assist/source/useSortedKeys: Keep fields in logical cron order rather than alphabetical
  quartz: {
    seconds: { optional: true, range: ['0-59'] },
    minutes: { optional: false, range: ['0-59'] },
    hours: { optional: false, range: ['0-23'] },
    date: { optional: false, range: ['1-31'] },
    month: { optional: false, range: ['1-12'] },
    day: { optional: false, range: ['0-6', 'SUN-SAT'] },
    year: { optional: true, range: ['1970-2099'] },
  },
  // biome-ignore assist/source/useSortedKeys: Keep fields in logical cron order rather than alphabetical
  systemd: {
    day: { optional: false, range: ['Mon-Sun'] },
    date: { optional: false, range: ['1970-01-01 - 2099-12-31'] },
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

const Advanced = {
  'L-x': {
    label: 'x days before the last day',
    tooltip: 'L-3 = 3 days before month end',
  },
  LW: {
    label: 'Last weekdays of month',
    tooltip: '',
  },
  'x#y': {
    label: 'yth weekday x of the month',
    tooltip: '6#3 = 3rd Friday',
  },
  xL: {
    label: 'xth weekday of the month',
    tooltip: '6L = Last Friday',
  },
  xW: {
    label: 'Nearest weekday to xth',
    tooltip: '12W = Nearest weekday to 12th of the month',
  },
};

export function ScheduleSyntax() {
  const { format } = useEditorContext();

  const advancedFilters = Object.entries(Advanced).filter(syntax =>
    Operators[format()].some(f => syntax[0].includes(f)),
  );

  return (
    <div class="rounded-lg border border-separator transition-colors">
      <div class="flex items-center justify-between border-separator border-b p-4 transition-colors">
        <p class="font-medium text-content-secondary text-sm">Field References</p>

        <p class="text-content-tertiary text-xs">Hover for more details</p>
      </div>

      <div class="flex flex-col gap-2 border-separator border-b p-4 transition-colors">
        <p class="font-medium text-content-secondary text-xs uppercase">Operators</p>

        <div class="flex flex-wrap items-center gap-2">
          {Operators[format()].map(op => (
            <Tooltip>
              <TooltipTrigger>
                <Code>{op}</Code>
              </TooltipTrigger>

              <TooltipContent>{Labels[op]}</TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>

      <div>
        {Object.entries(Range[format()]).map(([key, value]) => (
          <div class="flex items-center justify-between px-4 py-3 text-sm transition-colors hover:bg-background">
            <div class="flex items-center gap-1 font-medium text-content-secondary">
              {key.charAt(0).toUpperCase() + key.slice(1)}

              <Show when={value.optional}>
                <Tooltip>
                  <TooltipTrigger>
                    <div class="i-lucide-circle-question-mark size-[14px] text-content-tertiary" />
                  </TooltipTrigger>

                  <TooltipContent>This field is optional</TooltipContent>
                </Tooltip>
              </Show>
            </div>

            <p class="font-mono text-content-tertiary">{value.range.join(', ')}</p>
          </div>
        ))}
      </div>

      <Show when={advancedFilters.length > 0}>
        <div class="flex flex-col gap-2 border-separator border-t p-4">
          <p class="font-medium text-content-secondary text-xs uppercase">Advanced Forms</p>

          <div class="flex flex-wrap items-center gap-2">
            <For each={advancedFilters}>
              {([k, v]) => {
                return (
                  <div class='flex w-full items-center justify-between gap-2 text-sm'>
                    <Tooltip>
                      <TooltipTrigger>
                        <Code class="block">{k}</Code>
                      </TooltipTrigger>

                      <Show when={v.tooltip.length > 0}>
                        <TooltipContent>{v.tooltip}</TooltipContent>
                      </Show>
                    </Tooltip>

                    <p class="font-mono text-content-tertiary text-sm">{v.label}</p>
                  </div>
                );
              }}
            </For>
          </div>
        </div>
      </Show>
    </div>
  );
}
