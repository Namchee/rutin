import fs from 'node:fs';
import path from 'node:path';

// Path to wrangler config
const configPath = path.resolve(process.cwd(), 'dist', 'client', 'wrangler.json');

if (!fs.existsSync(configPath)) {
  console.log(`Config file not found at ${configPath}, skipping.`);
  process.exit(0);
}

// Fields causing Cloudflare Wrangler parser warnings
const BAD_TOP_LEVEL = new Set([
  'definedEnvironments',
  'exports',
  'ai_search_namespaces',
  'ai_search',
  'agent_memory',
  'secrets_store_secrets',
  'artifacts',
  'unsafe_hello_world',
  'flagship',
  'worker_loaders',
  'ratelimits',
  'vpc_services',
  'vpc_networks',
  'python_modules'
]);

const BAD_DEV_FIELDS = new Set(['enable_containers', 'generate_types']);

try {
  const raw = fs.readFileSync(configPath, 'utf8');

  // Strip single-line and multi-line comments so JSON.parse won't crash
  const jsonOnly = raw
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*/g, '');

  const config = JSON.parse(jsonOnly);

  // Clean top-level fields
  for (const key of BAD_TOP_LEVEL) {
    delete config[key];
  }

  // Clean dev fields
  if (config.dev && typeof config.dev === 'object') {
    for (const key of BAD_DEV_FIELDS) {
      delete config.dev[key];
    }
  }

  // Overwrite wrangler.jsonc with cleaned JSON
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
  console.log('✓ Successfully cleaned wrangler.jsonc for Cloudflare deployment.');
} catch (err) {
  console.error('Failed to clean wrangler.jsonc:', err.message);
  process.exit(1);
}
