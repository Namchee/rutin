import { createListCollection } from '@ark-ui/solid';
import { type Accessor, createSignal, For, type JSX, Show } from 'solid-js';

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/Drawer';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/Select';
import { FormatLabel } from '@/const/schedule';
import { cn } from '@/lib/css';
import { useMediaQuery } from '@/lib/hooks/use-media-query';
import type { ScheduleFormat } from '@/types/schedule';

const TRIGGER_BASE =
  'flex h-8 w-32 items-center justify-between rounded-md border border-separator p-2 font-normal text-sm transition-shadow focus:outline-none focus:ring-2 focus:ring-content-tertiary/25 focus:ring-offset-0';

interface FormatSelectorProps {
  format: Accessor<ScheduleFormat>;
  setFormat: (format: ScheduleFormat) => void;

  children?: JSX.Element;
  class?: string;
}

function DefaultTrigger(props: { format: Accessor<ScheduleFormat> }) {
  return (
    <>
      <div class="i-lucide-code-xml mr-2 size-4 shrink-0 text-content-secondary" />

      <p class="truncate font-medium text-sm">{FormatLabel[props.format()].label}</p>

      <div class="i-lucide-chevron-down ml-auto size-3 shrink-0 text-content-tertiary" />
    </>
  );
}

const triggerClass = (props: Readonly<FormatSelectorProps>) => cn(TRIGGER_BASE, props.class);

const resolveTrigger = (props: Readonly<FormatSelectorProps>) =>
  props.children ?? <DefaultTrigger format={props.format} />;

function FormatDrawer(props: Readonly<FormatSelectorProps>) {
  const [open, setOpen] = createSignal(false);

  function pickFormat(format: ScheduleFormat) {
    props.setFormat(format);

    setOpen(false);
  }

  return (
    <Drawer open={open()} onOpenChange={details => setOpen(details.open)}>
      <DrawerTrigger class={triggerClass(props)}>{resolveTrigger(props)}</DrawerTrigger>

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
                  onPointerDown={() => pickFormat(key as ScheduleFormat)}
                  class={cn('flex items-center gap-3 rounded-md p-2 hover:bg-background-hover', {
                    'bg-background-hover': props.format() === key,
                  })}>
                  <div class="flex-1">
                    <p class="font-medium text-content-primary text-sm">{value.label}</p>

                    <p class="text-content-tertiary text-xs">{value.description}</p>
                  </div>

                  <div
                    class={cn('i-lucide-check size-4 text-content-primary', {
                      invisible: props.format() !== key,
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

function FormatSelect(props: Readonly<FormatSelectorProps>) {
  const collection = createListCollection({
    items: Object.entries(FormatLabel).map(([k, v]) => ({ label: v.label, value: k })),
  });

  return (
    <Select
      collection={collection}
      value={[props.format()]}
      onValueChange={v => props.setFormat(v.value[0] as unknown as ScheduleFormat)}
      class="flex items-center gap-2">
      <SelectTrigger class={triggerClass(props)}>{resolveTrigger(props)}</SelectTrigger>

      <SelectContent class="max-w-sm">
        <p class="mt-1 ml-2 font-mono text-content-secondary text-xs uppercase">Dialect</p>

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
  );
}

export function FormatSelector(props: Readonly<FormatSelectorProps>) {
  const isNonMobile = useMediaQuery('(min-width: 768px)');

  return (
    <Show
      when={isNonMobile()}
      fallback={
        <FormatDrawer
          class={props.class}
          format={props.format}
          setFormat={props.setFormat}
          children={props.children}
        />
      }>
      <FormatSelect
        class={props.class}
        format={props.format}
        setFormat={props.setFormat}
        children={props.children}
      />
    </Show>
  );
}
