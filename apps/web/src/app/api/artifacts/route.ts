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
import { getRequestPrincipal, hasBearerToken } from '../../../lib/publisher';

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
  const principal = await getRequestPrincipal(request);

  if (!principal && hasBearerToken(request)) {
    return NextResponse.json({ error: 'Invalid API key.' }, { status: 401 });
  }

  return NextResponse.json({
    artifacts: await listArtifacts({ viewerUserId: principal?.userId }),
  });
}

export async function POST(request: Request) {
  const principal = await getRequestPrincipal(request);

  if (!principal) {
    return NextResponse.json(
      {
        error: hasBearerToken(request)
          ? 'Invalid API key.'
          : 'Sign in to publish artifacts.',
      },
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
    authorName:
      principal.kind === 'session'
        ? principal.name || input.authorName
        : input.authorName,
    ownerUserId: principal.userId,
  });

  return NextResponse.json(published, { status: 201 });
}
