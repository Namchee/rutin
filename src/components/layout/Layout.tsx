import type { JSX } from 'solid-js';

import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

interface LayoutProps {
  children: JSX.Element;
}

export function Layout({ children }: Readonly<LayoutProps>) {
  return (
    <div class=":uno: flex min-h-screen bg-background text-content-primary">
      <Sidebar />

      <div class=":uno: my-2 mr-2 flex flex-1 flex-col rounded-md border border-separator-secondary bg-surface shadow-xs">
        <Topbar />

        <main class=":uno: flex-1">
          <div class=":uno: mx-auto max-w-5xl px-4 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
