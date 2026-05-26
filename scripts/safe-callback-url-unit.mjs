import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outfile = join(root, '.cache/safe-callback-url-unit.mjs');

mkdirSync(dirname(outfile), { recursive: true });

await build({
  entryPoints: [join(root, 'apps/web/src/lib/safe-callback-url.ts')],
  outfile,
  bundle: true,
  platform: 'node',
  format: 'esm',
});

const { sanitizeCallbackUrl } = await import(outfile);

assert.equal(sanitizeCallbackUrl(undefined), '/dashboard');
assert.equal(sanitizeCallbackUrl('/dashboard'), '/dashboard');
assert.equal(
  sanitizeCallbackUrl('/cli/login?code=ABC123'),
  '/cli/login?code=ABC123',
);
assert.equal(sanitizeCallbackUrl('https://evil.com'), '/dashboard');
assert.equal(sanitizeCallbackUrl('//evil.com'), '/dashboard');
assert.equal(sanitizeCallbackUrl('/evil.com'), '/evil.com');

console.log('safe-callback-url unit ok');
