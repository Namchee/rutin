import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cloudflare } from '@cloudflare/vite-plugin';
import { solidStart } from '@solidjs/start/config';
import uno from 'unocss/vite';

import { defineConfig } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  build: {
    target: 'esnext',
  },
  plugins: [cloudflare({ viteEnvironment: { name: 'ssr' } }), solidStart(), uno(),],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
  },
});
