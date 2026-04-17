import { showToast } from './ui/Toast';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/Tooltip';

export function ScheduleTools() {
  function onCopy() {
    showToast({
      title: 'Schedule Copied!',
      description: 'Schedule has successfully copied to your clipboard',
    });
  }

  return (
    <div class="flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger
          class="size-[28px] transition-colors rounded-md grid place-items-center hover:bg-accent hover:text-accent-foreground"
          onClick={onCopy}>
          <div class="i-lucide-copy size-[14px]" />
        </TooltipTrigger>

        <TooltipContent class="text-xs">Copy</TooltipContent>
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
