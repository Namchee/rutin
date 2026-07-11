import type { JSX } from 'solid-js';

import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

interface LayoutProps {
  children: JSX.Element;
}

export function Layout({ children }: Readonly<LayoutProps>) {
  return (
    <div class="flex min-h-screen bg-background text-content-primary">
      <Sidebar />

      <div class="my-2 mr-2 flex flex-1 flex-col rounded-md border border-separator bg-surface shadow-xs">
        <Topbar />

        <main class="flex-1">
          <div class="mx-auto max-w-6xl px-4 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
