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
];

export function Sidebar() {
  const location = useLocation();

  return (
    <div class=":uno: flex h-screen w-60 flex-col gap-6 border-separator-secondary border-r bg-background p-4">
      <div class=":uno: flex px-2">
        <A href="/" class=":uno: i-me-logo size-6" />
      </div>

      <nav class=":uno: flex flex-col gap-1">
        {Links.map(link => (
          <A
            class={cn(
              ':uno: group ml-[2px] flex h-8 items-center gap-2 rounded-md p-2 transition-colors hover:bg-background-hover',
              {
                'bg-background-hover': location.pathname === link.href,
              },
            )}
            href={link.href}>
            <div
              class={cn(':uno: size-4 group-hover:text-content-primary', link.icon, {
                'text-content-secondary': location.pathname !== link.href,
              })}
            />

            <span
              class={cn(':uno: text-sm leading-none group-hover:text-content-primary', {
                'text-content-secondary': location.pathname !== link.href,
              })}>
              {link.name}
            </span>
          </A>
        ))}
      </nav>
    </div>
  );
}
