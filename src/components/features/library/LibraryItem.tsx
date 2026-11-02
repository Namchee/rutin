import { cn } from '@/lib/css';
import type { LibraryTemplate } from '@/types/library';
import { useLibraryContext } from './context';

interface LibraryItemProps {
  template: LibraryTemplate;
}

export function LibraryItem({ template }: Readonly<LibraryItemProps>) {
  const { display } = useLibraryContext();

  const formatter = new Intl.NumberFormat('en-GB');

  return (
    <div
      class={cn('flex rounded-md border border-md border-separator', {
        'flex-col': display() === 'grid',
      })}>
      <div class="flex items-center gap-4 border-separator border-b px-4 py-2">
        <div class="flex flex-col gap-0.5">
          <p class="font-mono text-2xs text-content-secondary uppercase">Per day</p>
          <p class='font-medium font-mono text-content-secondary text-sm'>
            {formatter.format(720)}
          </p>
        </div>

        <div class="flex flex-col gap-0.5">
          <p class="font-mono text-2xs text-content-secondary uppercase">Per year</p>
          <p class='font-medium font-mono text-content-secondary text-sm'>
            {formatter.format(14400)}
          </p>
        </div>
      </div>

      <div class="flex flex-col gap-2 p-4">
        <p class="inline w-fit rounded-md border border-separator bg-background px-1 font-mono">
          {template.syntax}
        </p>

        <div>
          <p class="font-medium text-content-secondary text-sm">{template.label}</p>

          <p class="text-content-tertiary text-xs">{template.description}</p>
        </div>
      </div>

      <div></div>
    </div>
  );
}
