import { A, useLocation } from '@solidjs/router';
import { cn } from '@/lib/css';

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

export function Sidebar() {
  const location = useLocation();

  return (
    <div class="hidden h-screen w-60 flex-col gap-4 p-4 md:flex">
      <div class="flex px-2 py-2">
        <A href="/" class="i-me-logo size-6 shrink-0" />
      </div>

      <nav class="flex flex-col gap-1">
        {Links.map(link => (
          <A
            class={cn(
              'group ml-[2px] flex h-8 items-center gap-2 rounded-md p-2 transition-colors hover:bg-background-hover',
              {
                'bg-background-hover text-content-primary': location.pathname === link.href,
                'text-content-secondary group-hover:text-content-primary':
                  location.pathname !== link.href,
              },
            )}
            href={link.href}>
            <div class={cn('size-4 transition-colors', link.icon)} />

            <span class="text-sm leading-none">{link.name}</span>
          </A>
        ))}
      </nav>
    </div>
  );
}
