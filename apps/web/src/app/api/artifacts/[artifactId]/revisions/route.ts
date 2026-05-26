import { NextResponse } from 'next/server';
import {
  canMutateArtifact,
  createArtifactRevision,
  findArtifact,
} from '@docscn/db';
import type { IntegrationSource, SubmitRevisionInput } from '@docscn/sdk';
import {
  artifactHtmlMaxBytes,
  getUtf8ByteLength,
} from '../../../../../lib/artifact-limits';
import {
  getRequestPrincipal,
  hasBearerToken,
} from '../../../../../lib/publisher';

function isString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isIntegrationSource(value: unknown): value is IntegrationSource {
  return (
    value === 'web' ||
    value === 'cli' ||
    value === 'cursor' ||
    value === 'claude' ||
    value === 'opencode' ||
    value === 'mcp' ||
    value === 'scheduled-report' ||
    value === 'automation'
  );
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
          : 'Sign in to revise artifacts.',
      },
      { status: 401 },
    );
  }

  const artifact = await findArtifact(artifactId, {
    includeUnlisted: true,
    viewerUserId: principal.userId,
    viewerEmail: principal.email,
  });

  if (!artifact) {
    return NextResponse.json({ error: 'Artifact not found.' }, { status: 404 });
  }

  if (!canMutateArtifact(artifact, principal.userId)) {
    return NextResponse.json(
      { error: 'Only the artifact owner can submit revisions.' },
      { status: 403 },
    );
  }

  const body = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;

  if (
    !body ||
    !isString(body.html) ||
    !isString(body.summary) ||
    !isString(body.authorName) ||
    !body.html.toLowerCase().includes('<html')
  ) {
    return NextResponse.json(
      { error: 'Invalid artifact revision payload.' },
      { status: 400 },
    );
  }

  if (getUtf8ByteLength(body.html) > artifactHtmlMaxBytes) {
    return NextResponse.json(
      { error: 'HTML must be 1 MB or smaller.' },
      { status: 413 },
    );
  }

  const resolvedThreadIds = Array.isArray(body.resolvedThreadIds)
    ? body.resolvedThreadIds.filter(isString)
    : [];

  const input: SubmitRevisionInput = {
    artifactId: artifact.id,
    html: body.html,
    summary: body.summary,
    authorName:
      principal.kind === 'session'
        ? principal.name || body.authorName
        : body.authorName,
    actorUserId: principal.userId,
    source: isIntegrationSource(body.source)
      ? body.source
      : principal.kind === 'api-key'
        ? 'automation'
        : 'web',
    resolvedThreadIds,
  };

  const revision = await createArtifactRevision(input);

  return NextResponse.json({ revision }, { status: 201 });
}
