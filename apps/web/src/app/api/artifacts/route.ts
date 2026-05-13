import { NextResponse } from 'next/server';
import { listArtifacts, publishArtifact } from '@docscn/db';
import {
  artifactKinds,
  type ArtifactKind,
  type ArtifactVisibility,
  type CreateArtifactInput,
  type IntegrationSource,
  visibilityOptions,
} from '@docscn/sdk';
import { getRequestSession } from '../../../lib/session';

function isString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function parseCreateArtifactInput(
  body: unknown,
): CreateArtifactInput | undefined {
  if (!body || typeof body !== 'object') {
    return undefined;
  }

  const candidate = body as Record<string, unknown>;

  if (
    !isString(candidate.title) ||
    !isString(candidate.description) ||
    !isString(candidate.html) ||
    !isString(candidate.authorName)
  ) {
    return undefined;
  }

  const visibility = candidate.visibility as ArtifactVisibility;
  const kind = candidate.kind as ArtifactKind;
  const source = (candidate.source ?? 'web') as IntegrationSource;

  if (
    !visibilityOptions.includes(visibility) ||
    !artifactKinds.includes(kind)
  ) {
    return undefined;
  }

  if (!candidate.html.toLowerCase().includes('<html')) {
    return undefined;
  }

  return {
    title: candidate.title,
    description: candidate.description,
    html: candidate.html,
    visibility,
    authorName: candidate.authorName,
    source,
    kind,
  };
}

export async function GET(request: Request) {
  const session = await getRequestSession(request);

  return NextResponse.json({
    artifacts: await listArtifacts({ viewerUserId: session?.user.id }),
  });
}

export async function POST(request: Request) {
  const session = await getRequestSession(request);

  if (!session) {
    return NextResponse.json(
      { error: 'Sign in to publish artifacts.' },
      { status: 401 },
    );
  }

  const input = parseCreateArtifactInput(
    await request.json().catch(() => null),
  );

  if (!input) {
    return NextResponse.json(
      { error: 'Invalid artifact publish payload.' },
      { status: 400 },
    );
  }

  const published = await publishArtifact({
    ...input,
    authorName: session.user.name || input.authorName,
    ownerUserId: session.user.id,
  });

  return NextResponse.json(published, { status: 201 });
}
