import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tanstackRouter } from '@tanstack/router-plugin/vite';

import uno from 'unocss/vite';

import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  build: {
    target: 'esnext',
  },
  plugins: [
    tanstackRouter({
      autoCodeSplitting: true,
      target: 'solid',
    }),
    solid(),
    uno(),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
  },
});
