import { For, Show } from 'solid-js';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip';
import { cn } from '@/lib/css';

import type { ScheduleFormat } from '@/types';

import { useEditorContext } from './context';

interface Macro {
  label: string;
  alias: string;
}

const Macros: Record<ScheduleFormat, Record<string, Macro>> = {
  amazon: {},
  'cf-workers': {},
  node: {
    '@annually': { alias: '0 0 1 1 *', label: 'Every year' },
    '@daily': { alias: '0 0 * * *', label: 'Every day' },
    '@hourly': { alias: '0 * * * *', label: 'Every hour' },
    '@midnight': { alias: '0 0 * * *', label: 'Every day on midnight' },
    '@monthly': { alias: '0 0 1 * *', label: 'Every month' },
    '@weekly': { alias: '0 0 * * 0', label: 'Every week' },
    '@yearly': { alias: '0 0 1 1 *', label: 'Every year' },
  },
  quartz: {},
  // biome-ignore assist/source/useSortedKeys: Keep fields in logical cron order rather than alphabetical
  systemd: {
    minutely: { alias: '*-*-* *:*:00', label: 'Every minute' },
    hourly: { alias: '*-*-* *:00:00', label: 'Every hour' },
    daily: { alias: '*-*-* 00:00:00', label: 'Every day' },
    weekly: { alias: 'Mon *-*-* 00:00:00', label: 'Every week on Mondays' },
    monthly: { alias: '*-*-01 00:00:00', label: 'Every month on 1st day' },
    yearly: { alias: '*-01-01 00:00:00', label: 'Every year on 1st date' },
    quarterly: { alias: '*-01,04,07,10-01 00:00:00', label: 'Every quarter year' },
    semianually: { alias: '*-01,07-01 00:00:00', label: 'Twice per year' },
  },
  unix: {
    '@annually': { alias: '0 0 1 1 *', label: 'Every year' },
    '@daily': { alias: '0 0 * * *', label: 'Every day' },
    '@hourly': { alias: '0 * * * *', label: 'Every hour' },
    '@midnight': { alias: '0 0 * * *', label: 'Every day on midnight' },
    '@monthly': { alias: '0 0 1 * *', label: 'Every month' },
    '@weekly': { alias: '0 0 * * 0', label: 'Every week' },
    '@yearly': { alias: '0 0 1 1 *', label: 'Every year' },
  },
};

function EmptyMacro() {
  return (
    <div class="grid min-h-24 place-items-center p-4 text-content-tertiary text-xs">
      This format doesn't support macro syntax
    </div>
  );
}

export function ScheduleMacro() {
  const { format, value } = useEditorContext();
  const formatMacro = () => Macros[format()];

  return (
    <div class="rounded-lg border border-separator">
      <div class="flex items-center justify-between border-separator border-b p-4">
        <p class="font-medium text-content-secondary text-sm">Macros</p>

        <p class="text-content-tertiary text-xs">Normalize expands these</p>
      </div>

      <div class="flex flex-col">
        <Show when={Object.keys(formatMacro()).length > 0} fallback={<EmptyMacro />}>
          <For each={Object.entries(formatMacro())}>
            {([key, macro]) => (
              <div
                class={cn(
                  'flex items-center justify-between gap-1 px-4 py-3 text-xs leading-snug transition-colors',
                  {
                    'bg-surface-hover': value().trim() === key,
                  },
                )}>
                <Tooltip positioning={{ placement: 'left' }}>
                  <TooltipTrigger class="font-medium font-mono text-content-primary">
                    {key}
                  </TooltipTrigger>

                  <Show when={macro.alias.length > 0}>
                    <TooltipContent>
                      Equivalent to <span class="ml-1 font-mono">{macro.alias}</span>
                    </TooltipContent>
                  </Show>
                </Tooltip>

                <p class="text-content-tertiary">{macro.label}</p>
              </div>
            )}
          </For>
        </Show>
      </div>
    </div>
  );
}
