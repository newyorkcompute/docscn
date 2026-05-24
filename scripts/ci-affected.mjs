#!/usr/bin/env node

import { spawnSync } from 'node:child_process';

const forwardedArgs = process.argv.slice(2);
const targets = ['lint', 'build', 'unit'];

for (const target of targets) {
  const result = spawnSync(
    'npm',
    ['run', `ci:affected:${target}`, '--', ...forwardedArgs],
    {
      stdio: 'inherit',
      shell: process.platform === 'win32',
    },
  );

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
