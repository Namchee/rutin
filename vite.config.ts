import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cloudflare } from '@cloudflare/vite-plugin';
import { solidStart } from '@solidjs/start/config';
import { nitro } from 'nitro/vite';
import uno from 'unocss/vite';

import { defineConfig, type Plugin } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// UnoCSS resolves `virtual:uno.css` to the root-relative pseudo-URL `/__uno.css`.
// Vite 8 runs `?inline`/`?raw`/`?url` requests through the fs allow-list
// (`isServerAccessDeniedForTransform`), which rejects virtual ids that aren't
// `\0`-prefixed or under an allowed path — e.g. the `import('/__uno.css?inline')`
// that @solidjs/start's dev manifest emits to inline CSS into SSR HTML.
// Null-prefix the id so Vite treats it as a virtual module and skips the fs check.
//
// Note: we use UnoCSS's default **global** mode. Per-module mode
// (`mode: 'per-module'`) emits each module's CSS as a separate unscoped style
// tag, so a later module's plain rule (e.g. `.grid`) can override an earlier
// module's responsive variant (e.g. `max-md:hidden`) — same specificity, later
// source order wins. Global mode produces one sorted stylesheet instead.
function unocssVirtualModulePrefix(): Plugin {
  return {
    apply: 'serve',
    enforce: 'pre',
    name: 'unocss:virtual-module-prefix',
    resolveId(id) {
      if (/^\/__uno(?:_[^/?]*)?\.css(\?.*)?$/.test(id)) {
        return `\0${id}`;
      }
    },
  };
}

export default defineConfig({
  plugins: [
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    solidStart(),
    unocssVirtualModulePrefix(),
    uno(),
    nitro(),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
