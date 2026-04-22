import { createSignal, onCleanup, Show } from 'solid-js';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/Tooltip';

export function ScheduleTools() {
  const [isCopied, setIsCopied] = createSignal(false);

  let copyTimer: NodeJS.Timeout | null = null;

  function onCopy() {
    if (copyTimer) {
      clearTimeout(copyTimer);
    }

    setIsCopied(true);

    copyTimer = setTimeout(() => {
      setIsCopied(false);
    }, 2_500);
  }

  onCleanup(() => {
    if (copyTimer) {
      clearTimeout(copyTimer);
    }
  });

  return (
    <div class="flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger
          class="size-[28px] transition-colors rounded-md grid place-items-center hover:bg-accent hover:text-accent-foreground disabled:text-muted-foreground hover:disabled:text-muted-foreground cursor-pointer"
          onClick={onCopy}
          disabled={isCopied()}>
          <Show when={isCopied()} fallback={<div class="i-lucide-copy size-[14px]" />}>
            <div class="i-lucide-check size-[14px]" />
          </Show>
        </TooltipTrigger>

        <TooltipContent class="text-xs">
          <Show when={isCopied()} fallback={<>Copy</>}>
            Copied!
          </Show>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger class="size-[28px] transition-colors rounded-md grid place-items-center hover:bg-accent hover:text-accent-foreground cursor-pointer">
          <div class="i-lucide-wrench size-[14px]" />
        </TooltipTrigger>

        <TooltipContent class="text-xs">Normalize</TooltipContent>
      </Tooltip>
    </div>
  );
}
