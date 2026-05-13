import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './packages/db/src/lib/schema.ts',
  out: './packages/db/drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      'postgres://docscn:docscn@localhost:5432/docscn',
  },
});
