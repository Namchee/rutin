import 'uno.css';

import './assets/styles/global.css';
import './assets/styles/anims.css';
import './assets/styles/fonts.css';

import { createRouter, RouterProvider } from '@tanstack/solid-router'

import { render } from 'solid-js/web';
import { routeTree } from './routeTree.gen';

declare module '@tanstack/solid-router' {
  interface Register {
    router: typeof router
  }
}

const root = document.getElementById('root');

if (import.meta.env.DEV && (!(root instanceof HTMLElement) || !root)) {
  throw new Error(
    'Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?',
  );
}

const router = createRouter({ routeTree })

render(() => <RouterProvider router={router} />, root);
