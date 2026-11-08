import { For, Show } from 'solid-js';
import { cn } from '@/lib/css';
import type { LibraryTemplate } from '@/types/library';
import { useLibraryContext } from './context';
import { LibraryEmpty } from './LibraryEmpty';
import { LibraryItem } from './LibraryItem';

export function LibraryContent() {
  const { templates } = useLibraryContext();

  return (
    <div
      class={cn('@container', {
        'h-full': templates().length === 0,
      })}>
      <div
        class={cn('grid h-full gap-4', {
          '@4xl:grid-cols-3 @xl:grid-cols-2 grid-cols-1': templates().length > 0,
          'grid-cols-1': templates.length === 0,
        })}>
        <Show when={templates().length > 0}>
          <For each={templates()}>
            {(template: LibraryTemplate) => <LibraryItem template={template} />}
          </For>
        </Show>

        <Show when={templates().length === 0}>
          <LibraryEmpty />
        </Show>
      </div>
    </div>
  );
}
