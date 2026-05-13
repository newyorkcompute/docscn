#!/usr/bin/env node

import { fileURLToPath } from 'node:url';
import { runDocscnCli } from './lib/cli.js';

export * from './lib/cli.js';

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  runDocscnCli().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
