import { NextResponse } from 'next/server';
import { revokeApiKey } from '@docscn/db';
import { getRequestSession } from '../../../../lib/session';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ apiKeyId: string }> },
) {
  const session = await getRequestSession(request);

  if (!session) {
    return NextResponse.json(
      { error: 'Sign in to revoke API keys.' },
      { status: 401 },
    );
  }

  const { apiKeyId } = await params;
  const apiKey = await revokeApiKey({
    apiKeyId,
    userId: session.user.id,
  });

  if (!apiKey) {
    return NextResponse.json({ error: 'API key not found.' }, { status: 404 });
  }

  return NextResponse.json({ apiKey });
}
