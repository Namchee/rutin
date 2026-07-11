import 'virtual:uno.css';

import './assets/styles/globals.css';
import './assets/styles/anims.css';
import './assets/styles/fonts.css';

import { Link, MetaProvider, Title } from '@solidjs/meta';
import { Router } from '@solidjs/router';
import { FileRoutes } from '@solidjs/start/router';
import { Suspense } from 'solid-js';

import { Layout } from './components/layout/Layout';
import { ThemeContextProvider } from './lib/context/theme';

export default function App() {
  return (
    <Router
      root={props => (
        <MetaProvider>
          <Title>Rutin</Title>

          <script
            innerHTML={`const theme = window?.localStorage.getItem('theme'); if (theme) { window.THEME = theme; document.documentElement.style.colorScheme = theme; }`}></script>

          <Link rel="icon" type="image/svg+xml" href="/favicon.svg" />

          <ThemeContextProvider>
            <Layout>
              <Suspense>
                {props.children}
              </Suspense>
            </Layout>
          </ThemeContextProvider>
        </MetaProvider>
      )}>
      <FileRoutes />
    </Router>
  );
}
