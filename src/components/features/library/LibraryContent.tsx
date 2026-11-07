import { For } from 'solid-js';
import Templates from '@/assets/library.json';
import type { LibraryTemplate } from '@/types/library';
import { LibraryItem } from './LibraryItem';

export function LibraryContent() {
  // filter logic
  const templates = Templates.filter(t => t);

  return (
    <div class="@container">
      <div class='grid-cols grid @4xl:grid-cols-3 @xl:grid-cols-2 grid-cols-1 gap-4'>
        <For each={templates}>
          {(template: LibraryTemplate) => <LibraryItem template={template} />}
        </For>
      </div>
    </div>
  );
}
