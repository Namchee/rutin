import { createEffect, createSignal, type JSX } from 'solid-js';

import { cn } from '@/lib/css';
import { useMediaQuery } from '@/lib/hooks/use-media-query';

import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

interface LayoutProps {
  children: JSX.Element;
}

export function Layout({ children }: Readonly<LayoutProps>) {
  const isNonMobile = useMediaQuery('(min-width: 768px)');
  const [expanded, setExpanded] = createSignal<boolean>(isNonMobile());

  createEffect(() => {
    setExpanded(isNonMobile());
  })

  return (
    <div class="flex min-h-screen bg-background text-content-primary">
      <Sidebar expanded={expanded} setExpanded={setExpanded} />

      <button
        class={cn('-ml-1 hidden h-screen w-1 cursor-col-resize', {
          hidden: expanded(),
          'md:block': !expanded(),
        })}
        type="button"
        onClick={() => setExpanded(true)}
      />

      <div class="mx-2 mb-2 flex flex-1 flex-col rounded-md rounded-b-lg border-separator border-b bg-surface lg:ml-0">
        <Topbar expanded={expanded} setExpanded={setExpanded} />

        <main class="flex-1 rounded-b-lg border-separator border-x">
          <div class="mx-auto max-w-6xl px-4 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
