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
import { getAppOrigin } from './app-origin';

const localDevSecret =
  'docscn-local-development-secret-change-before-production';

function resolveAuthSecret() {
  const secret = process.env['BETTER_AUTH_SECRET'];

  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'BETTER_AUTH_SECRET is required in production. Set a long random value before starting the app.',
    );
  }

  return localDevSecret;
}

const isProduction = process.env.NODE_ENV === 'production';

export const auth = betterAuth({
  baseURL: getAppOrigin(),
  secret: resolveAuthSecret(),
  advanced: {
    defaultCookieAttributes: {
      secure: isProduction,
      sameSite: 'lax',
    },
  },
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
