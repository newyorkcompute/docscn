#!/usr/bin/env node

import { runDocscnCli } from './lib/cli.js';

runDocscnCli().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
