import { Show } from 'solid-js';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/css';
import { useEditorContext } from './context';

import { FormatSelector } from './FormatSelector';
import { ScheduleDescriptor } from './ScheduleDescriptor';
import { ScheduleHint } from './ScheduleHint';

export function ScheduleEditor() {
  const { state } = useEditorContext();

  return (
    <div class="flex flex-col rounded-lg border border-separator transition-colors">
      <div class='flex items-center justify-between border-separator border-b p-4 transition-colors'>
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

      <div class="flex flex-1 flex-col gap-2 p-4">
        <input
          type="text"
          class="w-full rounded-lg border border-separator bg-background text-center font-mono text-2xl"
        />

        <ScheduleHint />
      </div>

      <ScheduleDescriptor />

      <div class="flex items-center justify-between border-separator border-t p-4 transition-colors">
        <div>
          <Button size="sm" disabled>
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
