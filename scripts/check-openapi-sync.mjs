#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const yamlPath = join(root, 'packages/sdk/openapi.yaml');
const jsonPath = join(root, 'packages/sdk/openapi.json');

const expected = `${JSON.stringify(parse(readFileSync(yamlPath, 'utf8')), null, 2)}\n`;
const actual = readFileSync(jsonPath, 'utf8');

if (actual !== expected) {
  console.error('openapi.json is out of sync with openapi.yaml.');
  console.error('Run: npm run openapi:sync');
  process.exit(1);
}

console.log('openapi sync ok');
