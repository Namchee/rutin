import { A } from '@solidjs/router';

import { ThemeSwitcher } from '../ThemeSwitcher';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/Tooltip';

export function Topbar() {
  return (
    <div class=":uno: flex h-12 items-center justify-between p-4">
      <div class=":uno: h-full">
        <Tooltip>
          <TooltipTrigger class=":uno: group grid size-6 cursor-pointer place-items-center rounded bg-surface transition-colors hover:bg-surface-hover">
            <div class=":uno: i-lucide-panel-right size-4 bg-content-secondary transition-colors group-hover:bg-content-primary" />
          </TooltipTrigger>

          <TooltipContent>Shrink Sidebar</TooltipContent>
        </Tooltip>
      </div>

      <div class=":uno: flex items-center gap-2">
        <ThemeSwitcher />

        <A
          href="https://www.github.com/Namchee/rutin"
          target="_blank"
          rel="noopener noreferrer"
          class=":uno: grid size-6 place-items-center rounded text-content-secondary transition-colors hover:bg-background-hover hover:text-content-primary">
          <div class="i-me-github size-4" />
        </A>
      </div>
    </div>
  );
}
