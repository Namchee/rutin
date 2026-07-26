import { Show } from 'solid-js';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

import { cn } from '@/lib/css';

import type { ScheduleFormat } from '@/types';

import { useEditorContext } from './context';
import { FormatSelector } from './FormatSelector';
import { ScheduleDescriptor } from './ScheduleDescriptor';
import { ScheduleHint } from './ScheduleHint';

const Placeholders: Record<ScheduleFormat, string> = {
  amazon: '* * * * * *',
  'cf-workers': '* * * * *',
  node: '* * * * * *',
  posix: '* * * * *',
  quartz: '* * * * * * *',
  systemd: '* *-*-* *:*:*',
};

export function ScheduleEditor() {
  const { onInput, state, format, onBlur, onCaretMovement, normal, ref } = useEditorContext();

  return (
    <div class="flex flex-col rounded-lg border border-separator">
      <div class="flex items-center justify-between border-separator border-b p-4">
        <FormatSelector />

        <Show when={state() !== 'incomplete'}>
          <Badge variant={state() === 'valid' ? 'default' : 'outline'}>
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
            onInput={onInput}
            onSelect={onCaretMovement}
            onKeyUp={onCaretMovement}
            onClick={onCaretMovement}
            onBlur={onBlur}
            ref={ref}
            spellcheck={false}
            placeholder={Placeholders[format()]}
            autocomplete="off"
          />
        </div>

        <div class="pb-4">
          <ScheduleHint />
        </div>
      </div>

      <ScheduleDescriptor />

      <div class="flex items-center justify-between border-separator border-t p-4">
        <div>
          <Button size="sm" disabled={!normal()}>
            <div class="i-lucide-wrench text-brand-foreground" />
            Normalize
          </Button>
        </div>

        <div class="flex items-center gap-2">
          <Button size="sm" variant="outline">
            <div class="i-lucide-copy" />
            Copy
          </Button>

          <Button size="sm" variant="outline">
            <div class="i-lucide-save" />
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
