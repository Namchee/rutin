import { A } from '@solidjs/router';
import type { Accessor, Setter } from 'solid-js';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip';

import { ThemeSwitcher } from '../ThemeSwitcher';
import { MobileDrawer } from './Sidebar';

interface TopbarProps {
  expanded: Accessor<boolean>;

  setExpanded: Setter<boolean>;
}

export function Topbar({ expanded, setExpanded }: Readonly<TopbarProps>) {
  return (
    <div class="sticky top-0 z-10 bg-background pt-2">
      <div class="relative flex h-14 items-center justify-between rounded-t-lg border border-separator bg-surface p-4">
        <div class="flex items-center">
          <A href="/" class="i-me-logo size-6 shrink-0 md:hidden" />

          <Tooltip positioning={{ placement: 'right' }}>
            <TooltipTrigger
              class="group grid size-6 cursor-pointer place-items-center rounded bg-surface transition-colors hover:bg-surface-hover max-md:hidden"
              onClick={() => setExpanded(prev => !prev)}>
              <div class="i-lucide-panel-right size-4 bg-content-secondary transition-colors group-hover:bg-content-primary" />
            </TooltipTrigger>

            <TooltipContent>{expanded() ? 'Shrink' : 'Expand'} Sidebar</TooltipContent>
          </Tooltip>
        </div>

        <div class="max-md:hidden">
          <ThemeSwitcher />
        </div>

        <MobileDrawer />
      </div>
    </div>
  );
}
