import { A, useLocation } from '@solidjs/router';
import type { Accessor } from 'solid-js';

import { cn } from '@/lib/css';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/Tooltip';

const Links = [
  {
    href: '/',
    icon: 'i-lucide-pencil-ruler',
    name: 'Editor',
  },
  {
    href: '/library',
    icon: 'i-lucide-library',
    name: 'Library',
  },
  {
    href: '/saved',
    icon: 'i-lucide-archive',
    name: 'Saved Items',
  },
  {
    href: '/mcp',
    icon: 'i-me-mcp',
    name: 'MCP',
  },
];

interface SidebarProps {
  expanded: Accessor<boolean>;
}

export function Sidebar({ expanded }: Readonly<SidebarProps>) {
  const location = useLocation();

  return (
    <div
      class={cn('hidden h-screen flex-col gap-4 p-4 transition-all duration-250 md:flex', {
        'w-16': !expanded(),
        'w-60': expanded(),
      })}>
      <div class="flex px-2 py-2">
        <A href="/" class="i-me-logo size-6 shrink-0" />
      </div>

      <nav class="flex flex-col gap-1">
        {Links.map(link => (
          <Tooltip positioning={{ placement: 'right' }}>
            <TooltipTrigger>
              <A
                class={cn(
                  'ml-[3px] flex h-8 w-full items-center gap-2 text-nowrap rounded-md p-2 transition-colors hover:bg-background-hover',
                  {
                    'bg-background-hover text-content-primary': location.pathname === link.href,
                    'text-content-secondary group-hover:text-content-primary':
                      location.pathname !== link.href,
                  },
                )}
                href={link.href}>
                <div class={cn('size-4 shrink-0 transition-colors', link.icon)} />

                <span
                  class={cn('text-sm leading-none transition-all duration-250', {
                    'pointer-events-none w-0 opacity-0': !expanded(),
                    'w-auto opacity-100': expanded(),
                  })}>
                  {link.name}
                </span>
              </A>
            </TooltipTrigger>

            <TooltipContent
              class={cn({
                hidden: expanded(),
              })}>
              {link.name}
            </TooltipContent>
          </Tooltip>
        ))}
      </nav>
    </div>
  );
}
