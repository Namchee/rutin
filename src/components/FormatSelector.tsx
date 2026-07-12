import { createListCollection } from '@ark-ui/solid';
import { createSignal, For, Show } from 'solid-js';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { useRutinContext } from '@/context';
import { cn } from '@/lib/css';
import { useMediaQuery } from '@/lib/hooks/use-media-query';
import type { Format, ScheduleFormat } from '@/types';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from './ui/Drawer';

// biome-ignore assist/source/useSortedKeys: Need to preserve order
const Formats: Record<ScheduleFormat, Format> = {
  posix: {
    description: '5 fields ⋅ Classic CRON',
    label: 'POSIX',
  },
  quartz: {
    description:
      '6 - 7 fields ⋅ Java-based',
    label: 'Quartz',
  },
  node: {
    description:
      '5 - 6 fields ⋅ Optional seconds field',
    label: 'Node.js',
  },
  amazon: {
    description: '5 - 6 fields ⋅ Optional year field',
    label: 'Amazon',
  },
  'cf-workers': {
    description: '5 fields ⋅ Day start with 0',
    label: 'Cloudflare Workers',
  },
  systemd: {
    description:
      '3 fields ⋅ OnCalendar ⋅ Linux',
    label: 'Systemd',
  },
};

function FormatSelectorDrawer() {
  const [{ format }, { setFormat }] = useRutinContext();

  const [open, setOpen] = createSignal(false);

  function onSelect(format: ScheduleFormat) {
    setFormat(format);

    setOpen(false);
  }

  return (
    <Drawer open={open()} onOpenChange={setOpen}>
      <DrawerTrigger
        class="h-full w-48 justify-start rounded-r-none rounded-l-xl border-none px-4 pl-3 font-normal transition-shadow focus:ring-accent focus:ring-offset-0">
        <div class="flex flex-col items-start">
          <p class="text-muted-foreground text-xs tracking-tight">Dialect</p>
          <p class="truncate text-sm">{Formats[format()].label}</p>
        </div>
        <div class="i-lucide-chevron-down ml-auto size-3 shrink-0 text-accent-foreground/50" />
      </DrawerTrigger>

      <DrawerContent>
        <div class="px-2 py-4">
          <DrawerHeader class="px-2 pt-0 pb-2 text-left">
            <DrawerTitle class="font-mono font-normal text-muted-foreground text-xs uppercase">
              Dialect
            </DrawerTitle>
          </DrawerHeader>

          <div class="flex flex-col gap-1">
            <For each={Object.entries(Formats)}>
              {([key, value]) => (
                <div
                  onPointerDown={() => onSelect(key as ScheduleFormat)}
                  class={cn('flex items-center gap-3 rounded-md p-2', {
                    'bg-muted': format() === key,
                  })}>
                  <div class="flex-1">
                    <p class="font-medium">{value.label}</p>

                    <p class="text-muted-foreground text-xs">{value.description}</p>
                  </div>

                  <div
                    class={cn('i-lucide-check size-4', {
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
  );
}

export function FormatSelector() {
  const [{ format }, { setFormat }] = useRutinContext();

  const isNonMobile = useMediaQuery('(min-width: 768px)');

  const collection = createListCollection({
    items: Object.entries(Formats).map(([k, v]) => ({ label: v.label, value: k })),
  });

  return (
    <Select
      collection={collection}
      value={[format()]}
      onValueChange={v => setFormat(v.value[0] as unknown as ScheduleFormat)}
      class="flex items-center gap-2">
      <SelectLabel class="text-content-tertiary">Dialect:</SelectLabel>

      <SelectTrigger>
        <SelectValue
          class="h-fit w-24 truncate font-medium leading-none"
          placeholder="Select dialect..."
        />
      </SelectTrigger>

      <SelectContent class="max-w-sm">
        <For each={collection.items}>
          {item => (
            <SelectItem item={item.value} class=            "[data-highlighted]:bg-content-tertiary">
              <p class="font-medium text-sm leading-normal">{item.label}</p>

              <p class="text-content-tertiary text-xs">
                {Formats[item.value as ScheduleFormat].description}
              </p>
            </SelectItem>
          )}
        </For>
      </SelectContent>
    </Select>
  );

  // return (
  //   <Show when={isNonMobile()} fallback={<FormatSelectorDrawer />}>
  //     <Select
  //       collection={collection}
  //       value={[format()]}
  //       onValueChange={v => setFormat(v.value as unknown as ScheduleFormat)}>
  //       <SelectLabel>Dialect:</SelectLabel>

  //       <SelectTrigger>
  //         <SelectValue
  //           class="h-full w-48 cursor-pointer rounded-r-none rounded-l-lg border-none shadow-none transition-colors transition-shadow hover:bg-accent focus:bg-accent focus:ring-0 focus:ring-muted focus:ring-offset-0"
  //           placeholder="Select dialect..."
  //         />
  //       </SelectTrigger>

  //       <SelectContent>
  //         <For each={collection.items}>
  //           {item => <SelectItem item={item.value}> {item.label}</SelectItem>}
  //         </For>
  //       </SelectContent>
  //     </Select>
  //   </Show>
  // );
}
