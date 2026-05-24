import { NextResponse } from 'next/server';
import { claimAnonymousArtifacts } from '@docscn/db';
import type { AnonymousClaimReceipt } from '@docscn/sdk';
import { getRequestPrincipal, hasBearerToken } from '../../../../lib/publisher';

function isString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isReceipt(value: unknown): value is AnonymousClaimReceipt {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    isString(candidate.artifactId) &&
    isString(candidate.slug) &&
    isString(candidate.title) &&
    isString(candidate.claimToken) &&
    isString(candidate.createdAt)
  );
}

export async function POST(request: Request) {
  const principal = await getRequestPrincipal(request);

  if (!principal) {
    return NextResponse.json(
      {
        error: hasBearerToken(request)
          ? 'Invalid API key.'
          : 'Sign in to recover anonymous artifacts.',
      },
      { status: 401 },
    );
  }

  const body = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  const receipts = Array.isArray(body?.receipts)
    ? body.receipts.filter(isReceipt).slice(0, 100)
    : [];

  if (!receipts.length) {
    return NextResponse.json(
      { error: 'No valid anonymous claim receipts provided.' },
      { status: 400 },
    );
  }

  const result = await claimAnonymousArtifacts({
    receipts,
    userId: principal.userId,
  });

  return NextResponse.json(result);
}
