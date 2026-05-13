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
import { getRequestSession } from '../../../../lib/session';

function isReviewThreadStatus(value: unknown): value is ReviewThreadStatus {
  return value === 'open' || value === 'needs-revision' || value === 'resolved';
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ threadId: string }> },
) {
  const { threadId } = await params;
  const session = await getRequestSession(request);

  if (!session) {
    return NextResponse.json(
      { error: 'Sign in to update review thread status.' },
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
    viewerUserId: session.user.id,
  });

  if (!artifact) {
    return NextResponse.json({ error: 'Artifact not found.' }, { status: 404 });
  }

  if (!canMutateArtifact(artifact, session.user.id)) {
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
