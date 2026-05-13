import { NextResponse } from 'next/server';
import { createReviewThread, findArtifact } from '@docscn/db';
import type { CreateReviewThreadInput, ReviewThreadStatus } from '@docscn/sdk';

function isString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isThreadStatus(value: unknown): value is ReviewThreadStatus {
  return value === 'open' || value === 'needs-revision' || value === 'resolved';
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ artifactId: string }> },
) {
  const { artifactId } = await params;
  const artifact = await findArtifact(artifactId);

  if (!artifact) {
    return NextResponse.json({ error: 'Artifact not found.' }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;

  if (
    !body ||
    !isString(body.title) ||
    !isString(body.body) ||
    !isString(body.authorName)
  ) {
    return NextResponse.json(
      { error: 'Invalid review thread payload.' },
      { status: 400 },
    );
  }

  const input: CreateReviewThreadInput = {
    artifactId: artifact.id,
    revisionId: isString(body.revisionId)
      ? body.revisionId
      : artifact.currentRevisionId,
    title: body.title,
    body: body.body,
    authorName: body.authorName,
    status: isThreadStatus(body.status) ? body.status : 'open',
    requestedChange: isString(body.requestedChange)
      ? body.requestedChange
      : undefined,
    anchor: isString(body.anchorLabel)
      ? { label: body.anchorLabel }
      : undefined,
  };

  return NextResponse.json(
    { thread: await createReviewThread(input) },
    { status: 201 },
  );
}
