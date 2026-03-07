import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';
import uno from 'unocss/vite';

export default defineConfig({
  plugins: [solid(), uno()],
  server: {
    port: 3000,
  },
  build: {
    target: 'esnext',
  },
});
