import { TooltipTrigger } from '@ark-ui/solid';
import { createSignal, onCleanup } from 'solid-js';
import { Button } from '@/components/ui/Button';
import { Tooltip, TooltipContent } from '@/components/ui/Tooltip';
import { cn } from '@/lib/css';
import type { LibraryTemplate } from '@/types/library';
import { useLibraryContext } from './context';

interface LibraryItemProps {
  template: LibraryTemplate;
}

export function LibraryItem({ template }: Readonly<LibraryItemProps>) {
  const { display, format } = useLibraryContext();

  const [copied, setCopied] = createSignal<boolean>(false);
  const [timeoutRef, setTimeoutRef] = createSignal<ReturnType<typeof setTimeout> | undefined>();

  const formatter = new Intl.NumberFormat('en-GB');

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(template.syntax);
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
    <div
      class={cn('flex divide-separator rounded-md border border-md border-separator', {
        'divide-x': display() === 'list',
        'flex-col divide-y': display() === 'grid',
      })}>
      <div
        class={cn('flex items-center gap-4 px-4 py-2', {
          'w-1/8 flex-col items-start justify-start gap-2': display() === 'list',
        })}>
        <div class="flex flex-col gap-0.5">
          <p class="font-mono text-2xs text-content-tertiary uppercase">Per day</p>
          <p class="font-medium font-mono text-content-secondary">{formatter.format(720)}</p>
        </div>

        <div class="flex flex-col gap-0.5">
          <p class="font-mono text-2xs text-content-tertiary uppercase">Per year</p>
          <p class="font-medium font-mono text-content-secondary">{formatter.format(14400)}</p>
        </div>
      </div>

      <div class="flex flex-1 flex-col gap-2 p-4">
        <div class="flex items-center gap-1">
          {template.syntax.split(' ').map(s => (
            <p class="inline w-fit rounded-md border border-separator bg-background px-1.5 py-0.5 font-mono">
              {s}
            </p>
          ))}
        </div>

        <p class="font-medium text-content-secondary text-sm">{template.label}</p>

        <p class="text-content-tertiary text-xs">{template.description}</p>
      </div>

      <div class={cn("flex items-center justify-between bg-background px-4 py-3", {
        'flex-col': display() === 'list'
      })}>
        <div class={cn("flex items-center font-mono text-content-secondary text-xs", {
          'flex-col': display() === 'list'
        })}>
          <span class="uppercase">Next </span>

          <span>
            Today, 02:10
          </span>
        </div>

        <div class="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger
              class="grid size-6 place-items-center rounded-md rounded-md transition-colors enabled:cursor-pointer enabled:focus-visible:bg-background-hover enabled:hover:bg-background-hover"
              onClick={onCopy}
              disabled={copied()}>
              <div
                class={cn('size-3', {
                  'i-lucide-check': copied(),
                  'i-lucide-copy': !copied(),
                })}
              />
            </TooltipTrigger>

            <TooltipContent>Copy</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger>
              <a
                href={`/?q=${template.syntax}&dialect=${format()}`}
                class="grid size-6 place-items-center rounded-md transition-colors hover:bg-background-hover focus-visible:bg-background-hover">
                <div class="i-lucide-square-pen size-3 text-content-secondary" />
              </a>
            </TooltipTrigger>

            <TooltipContent>Use in Editor</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
