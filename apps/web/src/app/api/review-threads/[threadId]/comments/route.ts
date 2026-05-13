import { NextResponse } from 'next/server';
import {
  createReviewComment,
  findArtifact,
  findReviewThread,
} from '@docscn/db';
import type { ActorRole, CreateReviewCommentInput } from '@docscn/sdk';
import { getRequestSession } from '../../../../../lib/session';

function isString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isActorRole(value: unknown): value is ActorRole {
  return value === 'human' || value === 'agent' || value === 'system';
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ threadId: string }> },
) {
  const { threadId } = await params;
  const session = await getRequestSession(request);

  if (!session) {
    return NextResponse.json(
      { error: 'Sign in to comment on artifacts.' },
      { status: 401 },
    );
  }

  const thread = await findReviewThread(threadId);

  if (!thread) {
    return NextResponse.json(
      { error: 'Review thread not found.' },
      { status: 404 },
    );
  }

  const artifact = await findArtifact(thread.artifactId, {
    viewerUserId: session.user.id,
  });

  if (!artifact) {
    return NextResponse.json({ error: 'Artifact not found.' }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;

  if (!body || !isString(body.body) || !isString(body.authorName)) {
    return NextResponse.json(
      { error: 'Invalid review comment payload.' },
      { status: 400 },
    );
  }

  const input: CreateReviewCommentInput = {
    threadId,
    body: body.body,
    authorName: session.user.name || body.authorName,
    role: isActorRole(body.role) ? body.role : 'human',
  };

  return NextResponse.json(
    { comment: await createReviewComment(input) },
    { status: 201 },
  );
}
