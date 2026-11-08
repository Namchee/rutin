import { createEffect, createSignal, For, Show } from 'solid-js';
import { Temporal } from 'temporal-polyfill/full';

import { take } from '@/lib/generator';
import { useIntersectionObserver } from '@/lib/hooks/use-intersection-observer';
import { formatDate, formatRelativeTime } from '@/lib/temporal';

import { useEditorContext } from './context';
import { TimezoneSelector } from './TimezoneSelector';

function ExecutionEmpty() {
  return (
    <div class="grid h-full w-full place-items-center p-4">
      <div class="grid place-items-center gap-4 text-center text-content-tertiary text-sm">
        <div class="i-lucide-clock-fading size-8" />

        <p class="max-w-md">Executions will appear here once the schedule syntax is valid.</p>
      </div>
    </div>
  );
}

function ExecutionExhausted() {
  return (
    <div class="grid h-full w-full place-items-center p-4">
      <div class="grid place-items-center gap-4 text-center text-content-tertiary text-sm">
        <div class="i-lucide-calendar-off size-8" />

        <p class="max-w-md">
          This schedule is valid but will never fire again. Its year range is entirely in the past.
        </p>
      </div>
    </div>
  );
}

export function ScheduleExecutions() {
  const { generator, state, value } = useEditorContext();

  const [executions, setExecutions] = createSignal<Temporal.PlainDateTime[]>([]);
  const [timezone, setTimezone] = createSignal<string>('utc');

  let scroller!: HTMLDivElement;

  const { ref } = useIntersectionObserver(
    () => {
      const gen = generator();
      if (gen && executions().length < 100) {
        setExecutions(prev => [...prev, ...take(gen, 10)]);
      }
    },
    { root: () => scroller },
  );

  createEffect(() => {
    const gen = generator();
    if (gen) {
      setExecutions(take(gen, 20));
    } else {
      setExecutions([]);
    }
  });

  createEffect(() => {
    if (value() && scroller && state() === 'valid') {
      scroller.scrollTo({ top: 0 });
    }
  });

  return (
    <div class="flex flex-col overflow-hidden rounded-lg border border-separator">
      <div class="flex h-fit items-center justify-between border-separator border-b px-4 py-2">
        <p class="font-medium text-content-secondary text-sm">Executions</p>

        <TimezoneSelector timezone={timezone} setTimezone={setTimezone} />
      </div>

      <div ref={scroller} class="h-64 max-h-64 min-h-64 flex-1 overflow-auto">
        <Show
          when={executions().length > 0}
          fallback={state() === 'valid' ? <ExecutionExhausted /> : ExecutionEmpty()}>
          <For each={executions()}>
            {e => (
              <div class="flex items-center justify-between p-4">
                <p class="font-mono text-content-secondary text-sm leading-none">
                  {formatDate(e, { timeZone: timezone() !== 'utc' ? timezone() : undefined })}
                </p>
                <p class="text-content-tertiary text-xs">
                  {formatRelativeTime(Temporal.Now.plainDateTimeISO(), e)}
                </p>
              </div>
            )}
          </For>

          <div ref={ref} />

          <div class="flex flex-col items-center justify-center pb-2 font-medium font-mono text-content-tertiary text-xs">
            <p>That&apos;s a wrap!</p>
          </div>
        </Show>
      </div>

      <div class="border-separator border-t bg-background p-2 dark:bg-surface">
        <p class="text-center text-content-tertiary text-xs">
          Showing {executions().length} executions out of 100. Scroll for more
        </p>
      </div>
    </div>
  );
}
