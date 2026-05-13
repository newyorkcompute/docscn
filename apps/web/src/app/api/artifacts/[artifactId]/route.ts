import { NextResponse } from 'next/server';
import { findArtifact, listReviewThreads } from '@docscn/db';
import { getRequestSession } from '../../../../lib/session';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ artifactId: string }> },
) {
  const { artifactId } = await params;
  const session = await getRequestSession(request);
  const artifact = await findArtifact(artifactId, {
    viewerUserId: session?.user.id,
  });

  if (!artifact) {
    return NextResponse.json({ error: 'Artifact not found.' }, { status: 404 });
  }

  return NextResponse.json({
    artifact,
    threads: await listReviewThreads(artifact.id),
  });
}
