import type { JSX } from 'solid-js';

import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

interface LayoutProps {
  children: JSX.Element;
}

export function Layout({ children }: Readonly<LayoutProps>) {
  return (
    <div class="flex min-h-screen bg-background text-content-primary transition-colors">
      <Sidebar />

      <div class='mx-2 mb-2 flex flex-1 flex-col rounded-md rounded-b-lg border-separator border-b bg-surface shadow-xs transition-colors md:ml-0'>
        <Topbar />

        <main class="flex-1 border-separator border-x">
          <div class="mx-auto max-w-6xl px-4 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
