import 'uno.css';

import './assets/styles/global.css';
import './assets/styles/anims.css';
import './assets/styles/fonts.css';

import { render } from 'solid-js/web';

import App from './App';
import { RutinContextProvider } from './context';

const root = document.getElementById('root');

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    'Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?',
  );
}

render(
  () => (
    <RutinContextProvider>
      <App />
    </RutinContextProvider>
  ),
  root!,
);
