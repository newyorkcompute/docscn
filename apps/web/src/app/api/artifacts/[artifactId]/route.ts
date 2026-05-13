import { NextResponse } from 'next/server';
import { findArtifact, listReviewThreads } from '@docscn/db';
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
  });

  if (!artifact) {
    return NextResponse.json({ error: 'Artifact not found.' }, { status: 404 });
  }

  return NextResponse.json({
    artifact,
    threads: await listReviewThreads(artifact.id),
  });
}
