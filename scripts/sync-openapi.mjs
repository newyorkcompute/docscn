#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const yamlPath = join(root, 'packages/sdk/openapi.yaml');
const jsonPath = join(root, 'packages/sdk/openapi.json');

writeFileSync(jsonPath, `${JSON.stringify(parse(readFileSync(yamlPath, 'utf8')), null, 2)}\n`);
console.log(`Synced ${jsonPath} from ${yamlPath}`);
