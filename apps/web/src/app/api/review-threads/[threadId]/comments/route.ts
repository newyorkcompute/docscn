import { NextResponse } from 'next/server';
import {
  canCommentOnArtifact,
  createReviewComment,
  findArtifact,
  findReviewThread,
} from '@docscn/db';
import type { ActorRole, CreateReviewCommentInput } from '@docscn/sdk';
import {
  getRequestPrincipal,
  hasBearerToken,
} from '../../../../../lib/publisher';

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
  const principal = await getRequestPrincipal(request);

  if (!principal) {
    return NextResponse.json(
      {
        error: hasBearerToken(request)
          ? 'Invalid API key.'
          : 'Sign in to comment on artifacts.',
      },
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
    includeUnlisted: true,
    viewerUserId: principal.userId,
    viewerEmail: principal.email,
  });

  if (!artifact) {
    return NextResponse.json({ error: 'Artifact not found.' }, { status: 404 });
  }

  if (
    !(await canCommentOnArtifact(artifact, {
      includeUnlisted: true,
      viewerUserId: principal.userId,
      viewerEmail: principal.email,
    }))
  ) {
    return NextResponse.json(
      { error: 'You need commenter access to comment on this artifact.' },
      { status: 403 },
    );
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
    authorName:
      principal.kind === 'session'
        ? principal.name || body.authorName
        : body.authorName,
    role: isActorRole(body.role)
      ? body.role
      : principal.kind === 'api-key'
        ? 'agent'
        : 'human',
  };

  return NextResponse.json(
    { comment: await createReviewComment(input) },
    { status: 201 },
  );
}
