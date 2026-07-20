import { A } from '@solidjs/router';
import { type Accessor, type Setter, Show } from 'solid-js';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip';
import { useMediaQuery } from '@/lib/hooks/use-media-query';
import { ThemeSwitcher } from '../ThemeSwitcher';
import { Button } from '../ui/Button';

interface TopbarProps {
  expanded: Accessor<boolean>;

  setExpanded: Setter<boolean>;
}

function MobileTopbar({ setExpanded }: Readonly<TopbarProps>) {
  return (
    <>
      <A href="/" class="i-me-logo size-6 shrink-0" />

      <Button class="size-6 p-0" variant="ghost" onClick={() => setExpanded(true)}>
        <div class="i-lucide-text-align-end size-4 text-content-primary" />
      </Button>
    </>
  );
}

function DesktopTopbar({ expanded, setExpanded }: Readonly<TopbarProps>) {
  return (
    <>
      <div class="flex items-center gap-1">
        <Tooltip positioning={{ placement: 'right' }}>
          <TooltipTrigger
            class="group grid size-6 cursor-pointer place-items-center rounded bg-surface transition-colors hover:bg-surface-hover"
            onClick={() => setExpanded(prev => !prev)}>
            <div class="i-lucide-panel-right size-4 bg-content-secondary transition-colors group-hover:bg-content-primary" />
          </TooltipTrigger>

          <TooltipContent>{expanded() ? 'Shrink' : 'Expand'} Sidebar</TooltipContent>
        </Tooltip>
      </div>

      <div class="flex items-center gap-2 md:gap-4">
        <ThemeSwitcher />

        <A
          href="https://www.github.com/Namchee/rutin"
          target="_blank"
          rel="noopener noreferrer"
          class="grid size-6 place-items-center rounded text-content-secondary transition-colors hover:bg-background-hover hover:text-content-primary">
          <div class="i-me-github size-4" />
        </A>
      </div>
    </>

  );
}

export function Topbar(props: Readonly<TopbarProps>) {
  const isNonDesktop = useMediaQuery('(min-width: 768px)');

  return (
    <div class="sticky top-0 z-10 bg-background pt-2 transition-colors">
      <div class='flex h-14 items-center justify-between rounded-t-lg border border-separator bg-surface p-4 transition-colors'>
        <Show when={isNonDesktop()} fallback={<MobileTopbar {...props} />}>
          <DesktopTopbar {...props} />
        </Show>
      </div>
    </div>
  );
}
