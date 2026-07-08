import type { JSX } from 'solid-js';

import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

interface LayoutProps {
  children: JSX.Element;
}

export function Layout({ children }: Readonly<LayoutProps>) {
  return (
    <div class=":uno: flex min-h-screen text-content-primary">
      <Sidebar />

      <div class=":uno: flex flex-1 flex-col">
        <Topbar />
        <main class=":uno: flex-1">{children}</main>
      </div>
    </div>
  );
}
