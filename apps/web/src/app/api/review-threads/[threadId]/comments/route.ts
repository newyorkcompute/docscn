import { NextResponse } from 'next/server';
import { createReviewComment } from '@docscn/db';
import type { ActorRole, CreateReviewCommentInput } from '@docscn/sdk';

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
    authorName: body.authorName,
    role: isActorRole(body.role) ? body.role : 'human',
  };

  return NextResponse.json(
    { comment: await createReviewComment(input) },
    { status: 201 },
  );
}
