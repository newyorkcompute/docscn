#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { format } from 'prettier';
import { parse } from 'yaml';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const yamlPath = join(root, 'packages/sdk/openapi.yaml');
const jsonPath = join(root, 'packages/sdk/openapi.json');

const json = JSON.stringify(parse(readFileSync(yamlPath, 'utf8')), null, 2);

writeFileSync(jsonPath, await format(json, { parser: 'json' }));
console.log(`Synced ${jsonPath} from ${yamlPath}`);
