import { createEffect, createSignal, For, Show } from 'solid-js';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip';
import type { ScheduleFormat } from '@/types';
import { useEditorContext } from './context';

interface Macro {
  label: string;
  alias: string;
}

const Macros: Record<ScheduleFormat, Record<string, Macro>> = {
  amazon: {},
  'cf-workers': {},
  node: {},
  posix: {
    '@annually': { alias: '0 0 1 1 *', label: 'Every year' },
    '@daily': { alias: '0 0 * * *', label: 'Every day' },
    '@hourly': { alias: '0 * * * *', label: 'Every hour' },
    '@midnight': { alias: '0 0 * * *', label: 'Every day on midnight' },
    '@monthly': { alias: '0 0 1 * *', label: 'Every month' },
    '@reboot': { alias: '@reboot', label: 'After reboot' },
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
};

function EmptyMacro() {
  return (
    <div class="grid min-h-24 place-items-center p-4 text-content-tertiary text-sm">
      This format doesn't support macro syntax.
    </div>
  );
}

export function ScheduleMacro() {
  const { format } = useEditorContext();
  const [macro, setMacro] = createSignal<Record<string, Macro>>(Macros[format()]);

  createEffect(() => {
    setMacro(Macros[format()]);
  });

  return (
    <div class="rounded-lg border border-separator transition-colors">
      <div class="border-separator border-b p-4 transition-colors">
        <p class="font-medium text-content-secondary text-sm">Macros</p>
      </div>

      <div class="flex flex-col">
        <Show when={Object.keys(macro()).length > 0} fallback={<EmptyMacro />}>
          <For each={Object.entries(macro())}>
            {([key, macro]) => (
              <div class="flex flex-col gap-1 px-4 py-3">
                <div class="flex items-center gap-4">
                  <p class="min-w-24 font-mono text-content-primary text-xs">{key}</p>

                  <div class="i-lucide-arrow-right size-3 text-content-tertiary"></div>

                  <p class='font-mono text-content-secondary text-xs'>{macro.alias}</p>
                </div>

                <p class="text-content-tertiary text-xs">{macro.label}</p>
              </div>
            )}
          </For>
        </Show>
      </div>
    </div>
  );
}
