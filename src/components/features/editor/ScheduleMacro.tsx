import { For, Show } from 'solid-js';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip';
import { cn } from '@/lib/css';

import { Macros, useEditorContext } from './context';

function EmptyMacro() {
  return (
    <div class="grid min-h-24 place-items-center p-4 text-content-tertiary text-xs">
      This dialect doesn't support macro syntax
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
