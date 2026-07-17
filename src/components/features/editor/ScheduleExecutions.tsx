import { Show } from 'solid-js';

import { useEditorContext } from './context';

function ExecutionsEmpty() {
  return (
    <div class="grid h-full w-full place-items-center">
      <div class='grid place-items-center gap-4 text-content-tertiary text-sm'>
        <div class="i-lucide-clock-fading size-8" />

        <p class="max-w-md">
          Executions will appear here once the schedule syntax is valid.
        </p>
      </div>
    </div>
  );
}

export function ScheduleExecutions() {
  const { state } = useEditorContext();

  return (
    <div class="flex flex-col overflow-hidden rounded-lg border border-separator">
      <div class="border-separator border-b p-4">
        <p class="font-medium text-content-secondary text-sm">Next executions</p>
      </div>

      <div class="min-h-48 flex-1">
        <Show when={state() === 'valid'} fallback={ExecutionsEmpty()}>
          <p>Hello World!</p>
        </Show>
      </div>

      <div class="border-separator border-t bg-background p-2 dark:bg-surface">
        <p class="text-center text-content-tertiary text-xs">Scroll for more executions</p>
      </div>
    </div>
  );
}
