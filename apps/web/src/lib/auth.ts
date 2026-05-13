import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { nextCookies } from 'better-auth/next-js';
import {
  account,
  getDb,
  isDatabaseConfigured,
  session,
  user,
  verification,
} from '@docscn/db';

const localDevSecret =
  'docscn-local-development-secret-change-before-production';

export const auth = betterAuth({
  baseURL:
    process.env['BETTER_AUTH_URL'] ??
    process.env['NEXT_PUBLIC_APP_URL'] ??
    'http://localhost:3000',
  secret: process.env['BETTER_AUTH_SECRET'] ?? localDevSecret,
  database: isDatabaseConfigured()
    ? drizzleAdapter(getDb(), {
        provider: 'pg',
        schema: {
          user,
          session,
          account,
          verification,
        },
      })
    : undefined,
  emailAndPassword: {
    enabled: true,
  },
  plugins: [nextCookies()],
});

export type AuthSession = typeof auth.$Infer.Session;
