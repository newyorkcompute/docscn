import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

type Db = ReturnType<typeof drizzle<typeof schema>>;
type Sql = ReturnType<typeof postgres>;

const globalForDb = globalThis as unknown as {
  docscnSql?: Sql;
  docscnDb?: Db;
};

function createSql(databaseUrl: string) {
  return postgres(databaseUrl, {
    prepare: false,
    // Dev HMR can reload modules and leak pools; keep this small.
    max: process.env['NODE_ENV'] === 'development' ? 3 : 10,
    idle_timeout: 20,
    max_lifetime: 60 * 30,
    connect_timeout: 10,
  });
}

export function getDatabaseUrl() {
  return process.env['DATABASE_URL'] ?? process.env['POSTGRES_URL'];
}

export function isDatabaseConfigured() {
  return Boolean(getDatabaseUrl());
}

export function getDb() {
  if (!globalForDb.docscnDb) {
    const databaseUrl = getDatabaseUrl();

    if (!databaseUrl) {
      throw new Error('DATABASE_URL or POSTGRES_URL is not set.');
    }

    const sql = createSql(databaseUrl);
    globalForDb.docscnSql = sql;
    globalForDb.docscnDb = drizzle(sql, { schema });
  }

  return globalForDb.docscnDb;
}
