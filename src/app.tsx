import 'virtual:uno.css';

import './assets/styles/global.css';
import './assets/styles/fonts.css';

import { Router } from '@solidjs/router';
import { FileRoutes } from '@solidjs/start/router';
import { Suspense } from 'solid-js';
import { Layout } from './components/layout/Layout';

export default function App() {
  return (
    <Router
      root={props => (
        <>
          <Layout>
            <Suspense>{props.children}</Suspense>
          </Layout>
        </>
      )}>
      <FileRoutes />
    </Router>
  );
}
