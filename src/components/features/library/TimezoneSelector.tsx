import { createListCollection } from '@ark-ui/solid';
import { type Accessor, createSignal, For, type Setter, Show } from 'solid-js';
import { Temporal } from 'temporal-polyfill';
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
import { Timezones } from '@/const/timezone';
import { cn } from '@/lib/css';
import { useMediaQuery } from '@/lib/hooks/use-media-query';
import { useLibraryContext } from './context';

function TimezoneDrawer() {
  const { timezone, setTimezone } = useLibraryContext();

  const [open, setOpen] = createSignal(false);

  function onSelect(tz: string) {
    setTimezone(tz);

    setOpen(false);
  }

  return (
    <div class="flex items-center gap-2">
      <Drawer open={open()} onOpenChange={d => setOpen(d.open)}>
        <DrawerTrigger class='flex h-8 items-center justify-between gap-1.5 rounded-md rounded-l-none border border-separator border-l-none p-2 font-normal transition-shadow focus:ring-accent focus:ring-offset-0'>
          <div class="i-lucide-globe size-4 shrink-0" />
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

export function TimezoneSelector() {
  const { timezone, setTimezone } = useLibraryContext();
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
      fallback={<TimezoneDrawer />}>
      <Select
        collection={collection}
        value={[timezone()]}
        onValueChange={v => setTimezone(v.value[0])}
        positioning={{
          placement: 'bottom-end',
        }}
        class="flex items-center">
        <SelectTrigger class="rounded-l-none border-l-none">
          <div class="i-lucide-globe mr-2 size-4 shrink-0 text-content-secondary" />

          <SelectValue
            class="h-fit w-20 truncate font-medium leading-none"
            placeholder="Select dialect..."
          />

          <div class="i-lucide-chevron-down size-[14px] shrink-0 text-content-tertiary" />
        </SelectTrigger>

        <SelectContent class="max-w-md">
          <p class="my-1 ml-2 font-mono text-content-secondary text-xs uppercase">Timezone</p>

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
