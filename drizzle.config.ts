import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './packages/db/src/lib/schema.ts',
  out: './packages/db/drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url:
      process.env.DATABASE_URL_UNPOOLED ??
      process.env.POSTGRES_URL_NON_POOLING ??
      process.env.DATABASE_URL ??
      process.env.POSTGRES_URL ??
      'postgres://docscn:docscn@localhost:5432/docscn',
  },
});
