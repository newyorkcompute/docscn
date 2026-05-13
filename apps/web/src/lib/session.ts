import { headers } from 'next/headers';
import { auth, type AuthSession } from './auth';

export async function getRequestSession(
  request: Request,
): Promise<AuthSession | null> {
  return auth.api.getSession({ headers: request.headers });
}

export async function getServerSession(): Promise<AuthSession | null> {
  return auth.api.getSession({ headers: await headers() });
}
