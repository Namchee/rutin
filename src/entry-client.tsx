// @refresh reload
import { mount, StartClient } from "@solidjs/start/client";

async function loadPolyfill() {
  if (typeof Temporal === "undefined") {
    await import('temporal-polyfill/global')
  }
}

const root = document.getElementById("app");
if (!root) {
  throw new Error('Root element not found');
}

loadPolyfill()
  .catch((err) => console.error('Failed to load temporal-polyfill', err))
  .then(() => mount(() => <StartClient />, root));
