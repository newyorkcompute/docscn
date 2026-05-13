import { verifyApiKey } from '@docscn/db';
import { getRequestSession } from './session';

export interface RequestPrincipal {
  userId: string;
  name?: string;
  kind: 'session' | 'api-key';
}

function getBearerToken(request: Request) {
  const authorization = request.headers.get('authorization');

  if (!authorization) {
    return undefined;
  }

  const [scheme, token] = authorization.split(/\s+/, 2);

  return scheme?.toLowerCase() === 'bearer' && token ? token : undefined;
}

export async function getRequestPrincipal(
  request: Request,
): Promise<RequestPrincipal | undefined> {
  const bearerToken = getBearerToken(request);

  if (bearerToken) {
    const principal = await verifyApiKey(bearerToken);

    return principal
      ? {
          userId: principal.userId,
          name: principal.name,
          kind: 'api-key',
        }
      : undefined;
  }

  const session = await getRequestSession(request);

  return session
    ? {
        userId: session.user.id,
        name: session.user.name,
        kind: 'session',
      }
    : undefined;
}

export function hasBearerToken(request: Request) {
  return Boolean(getBearerToken(request));
}
