import { W } from 'node_modules/@kobalte/core/dist/index-766ec211';
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
  posix: {
    label: 'POSIX',
    description:
      'Standard CRON implementation on UNIX operating system via crontab like Vixie or Anacron.',
  },
  quartz: {
    label: 'Quartz',
    description:
      'Richly-featured scheduling system commonly implemented in Java-based applications.',
  },
  systemd: {
    label: 'Systemd',
    description:
      'Scheduling system integrated by systemd which is commonly found in Linux systems.',
  },
  node: {
    label: 'Node.js',
    description:
      'CRON implementation of node-cron, CRON library written for Node.js with optional seconds field.',
  },
  'cf-workers': {
    label: 'Cloudflare Workers',
    description:
      'CRON implementation used in Cloudflare Workers. Closer to Quartz but with 5 fields.',
  },
  cloudwatch: {
    label: 'Amazon Cloudwatch',
    description: 'CRON implementation used in Amazon Cloudwatch. Closer to CRON but with 6 fields.',
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
        class="focus:ring-accent focus:ring-offset-0 transition-shadow justify-start font-normal h-full border-none px-4 pl-3 rounded-l-xl rounded-r-none w-48">
        <div class="flex flex-col items-start">
          <p class="text-xs text-muted-foreground font-mono tracking-tight">Dialect</p>
          <p class="text-sm truncate">{FormatLabel[format()].label}</p>
        </div>
        <div class="i-lucide-chevron-down size-3 text-accent-foreground/50 ml-auto shrink-0" />
      </DrawerTrigger>

      <DrawerContent>
        <div class="px-2 py-4">
          <DrawerHeader class="px-2 pt-0 pb-2 text-left">
            <DrawerTitle class="text-xs font-mono uppercase font-normal text-muted-foreground">
              Dialect
            </DrawerTitle>
          </DrawerHeader>

          <div class="flex flex-col gap-1">
            <For each={Object.entries(FormatLabel)}>
              {([key, value]) => (
                <div
                  onPointerDown={() => onSelect(key as ScheduleFormat)}
                  class={cn('p-2 rounded-md flex items-center gap-3', {
                    'bg-muted': format() === key,
                  })}>
                  <div class="flex-1">
                    <p class="font-medium">{value.label}</p>

                    <p class="text-xs text-muted-foreground">{value.description}</p>
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

            <p class="text-xs text-muted-foreground mt-1">
              {FormatLabel[props.item.rawValue].description}
            </p>
          </SelectItem>
        )}>
        <SelectTrigger
          aria-label="Dialect"
          class="h-full w-48 focus:ring-muted focus:ring-offset-0 transition-shadow cursor-pointer border-none focus:ring-0 hover:bg-accent focus:bg-accent shadow-none transition-colors rounded-l-lg rounded-r-none">
          <div class="flex flex-col items-start max-w-full overflow-hidden">
            <p class="text-xs tracking-tight text-muted-foreground font-mono">Dialect</p>
            <SelectValue<string>>
              {state => (
                <span class="truncate">
                  {FormatLabel[state.selectedOption() as ScheduleFormat].label}
                </span>
              )}
            </SelectValue>
          </div>
        </SelectTrigger>

        <SelectContent class="border-border"></SelectContent>
      </Select>
    </Show>
  );
}
