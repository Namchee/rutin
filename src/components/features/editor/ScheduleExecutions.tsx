import { Temporal } from '@js-temporal/polyfill';
import { createSignal, Show } from 'solid-js';
import { SelectLabel } from '@/components/ui/Select';
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

function FormatSelectorDrawer() {
  const { format, setFormat } = useEditorContext();

  const [open, setOpen] = createSignal(false);

  function onSelect(format: ScheduleFormat) {
    setFormat(format);

    setOpen(false);
  }

  return (
    <div class="flex items-center gap-2">
      <p class="font-medium text-content-tertiary text-sm">Dialect</p>

      <Drawer open={open()} onOpenChange={d => setOpen(d.open)}>
        <DrawerTrigger class="flex h-8 w-24 items-center justify-between rounded-md border border-separator p-2 font-normal transition-shadow focus:ring-accent focus:ring-offset-0">
          <p class="truncate font-medium text-sm">{Formats[format()].label}</p>

          <div class="i-lucide-chevron-down ml-auto size-3 shrink-0 text-accent-foreground/50" />
        </DrawerTrigger>

        <DrawerContent>
          <div class="px-2 py-4">
            <DrawerHeader class="px-2 pt-0 pb-2 text-left">
              <DrawerTitle class="font-mono text-content-secondary text-xs uppercase">
                Dialect
              </DrawerTitle>
            </DrawerHeader>

            <div class="flex flex-col gap-1">
              <For each={Object.entries(Formats)}>
                {([key, value]) => (
                  <div
                    onPointerDown={() => onSelect(key as ScheduleFormat)}
                    class={cn('flex items-center gap-3 rounded-md p-2 hover:bg-background-hover', {
                      'bg-background-hover': format() === key,
                    })}>
                    <div class="flex-1">
                      <p class="font-medium text-content-primary text-sm">{value.label}</p>

                      <p class="text-content-tertiary text-xs">{value.description}</p>
                    </div>

                    <div
                      class={cn('i-lucide-check size-4 text-content-primary', {
                        invisible: format() !== key,
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

export function FormatSelector() {
  const { format, setFormat } = useEditorContext();

  const isNonMobile = useMediaQuery('(min-width: 768px)');

  const collection = createListCollection({
    items: Object.entries(Formats).map(([k, v]) => ({ label: v.label, value: k })),
  });

  return (
    <Show when={isNonMobile()} fallback={<FormatSelectorDrawer />}>
      <Select
        collection={collection}
        value={[format()]}
        onValueChange={v => setFormat(v.value[0] as unknown as ScheduleFormat)}
        class="flex items-center gap-2">
        <SelectLabel class="text-content-secondary">Dialect</SelectLabel>

        <SelectTrigger>
          <SelectValue
            class="h-fit w-24 truncate font-medium leading-none"
            placeholder="Select dialect..."
          />
        </SelectTrigger>

        <SelectContent class="max-w-sm">
          <For each={collection.items}>
            {item => (
              <SelectItem item={item.value}>
                <p class="font-medium text-sm leading-normal">{item.label}</p>

                <p class="text-content-tertiary text-xs">
                  {Formats[item.value as ScheduleFormat].description}
                </p>
              </SelectItem>
            )}
          </For>
        </SelectContent>
      </Select>
    </Show>
  );
}

export function ScheduleExecutions() {
  const { state } = useEditorContext();

  const callAmsterdam = Temporal.ZonedDateTime.from('2026-04-24T15:00:00[Europe/Amsterdam]');

  const callNewYork = callAmsterdam.withTimeZone('America/New_York');

  const [timezone, setTimezone] = createSignal<Temporal.TimeZoneLike>();

  return (
    <div class="flex flex-col overflow-hidden rounded-lg border border-separator transition-colors">
      <div class="border-separator border-b p-4 transition-colors">
        <p class="font-medium text-content-secondary text-sm">Next executions</p>

        <></>
      </div>

      <div class="min-h-48 flex-1">
        <Show when={state() === 'valid'} fallback={ExecutionEmpty()}>
          <p>Hello World!</p>
        </Show>
      </div>

      <div class="border-separator border-t bg-background p-2 transition-colors dark:bg-surface">
        <p class="text-center text-content-tertiary text-xs">Scroll for more executions</p>
      </div>
    </div>
  );
}
