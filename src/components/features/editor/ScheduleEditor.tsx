import { createListCollection } from '@ark-ui/solid';
import { createSignal, For, onCleanup, Show } from 'solid-js';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
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
import { FormatLabel } from '@/const/schedule';
import { cn } from '@/lib/css';
import { useMediaQuery } from '@/lib/hooks/use-media-query';
import type { ScheduleFormat } from '@/types/schedule';
import { useEditorContext } from './context';
import { ScheduleDescriptor } from './ScheduleDescriptor';
import { ScheduleHint } from './ScheduleHint';

const Placeholders: Record<ScheduleFormat, string> = {
  amazon: '* * * * * *',
  'cf-workers': '* * * * *',
  node: '* * * * * *',
  quartz: '* * * * * * *',
  systemd: '* *-*-* *:*:*',
  unix: '* * * * *',
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

function FormatSelector() {
  const { format, setFormat } = useEditorContext();

  const isNonMobile = useMediaQuery('(min-width: 768px)');

  const collection = createListCollection({
    items: Object.entries(FormatLabel).map(([k, v]) => ({ label: v.label, value: k })),
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

          <div class="i-lucide-chevron-down ml-auto size-3 shrink-0 text-content-tertiary" />
        </SelectTrigger>

        <SelectContent class="max-w-sm">
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

export function ScheduleEditor() {
  const { onInput, state, format, onBlur, onCaretMovement, normal, value, ref, normalize } =
    useEditorContext();

  const [copied, setCopied] = createSignal<boolean>(false);
  const [timeoutRef, setTimeoutRef] = createSignal<ReturnType<typeof setTimeout> | undefined>();

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(value());
    } catch {
      return;
    }

    setCopied(true);

    setTimeoutRef(
      setTimeout(() => {
        setCopied(false);
      }, 2_500),
    );
  }

  onCleanup(() => {
    const ref = timeoutRef();

    if (ref) {
      clearTimeout(ref);
    }
  });

  return (
    <div class="flex flex-col rounded-lg border border-separator">
      <div class="flex h-fit items-center justify-between border-separator border-b px-4 py-2">
        <FormatSelector />

        <Show when={state() !== 'incomplete'}>
          <Badge variant={state() === 'valid' ? 'default' : 'outline'} class="px-2">
            <div
              class={cn('size-[14px]', {
                'i-lucide-check': state() === 'valid',
                'i-lucide-x': state() === 'invalid',
              })}
            />

            {state() === 'valid' ? 'Valid' : 'Invalid'}
          </Badge>
        </Show>
      </div>

      <div class="flex flex-1 flex-col gap-2">
        <div class="px-4 pt-4">
          <input
            type="text"
            class="w-full rounded-lg border border-separator bg-background text-center font-mono text-2xl transition-shadow focus:outline-none focus:ring-2 focus:ring-content-tertiary/25"
            value={value()}
            onInput={e => onInput(e.currentTarget.value)}
            onSelect={onCaretMovement}
            onKeyUp={onCaretMovement}
            onClick={onCaretMovement}
            onBlur={onBlur}
            spellcheck={false}
            placeholder={Placeholders[format()]}
            autocomplete="off"
            ref={ref}
          />
        </div>

        <div class="pb-4" style={{ 'padding-bottom': '16px' }}>
          <ScheduleHint />
        </div>
      </div>

      <ScheduleDescriptor />

      <div class="flex items-center justify-between border-separator border-t p-4">
        <div>
          <Button size="sm" disabled={normal()} onClick={normalize}>
            <div class="i-lucide-wrench text-brand-foreground" />
            Normalize
          </Button>
        </div>

        <div class="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={onCopy} disabled={!value() || copied()}>
            <div
              class={cn({
                'i-lucide-check': copied(),
                'i-lucide-copy': !copied(),
              })}
            />
            {copied() ? 'Copied!' : 'Copy'}
          </Button>

          <Button size="sm" variant="outline" class="hidden">
            <div class="i-lucide-save" />
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
