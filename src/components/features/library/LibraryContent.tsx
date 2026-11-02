import { For } from 'solid-js';
import Templates from '@/assets/library.json';
import { cn } from '@/lib/css';
import type { LibraryTemplate } from '@/types/library';
import { useLibraryContext } from './context';
import { LibraryItem } from './LibraryItem';

export function LibraryContent() {
  const { display } = useLibraryContext();

  // filter logic
  const templates = Templates.filter(t => t);

  return (
    <div
      class={cn('gap-4', {
        'flex flex-col': display() === 'list',
        'grid grid-cols-3': display() === 'grid',
      })}>
      <For each={templates}>
        {(template: LibraryTemplate) => <LibraryItem template={template} />}
      </For>
    </div>
  );
}
