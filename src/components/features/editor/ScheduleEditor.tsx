import { Show } from 'solid-js';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

import { useEditor } from './context';

import { FormatSelector } from './FormatSelector';

export function ScheduleEditor() {
  const { state } = useEditor();

  return (
    <div class="flex flex-col rounded-lg border border-separator">
      <div class="flex items-center justify-between border-separator border-b p-4">
        <FormatSelector />

        <Show when={state() !== 'incomplete'}>
          <Badge variant={state() === 'valid' ? 'default' : 'outline'}>
            {state() === 'valid' ? 'Valid' : 'Invalid'}
          </Badge>
        </Show>
      </div>

      <div class="flex-1 p-4">
        <input
          type="text"
          class="w-full rounded-lg border border-separator bg-background text-center font-mono text-2xl"
        />
      </div>

      <div class="flex items-center justify-between border-separator border-t p-4">
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
