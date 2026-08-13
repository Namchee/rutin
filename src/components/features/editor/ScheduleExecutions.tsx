import { createListCollection } from '@ark-ui/solid';
import { Temporal } from '@js-temporal/polyfill';
import { type Accessor, createEffect, createSignal, For, type Setter, Show } from 'solid-js';

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/Drawer';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';

import { cn } from '@/lib/css';
import { take } from '@/lib/generator';
import { useIntersectionObserver } from '@/lib/hooks/use-intersection-observer';
import { useMediaQuery } from '@/lib/hooks/use-media-query';
import { formatDate, formatRelativeTime } from '@/lib/temporal';

import { useEditorContext } from './context';

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

const Timezones: Record<string, { label: string; description: string }> = {
  [Temporal.Now.timeZoneId()]: {
    description: `GMT ${Temporal.Now.zonedDateTimeISO().offset}`,
    label: Temporal.Now.timeZoneId(),
  },
  utc: {
    description: 'GMT +00:00',
    label: 'UTC',
  },
};

interface TimezoneSelectorProps {
  timezone: Accessor<string>;

  setTimezone: Setter<string>;
}

function TimezoneDrawer({ timezone, setTimezone }: Readonly<TimezoneSelectorProps>) {
  const [open, setOpen] = createSignal(false);

  function onSelect(tz: string) {
    setTimezone(tz);

    setOpen(false);
  }

  return (
    <div class="flex items-center gap-2">
      <Drawer open={open()} onOpenChange={d => setOpen(d.open)}>
        <DrawerTrigger class="flex h-8 w-32 items-center justify-between gap-1.5 rounded-md border border-separator p-2 font-normal transition-shadow focus:ring-accent focus:ring-offset-0">
          <div class="i-lucide-globe size-4 shrink-0" />

          <p class="truncate font-medium text-sm">{Timezones[timezone()].label}</p>

          <div class="i-lucide-chevron-down ml-auto size-3 shrink-0 text-accent-foreground/50" />
        </DrawerTrigger>

        <DrawerContent>
          <div class="px-2 py-4">
            <DrawerHeader class="px-2 pt-0 pb-2 text-left">
              <DrawerTitle class="font-mono text-content-secondary text-xs uppercase">
                Timezone
              </DrawerTitle>
            </DrawerHeader>

            <div class="flex flex-col gap-1">
              <For each={Object.entries(Timezones)}>
                {([key, value]) => (
                  <div
                    onPointerDown={() => onSelect(key)}
                    class={cn('flex items-center gap-3 rounded-md p-2 hover:bg-background-hover', {
                      'bg-background-hover': timezone() === key,
                    })}>
                    <div class="flex-1">
                      <p class="font-medium text-content-primary text-sm">{value.label}</p>

                      <p class="text-content-tertiary text-xs">{value.description}</p>
                    </div>

                    <div
                      class={cn('i-lucide-check size-4 text-content-primary', {
                        invisible: timezone() !== key,
                      })}
                    />
                  </div>
                )}
              </For>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

export function TimezoneSelector({ timezone, setTimezone }: Readonly<TimezoneSelectorProps>) {
  const isNonMobile = useMediaQuery('(min-width: 768px)');

  const collection = createListCollection({
    items: Object.entries(Timezones).map(([k, v]) => ({
      label: v.label,
      value: k,
    })),
  });

  return (
    <Show
      when={isNonMobile()}
      fallback={<TimezoneDrawer timezone={timezone} setTimezone={setTimezone} />}>
      <Select
        collection={collection}
        value={[timezone()]}
        onValueChange={v => setTimezone(v.value[0])}
        class="flex items-center gap-2">
        <SelectTrigger class="w-32">
          <div class="flex max-w-full items-center gap-1.5 overflow-hidden">
            <div class="i-lucide-globe size-4" />

            <SelectValue
              class="h-fit truncate font-medium leading-none"
              placeholder="Select dialect..."
            />
          </div>
        </SelectTrigger>

        <SelectContent class="max-w-md">
          <For each={collection.items}>
            {item => (
              <SelectItem item={item.value}>
                <p class="font-medium text-sm leading-normal">{item.label}</p>

                <p class="text-content-tertiary text-xs">{Timezones[item.value].description}</p>
              </SelectItem>
            )}
          </For>
        </SelectContent>
      </Select>
    </Show>
  );
}

export function ScheduleExecutions() {
  const { generator, state } = useEditorContext();

  const [executions, setExecutions] = createSignal<Temporal.PlainDateTime[]>([]);
  const [timezone, setTimezone] = createSignal<string>('utc');

  let scroller!: HTMLDivElement;

  const { ref } = useIntersectionObserver(
    () => {
      const gen = generator();
      if (gen) {
        setExecutions(prev => [...prev, ...take(gen, 10)]);
      }
    },
    { root: () => scroller },
  );

  createEffect(() => {
    const gen = generator();
    if (gen) {
      // seed the executions
      setExecutions(take(gen, 20));
    } else {
      // reset if not valid
      setExecutions([]);
    }
  });

  return (
    <div class="flex flex-col overflow-hidden rounded-lg border border-separator">
      <div class="flex h-16 items-center justify-between border-separator border-b p-4">
        <p class="font-medium text-content-secondary text-sm">Next executions</p>

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
