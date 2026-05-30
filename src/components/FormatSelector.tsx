import { createSignal, For, Show } from 'solid-js';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { useRutinContext } from '@/context';
import { cn } from '@/lib/css';
import { useMediaQuery } from '@/lib/hooks/use-media-query';
import type { Format, ScheduleFormat } from '@/types';
import { Button } from './ui/Button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from './ui/Drawer';

const FormatLabel: Record<ScheduleFormat, Format> = {
  'cf-workers': {
    description:
      'CRON implementation used in Cloudflare Workers. Closer to Quartz but with 5 fields.',
    label: 'Cloudflare Workers',
  },
  cloudwatch: {
    description: 'CRON implementation used in Amazon Cloudwatch. Closer to CRON but with 6 fields.',
    label: 'Amazon Cloudwatch',
  },
  node: {
    description:
      'CRON implementation of node-cron, CRON library written for Node.js with optional seconds field.',
    label: 'Node.js',
  },
  posix: {
    description:
      'Standard CRON implementation on UNIX operating system via crontab like Vixie or Anacron.',
    label: 'POSIX',
  },
  quartz: {
    description:
      'Richly-featured scheduling system commonly implemented in Java-based applications.',
    label: 'Quartz',
  },
  systemd: {
    description:
      'Scheduling system integrated by systemd which is commonly found in Linux systems.',
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
        as={Button<'button'>}
        variant="outline"
        class="h-full w-48 justify-start rounded-r-none rounded-l-xl border-none px-4 pl-3 font-normal transition-shadow focus:ring-accent focus:ring-offset-0">
        <div class="flex flex-col items-start">
          <p class="text-muted-foreground text-xs tracking-tight">Dialect</p>
          <p class="truncate text-sm">{FormatLabel[format()].label}</p>
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
            <For each={Object.entries(FormatLabel)}>
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

  return (
    <Show when={isNonMobile()} fallback={<FormatSelectorDrawer />}>
      <Select
        value={format()}
        onChange={setFormat}
        options={Object.keys(FormatLabel)}
        placeholder="Select schedule format..."
        placement="bottom-start"
        itemComponent={props => (
          <SelectItem item={props.item} class="max-w-xs transition-colors">
            <p class="font-medium">{FormatLabel[props.item.rawValue].label}</p>

            <p class="mt-1 text-muted-foreground text-xs">
              {FormatLabel[props.item.rawValue].description}
            </p>
          </SelectItem>
        )}>
        <SelectTrigger
          aria-label="Dialect"
          class="h-full w-48 cursor-pointer rounded-r-none rounded-l-lg border-none shadow-none transition-colors transition-shadow hover:bg-accent focus:bg-accent focus:ring-0 focus:ring-muted focus:ring-offset-0">
          <div class="flex max-w-full flex-col items-start">
            <p class="text-muted-foreground text-xs">Dialect</p>
            <SelectValue<string>>
              {state => FormatLabel[state.selectedOption() as ScheduleFormat].label}
            </SelectValue>
          </div>
        </SelectTrigger>

        <SelectContent class="border-border"></SelectContent>
      </Select>
    </Show>
  );
}
