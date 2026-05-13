import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

function createDb() {
  const databaseUrl = process.env['DATABASE_URL'];

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set.');
  }

  const sql = postgres(databaseUrl, {
    prepare: false,
  });

  return drizzle(sql, { schema });
}

let db: ReturnType<typeof createDb> | null = null;

export function isDatabaseConfigured() {
  return Boolean(process.env['DATABASE_URL']);
}

export function getDb() {
  if (!db) {
    db = createDb();
  }

  return db;
}
