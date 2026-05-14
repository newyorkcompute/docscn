import { NextResponse } from 'next/server';
import { createReviewThread, findArtifact } from '@docscn/db';
import type {
  ActorRole,
  CreateReviewThreadInput,
  ReviewThreadStatus,
} from '@docscn/sdk';
import {
  getRequestPrincipal,
  hasBearerToken,
} from '../../../../../lib/publisher';

function isString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isThreadStatus(value: unknown): value is ReviewThreadStatus {
  return value === 'open' || value === 'needs-revision' || value === 'resolved';
}

function isActorRole(value: unknown): value is ActorRole {
  return value === 'human' || value === 'agent' || value === 'system';
}

function parseAnchorCoordinate(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : undefined;
}

export async function POST(
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
          : 'Sign in to review artifacts.',
      },
      { status: 401 },
    );
  }

  const artifact = await findArtifact(artifactId, {
    viewerUserId: principal.userId,
  });

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
    authorName:
      principal.kind === 'session'
        ? principal.name || body.authorName
        : body.authorName,
    authorRole: isActorRole(body.role)
      ? body.role
      : principal.kind === 'api-key'
        ? 'agent'
        : 'human',
    status: isThreadStatus(body.status) ? body.status : 'open',
    requestedChange: isString(body.requestedChange)
      ? body.requestedChange
      : undefined,
    anchor: isString(body.anchorLabel)
      ? {
          label: body.anchorLabel,
          x: parseAnchorCoordinate(body.anchorX),
          y: parseAnchorCoordinate(body.anchorY),
        }
      : undefined,
  };

  return NextResponse.json(
    { thread: await createReviewThread(input) },
    { status: 201 },
  );
}
