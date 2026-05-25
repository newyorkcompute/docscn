import { defineConfig } from 'drizzle-kit';

const databaseUrl =
  [
    process.env.DATABASE_URL_UNPOOLED,
    process.env.POSTGRES_URL_NON_POOLING,
    process.env.POSTGRES_DATABASE_URL_UNPOOLED,
    process.env.DATABASE_URL,
    process.env.POSTGRES_URL,
    process.env.POSTGRES_DATABASE_URL,
  ].find((value) => value?.trim()) ??
  'postgres://docscn:docscn@localhost:5432/docscn';

export default defineConfig({
  schema: './packages/db/src/lib/schema.ts',
  out: './packages/db/drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseUrl,
  },
});
