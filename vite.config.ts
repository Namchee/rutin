import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { solidStart } from '@solidjs/start/config';
import { nitroV2Plugin as nitro } from '@solidjs/vite-plugin-nitro-2';
import uno from 'unocss/vite';

import { defineConfig } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  build: {
    target: 'esnext',
  },
  plugins: [solidStart(), uno(), nitro({
    preset: 'cloudflare-pages',
    rollupConfig: {
      external: ['node:async_hooks', 'node:buffer'],
    },
  })],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
  },
});
