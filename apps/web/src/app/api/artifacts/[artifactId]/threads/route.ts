import { NextResponse } from 'next/server';
import { createReviewThread, findArtifact } from '@docscn/db';
import type {
  ActorRole,
  CreateReviewThreadInput,
  ReviewAnchor,
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function parseAnchorKind(value: unknown): ReviewAnchor['kind'] | undefined {
  return value === 'point' || value === 'text' || value === 'element'
    ? value
    : undefined;
}

function parseAnchorRect(value: unknown): ReviewAnchor['rect'] | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const x = parseAnchorCoordinate(value['x']);
  const y = parseAnchorCoordinate(value['y']);
  const width = parseAnchorCoordinate(value['width']);
  const height = parseAnchorCoordinate(value['height']);

  return x !== undefined &&
    y !== undefined &&
    width !== undefined &&
    height !== undefined
    ? { x, y, width, height }
    : undefined;
}

function parseReviewAnchor(
  body: Record<string, unknown>,
): ReviewAnchor | undefined {
  if (isRecord(body['anchor']) && isString(body['anchor']['label'])) {
    return {
      label: body['anchor']['label'],
      kind: parseAnchorKind(body['anchor']['kind']),
      selector: isString(body['anchor']['selector'])
        ? body['anchor']['selector']
        : undefined,
      quote: isString(body['anchor']['quote'])
        ? body['anchor']['quote']
        : undefined,
      elementLabel: isString(body['anchor']['elementLabel'])
        ? body['anchor']['elementLabel']
        : undefined,
      x: parseAnchorCoordinate(body['anchor']['x']),
      y: parseAnchorCoordinate(body['anchor']['y']),
      rect: parseAnchorRect(body['anchor']['rect']),
    };
  }

  return isString(body['anchorLabel'])
    ? {
        label: body['anchorLabel'],
        kind: parseAnchorKind(body['anchorKind']) ?? 'point',
        selector: isString(body['anchorSelector'])
          ? body['anchorSelector']
          : undefined,
        quote: isString(body['anchorQuote']) ? body['anchorQuote'] : undefined,
        elementLabel: isString(body['anchorElementLabel'])
          ? body['anchorElementLabel']
          : undefined,
        x: parseAnchorCoordinate(body['anchorX']),
        y: parseAnchorCoordinate(body['anchorY']),
        rect: parseAnchorRect(body['anchorRect']),
      }
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
    anchor: parseReviewAnchor(body),
  };

  return NextResponse.json(
    { thread: await createReviewThread(input) },
    { status: 201 },
  );
}
