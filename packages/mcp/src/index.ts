#!/usr/bin/env node

import { fileURLToPath } from 'node:url';
import { runDocscnMcpServer } from './lib/server.js';

export * from './lib/client.js';
export * from './lib/credentials.js';
export * from './lib/server.js';

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  runDocscnMcpServer().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
