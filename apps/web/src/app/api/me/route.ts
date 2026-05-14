import { NextResponse } from 'next/server';
import { getRequestPrincipal, hasBearerToken } from '../../../lib/publisher';

export async function GET(request: Request) {
  const principal = await getRequestPrincipal(request);

  if (!principal) {
    return NextResponse.json(
      {
        error: hasBearerToken(request)
          ? 'Invalid API key.'
          : 'Sign in or pass a docscn API key.',
      },
      { status: 401 },
    );
  }

  return NextResponse.json({ principal });
}
