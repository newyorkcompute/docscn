import { NextResponse } from 'next/server';
import {
  canMutateArtifact,
  findArtifact,
  listReviewThreads,
  updateArtifactVisibility,
} from '@docscn/db';
import { visibilityOptions, type ArtifactVisibility } from '@docscn/sdk';
import { getRequestPrincipal, hasBearerToken } from '../../../../lib/publisher';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ artifactId: string }> },
) {
  const { artifactId } = await params;
  const principal = await getRequestPrincipal(request);

  if (!principal && hasBearerToken(request)) {
    return NextResponse.json({ error: 'Invalid API key.' }, { status: 401 });
  }

  const artifact = await findArtifact(artifactId, {
    includeUnlisted: true,
    viewerUserId: principal?.userId,
    viewerEmail: principal?.email,
  });

  if (!artifact) {
    return NextResponse.json({ error: 'Artifact not found.' }, { status: 404 });
  }

  return NextResponse.json({
    artifact,
    threads: await listReviewThreads(artifact.id),
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ artifactId: string }> },
) {
  const { artifactId } = await params;
  const principal = await getRequestPrincipal(request);

  if (!principal) {
    return NextResponse.json(
      {
        error: hasBearerToken(request)
          ? 'Invalid API key.'
          : 'Sign in to update artifact visibility.',
      },
      { status: 401 },
    );
  }

  const artifact = await findArtifact(artifactId, {
    includeUnlisted: true,
    viewerUserId: principal.userId,
    viewerEmail: principal.email,
  });

  if (!artifact) {
    return NextResponse.json({ error: 'Artifact not found.' }, { status: 404 });
  }

  if (!canMutateArtifact(artifact, principal.userId)) {
    return NextResponse.json(
      { error: 'Only the artifact owner can update visibility.' },
      { status: 403 },
    );
  }

  const body = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  const visibility = body?.visibility as ArtifactVisibility;

  if (!visibilityOptions.includes(visibility)) {
    return NextResponse.json(
      { error: 'Invalid artifact visibility.' },
      { status: 400 },
    );
  }

  const updated = await updateArtifactVisibility({
    artifactId: artifact.id,
    visibility,
  });

  return NextResponse.json({ artifact: updated });
}
