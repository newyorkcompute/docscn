import { NextResponse } from 'next/server';
import { findArtifact, listReviewThreads } from '@docscn/db';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ artifactId: string }> },
) {
  const { artifactId } = await params;
  const artifact = await findArtifact(artifactId);

  if (!artifact) {
    return NextResponse.json({ error: 'Artifact not found.' }, { status: 404 });
  }

  return NextResponse.json({
    artifact,
    threads: await listReviewThreads(artifact.id),
  });
}
