import { NextResponse } from 'next/server';
import {
  canMutateArtifact,
  findArtifact,
  listArtifactShares,
  removeArtifactShare,
  upsertArtifactShare,
} from '@docscn/db';
import type { ArtifactShareRole } from '@docscn/sdk';
import {
  getRequestPrincipal,
  hasBearerToken,
} from '../../../../../lib/publisher';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase() : undefined;
}

function isShareRole(value: unknown): value is ArtifactShareRole {
  return value === 'viewer' || value === 'commenter';
}

async function getOwnedArtifact(request: Request, artifactId: string) {
  const principal = await getRequestPrincipal(request);

  if (!principal) {
    return {
      response: NextResponse.json(
        {
          error: hasBearerToken(request)
            ? 'Invalid API key.'
            : 'Sign in to manage sharing.',
        },
        { status: 401 },
      ),
    };
  }

  const artifact = await findArtifact(artifactId, {
    includeUnlisted: true,
    viewerUserId: principal.userId,
    viewerEmail: principal.email,
  });

  if (!artifact) {
    return {
      response: NextResponse.json(
        { error: 'Artifact not found.' },
        { status: 404 },
      ),
    };
  }

  if (!canMutateArtifact(artifact, principal.userId)) {
    return {
      response: NextResponse.json(
        { error: 'Only the artifact owner can manage sharing.' },
        { status: 403 },
      ),
    };
  }

  return { artifact, principal };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ artifactId: string }> },
) {
  const { artifactId } = await params;
  const result = await getOwnedArtifact(request, artifactId);

  if ('response' in result) {
    return result.response;
  }

  return NextResponse.json({
    shares: await listArtifactShares(result.artifact.id),
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ artifactId: string }> },
) {
  const { artifactId } = await params;
  const result = await getOwnedArtifact(request, artifactId);

  if ('response' in result) {
    return result.response;
  }

  const body = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  const email = normalizeEmail(body?.email);
  const role = body?.role;

  if (!email || !emailPattern.test(email) || !isShareRole(role)) {
    return NextResponse.json(
      { error: 'Enter a valid email and share role.' },
      { status: 400 },
    );
  }

  if (email === result.principal.email?.toLowerCase()) {
    return NextResponse.json(
      { error: 'The owner already has full access.' },
      { status: 400 },
    );
  }

  const share = await upsertArtifactShare({
    artifactId: result.artifact.id,
    email,
    role,
    invitedByUserId: result.principal.userId,
  });

  return NextResponse.json({ share }, { status: 201 });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ artifactId: string }> },
) {
  const { artifactId } = await params;
  const result = await getOwnedArtifact(request, artifactId);

  if ('response' in result) {
    return result.response;
  }

  const body = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  const email = normalizeEmail(body?.email);

  if (!email) {
    return NextResponse.json(
      { error: 'Enter an email to remove.' },
      { status: 400 },
    );
  }

  await removeArtifactShare({ artifactId: result.artifact.id, email });

  return NextResponse.json({ ok: true });
}
