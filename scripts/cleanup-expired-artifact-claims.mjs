#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import postgres from 'postgres';

async function readEnvLocal() {
  try {
    const contents = await readFile('.env.local', 'utf8');
    const entries = {};

    for (const line of contents.split('\n')) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/m);
      if (!match) {
        continue;
      }

      const [, key, rawValue] = match;
      entries[key] = rawValue.replace(/^['"]|['"]$/g, '');
    }

    return entries;
  } catch {
    return {};
  }
}

const dryRun = process.argv.includes('--dry-run');
const envLocal = await readEnvLocal();
const databaseUrl = process.env.DATABASE_URL ?? envLocal.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    'DATABASE_URL is required. Set it in the environment or .env.local.',
  );
}

const sql = postgres(databaseUrl, { max: 1 });

try {
  if (dryRun) {
    const [row] = await sql`
      SELECT count(*)::int AS count
      FROM artifact_claims
      WHERE claimed_at IS NULL
        AND expires_at <= now()
    `;

    console.log(
      `${row.count} expired anonymous artifact claim${
        row.count === 1 ? '' : 's'
      } would be deleted.`,
    );
  } else {
    const deletedRows = await sql`
      DELETE FROM artifact_claims
      WHERE claimed_at IS NULL
        AND expires_at <= now()
      RETURNING artifact_id
    `;

    console.log(
      `Deleted ${deletedRows.length} expired anonymous artifact claim${
        deletedRows.length === 1 ? '' : 's'
      }. Unlisted artifacts remain viewable at their existing URLs.`,
    );
  }
} finally {
  await sql.end({ timeout: 5 });
}
