import { createListCollection } from '@ark-ui/solid';
import { createSignal, For, Show } from 'solid-js';

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
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';

import { cn } from '@/lib/css';
import { useMediaQuery } from '@/lib/hooks/use-media-query';

import type { Format, ScheduleFormat } from '@/types';

import { useEditorContext } from './context';

// biome-ignore assist/source/useSortedKeys: Need to preserve order
const Formats: Record<ScheduleFormat, Format> = {
  unix: {
    description: '5 fields ⋅ Classic CRON',
    label: 'UNIX',
  },
  quartz: {
    description: '6 - 7 fields ⋅ Java-based',
    label: 'Quartz',
  },
  node: {
    description: '5 - 6 fields ⋅ Optional seconds field',
    label: 'Node.js',
  },
  amazon: {
    description: '5 - 6 fields ⋅ Optional year field',
    label: 'Amazon',
  },
  'cf-workers': {
    description: '5 fields ⋅ Day start with 1 to 7',
    label: 'Cloudflare Workers',
  },
  systemd: {
    description: '3 fields ⋅ OnCalendar ⋅ Linux',
    label: 'Systemd',
  },
};

function FormatDrawer() {
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
    <Show when={isNonMobile()} fallback={<FormatDrawer />}>
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
