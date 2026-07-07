import type { JSX } from 'solid-js';
import { Navigation } from './Sidebar';

interface LayoutProps {
  children: JSX.Element;
}

export function Layout({ children }: Readonly<LayoutProps>) {
  return (
    <div class=":uno: flex min-h-screen">
      <Navigation />

      <main class=":uno: flex-1">{children}</main>
    </div>
  );
}
