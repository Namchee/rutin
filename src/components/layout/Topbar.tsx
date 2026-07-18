import { A } from '@solidjs/router';

import { ThemeSwitcher } from '../ThemeSwitcher';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/Tooltip';

export function Topbar() {
  return (
    <div class='sticky top-0 z-10 flex h-14 items-center justify-between rounded-t-md border-separator border-b bg-surface p-4'>
      <div>
        <Tooltip>
          <TooltipTrigger class="group grid size-6 cursor-pointer place-items-center rounded bg-surface transition-colors hover:bg-surface-hover">
            <div class="i-lucide-panel-right size-4 bg-content-secondary transition-colors group-hover:bg-content-primary" />
          </TooltipTrigger>

          <TooltipContent>Shrink Sidebar</TooltipContent>
        </Tooltip>
      </div>

      <div class="flex items-center gap-4">
        <ThemeSwitcher />

        <A
          href="https://www.github.com/Namchee/rutin"
          target="_blank"
          rel="noopener noreferrer"
          class="grid size-6 place-items-center rounded text-content-secondary transition-colors hover:bg-background-hover hover:text-content-primary">
          <div class="i-me-github size-4" />
        </A>
      </div>
    </div>
  );
}
