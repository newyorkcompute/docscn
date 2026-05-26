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
import {
  artifactHtmlMaxBytes,
  getUtf8ByteLength,
} from '../../../lib/artifact-limits';
import { getRequestPrincipal, hasBearerToken } from '../../../lib/publisher';
import { getClientIp, hitRateLimit } from '../../../lib/rate-limit';

const anonymousPublishLimit = 20;
const anonymousPublishWindowMs = 60 * 60 * 1000;

function isString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function hitAnonymousPublishLimit(request: Request) {
  const key = getClientIp(request);
  return hitRateLimit(
    `anonymous-publish:${key}`,
    anonymousPublishLimit,
    anonymousPublishWindowMs,
  );
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
    artifacts: await listArtifacts({
      viewerUserId: principal?.userId,
      viewerEmail: principal?.email,
    }),
  });
}

export async function POST(request: Request) {
  const principal = await getRequestPrincipal(request);

  if (!principal && hasBearerToken(request)) {
    return NextResponse.json({ error: 'Invalid API key.' }, { status: 401 });
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

  if (getUtf8ByteLength(input.html) > artifactHtmlMaxBytes) {
    return NextResponse.json(
      { error: 'HTML must be 1 MB or smaller.' },
      { status: 413 },
    );
  }

  if (!principal) {
    if (hitAnonymousPublishLimit(request)) {
      return NextResponse.json(
        {
          error:
            'Anonymous publish limit reached. Sign in to publish more artifacts.',
        },
        { status: 429 },
      );
    }
  }

  const published = await publishArtifact({
    ...input,
    visibility: principal ? input.visibility : 'unlisted',
    authorName:
      principal?.kind === 'session'
        ? principal.name || input.authorName
        : input.authorName,
    ownerUserId: principal?.userId,
  });

  return NextResponse.json(published, { status: 201 });
}
