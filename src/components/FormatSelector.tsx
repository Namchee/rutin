import { createListCollection } from '@ark-ui/solid';
import { type Accessor, createSignal, For, type JSXElement, type Setter, Show } from 'solid-js';

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
import { FormatLabel } from '@/const/schedule';
import { cn } from '@/lib/css';
import { useMediaQuery } from '@/lib/hooks/use-media-query';
import type { ScheduleFormat } from '@/types/schedule';

interface FormatSelectorProps {
  format: Accessor<ScheduleFormat>;
  setFormat: (format: ScheduleFormat) => void;

  children: JSXElement;
}

function FormatDrawer({ format, setFormat, children }: Readonly<FormatSelectorProps>) {
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
          <p class="truncate font-medium text-sm">{FormatLabel[format()].label}</p>

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
              <For each={Object.entries(FormatLabel)}>
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

export function FormatSelector({ format, setFormat }: Readonly<FormatSelectorProps>) {
  const isNonMobile = useMediaQuery('(min-width: 768px)');

  const collection = createListCollection({
    items: Object.entries(FormatLabel).map(([k, v]) => ({ label: v.label, value: k })),
  });

  return (
    <Show when={isNonMobile()} fallback={<FormatDrawer format={format} setFormat={setFormat} />}>
      <Select
        collection={collection}
        value={[format()]}
        onValueChange={v => setFormat(v.value[0] as unknown as ScheduleFormat)}
        class="flex items-center gap-2">
        <SelectTrigger>
          <div class="i-lucide-languages mr-2 size-4 text-content-secondary" />

          <SelectValue
            class="h-fit w-24 truncate font-medium leading-none"
            placeholder="Select dialect..."
          />

          <div class="i-lucide-chevron-down size-[14px] shrink-0 text-content-tertiary" />
        </SelectTrigger>

        <SelectContent class="max-w-sm">
          <p class="mt-1 ml-2 font-mono text-content-tertiary text-xs">Dialect</p>

          <For each={collection.items}>
            {item => (
              <SelectItem item={item.value}>
                <p class="font-medium text-sm leading-normal">{item.label}</p>

                <p class="text-content-tertiary text-xs">
                  {FormatLabel[item.value as ScheduleFormat].description}
                </p>
              </SelectItem>
            )}
          </For>
        </SelectContent>
      </Select>
    </Show>
  );
}
