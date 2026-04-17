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
      'Standard CRON implementation on UNIX operating system via crontab. Also known as Vixie CRON.',
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
  'cf-workers': {
    label: 'Cloudflare Workers',
    description: 'CRON-like scheduling system used exclusively by Cloudflare Workers.',
  },
  cloudwatch: {
    label: 'Amazon Cloudwatch',
    description: 'CRON-like scheduling system used exclusively by Amazon Cloudwatch.',
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
        class="w-48 focus:ring-accent focus:ring-offset-0 transition-shadow justify-start font-normal">
        <div class="i-lucide-code-2 size-4" />
        <p>{FormatLabel[format()].label}</p>

        <div class="i-lucide-chevrons-up-down size-3.5 text-muted-foreground ml-auto"></div>
      </DrawerTrigger>

      <DrawerContent>
        <div class="px-2 py-4">
          <DrawerHeader class="px-2 pt-0 pb-2 text-left">
            <DrawerTitle class=" text-xs font-mono uppercase font-normal text-muted-foreground">
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
                  <div>
                    <p class="font-medium">{value.label}</p>

                    <p class="text-xs text-muted-foreground">{value.description}</p>
                  </div>

                  <div
                    class={cn('i-lucide-check size-5', {
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
          class="w-48 focus:ring-accent focus:ring-offset-0 transition-shadow">
          <div class="flex items-center gap-2">
            <div class="i-lucide-code-2 size-4" />
            <SelectValue<string>>
              {state => FormatLabel[state.selectedOption() as ScheduleFormat].label}
            </SelectValue>
          </div>
        </SelectTrigger>

        <SelectContent class="border-border">
          <p class="px-3 pt-[10px] pb-[2px] text-muted-foreground text-xs font-mono uppercase">
            Dialect
          </p>
        </SelectContent>
      </Select>
    </Show>
  );
}
