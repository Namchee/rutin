import { A } from '@solidjs/router';
import { createSignal, type JSX } from 'solid-js';
import { cn } from '@/lib/css';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

interface LayoutProps {
  children: JSX.Element;
}

export function Layout({ children }: Readonly<LayoutProps>) {
  const [expanded, setExpanded] = createSignal<boolean>(true);

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

        <main class="flex-1 border-separator border-x">
          <div class="mx-auto max-w-6xl px-4 py-8">{children}</div>
        </main>

        <footer class="flex items-center justify-center gap-2 rounded-b-lg border-separator border-x p-2 text-content-tertiary text-xs">
          <div class="flex">
            <span class="block text-content-secondary">Rutin</span>&nbsp;&mdash; Your one stop CRON
            playground.
          </div>

          <A
            href="https://www.github.com/Namchee/rutin"
            class="flex items-center gap-0.5 transition-colors hover:text-content-secondary">
            <div class="i-me-github" /> <span class='font-mono'>#123456</span>
          </A>
        </footer>
      </div>
    </div>
  );
}
