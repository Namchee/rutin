import 'virtual:uno.css';

import './assets/styles/globals.css';
import './assets/styles/anims.css';
import './assets/styles/fonts.css';

import { Link, MetaProvider, Title } from '@solidjs/meta';
import { Router } from '@solidjs/router';
import { FileRoutes } from '@solidjs/start/router';
import { Suspense } from 'solid-js';
import { Layout } from './components/layout/Layout';

export default function App() {
  return (
    <Router
      root={props => (
        <MetaProvider>
          <Title>Rutin</Title>
          <Link rel="icon" type="image/svg+xml" href="/favicon.svg" />

          <Layout>
            <Suspense>{props.children}</Suspense>
          </Layout>
        </MetaProvider>
      )}>
      <FileRoutes />
    </Router>
  );
}
