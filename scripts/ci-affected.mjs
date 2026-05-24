#!/usr/bin/env node

import { spawnSync } from 'node:child_process';

const forwardedArgs = process.argv.slice(2);
const targets = ['lint', 'build', 'unit'];

for (const target of targets) {
  const result = spawnSync(
    'npx',
    [
      'nx',
      'affected',
      '-t',
      target,
      '--exclude=docscn',
      `--parallel=${target === 'unit' ? '2' : '3'}`,
      ...forwardedArgs,
    ],
    {
      stdio: 'inherit',
      shell: process.platform === 'win32',
    },
  );

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
