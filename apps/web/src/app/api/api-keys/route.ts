import { NextResponse } from 'next/server';
import { createApiKey, listApiKeys } from '@docscn/db';
import { getRequestSession } from '../../../lib/session';

function isValidApiKeyName(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length >= 2;
}

export async function GET(request: Request) {
  const session = await getRequestSession(request);

  if (!session) {
    return NextResponse.json(
      { error: 'Sign in to manage API keys.' },
      { status: 401 },
    );
  }

  return NextResponse.json({
    apiKeys: await listApiKeys(session.user.id),
  });
}

export async function POST(request: Request) {
  const session = await getRequestSession(request);

  if (!session) {
    return NextResponse.json(
      { error: 'Sign in to create API keys.' },
      { status: 401 },
    );
  }

  const body = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;

  if (!body || !isValidApiKeyName(body.name)) {
    return NextResponse.json(
      { error: 'API key name must be at least 2 characters.' },
      { status: 400 },
    );
  }

  return NextResponse.json(
    await createApiKey({
      userId: session.user.id,
      name: body.name,
    }),
    { status: 201 },
  );
}
