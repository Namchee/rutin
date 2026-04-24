import { Tooltip, TooltipContent, TooltipTrigger } from './ui/Tooltip';

export function ScheduleInfo() {
  return (
    <div class="flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger class="size-8 transition-colors rounded-md grid place-items-center text-accent-foreground/70 hover:bg-accent hover:text-accent-foreground cursor-pointer">
          <div class="i-lucide-info size-4" />
        </TooltipTrigger>

        <TooltipContent class="text-xs">Information</TooltipContent>
      </Tooltip>
    </div>
  );
}
