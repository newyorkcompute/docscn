import { NextResponse } from 'next/server';
import {
  canMutateArtifact,
  findArtifact,
  findReviewThread,
  updateReviewThreadStatus,
} from '@docscn/db';
import type {
  ReviewThreadStatus,
  UpdateReviewThreadStatusInput,
} from '@docscn/sdk';
import { getRequestPrincipal, hasBearerToken } from '../../../../lib/publisher';

function isReviewThreadStatus(value: unknown): value is ReviewThreadStatus {
  return value === 'open' || value === 'needs-revision' || value === 'resolved';
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ threadId: string }> },
) {
  const { threadId } = await params;
  const principal = await getRequestPrincipal(request);

  if (!principal) {
    return NextResponse.json(
      {
        error: hasBearerToken(request)
          ? 'Invalid API key.'
          : 'Sign in to update review thread status.',
      },
      { status: 401 },
    );
  }

  const existingThread = await findReviewThread(threadId);

  if (!existingThread) {
    return NextResponse.json(
      { error: 'Review thread not found.' },
      { status: 404 },
    );
  }

  const artifact = await findArtifact(existingThread.artifactId, {
    includeUnlisted: true,
    viewerUserId: principal.userId,
  });

  if (!artifact) {
    return NextResponse.json({ error: 'Artifact not found.' }, { status: 404 });
  }

  if (!canMutateArtifact(artifact, principal.userId)) {
    return NextResponse.json(
      { error: 'Only the artifact owner can update review status.' },
      { status: 403 },
    );
  }

  const body = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;

  if (!body || !isReviewThreadStatus(body.status)) {
    return NextResponse.json(
      { error: 'Invalid review thread status payload.' },
      { status: 400 },
    );
  }

  const input: UpdateReviewThreadStatusInput = {
    threadId,
    status: body.status,
  };
  const thread = await updateReviewThreadStatus(input);

  if (!thread) {
    return NextResponse.json(
      { error: 'Review thread not found.' },
      { status: 404 },
    );
  }

  return NextResponse.json({ thread });
}
