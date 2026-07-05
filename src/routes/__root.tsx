import { createRootRoute, Outlet } from "@tanstack/solid-router";
import { TanStackRouterDevtools } from '@tanstack/solid-router-devtools';

function RootLayout() {
  return <div>
    <Outlet />
    <TanStackRouterDevtools />
  </div>
}

export const Route = createRootRoute({ component: RootLayout });
