import { NextResponse } from 'next/server';
import {
  canMutateArtifact,
  createArtifactRevision,
  findArtifact,
} from '@docscn/db';
import type { IntegrationSource, SubmitRevisionInput } from '@docscn/sdk';
import { getRequestSession } from '../../../../../lib/session';

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
  const session = await getRequestSession(request);

  if (!session) {
    return NextResponse.json(
      { error: 'Sign in to revise artifacts.' },
      { status: 401 },
    );
  }

  const artifact = await findArtifact(artifactId, {
    viewerUserId: session.user.id,
  });

  if (!artifact) {
    return NextResponse.json({ error: 'Artifact not found.' }, { status: 404 });
  }

  if (!canMutateArtifact(artifact, session.user.id)) {
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

  const resolvedThreadIds = Array.isArray(body.resolvedThreadIds)
    ? body.resolvedThreadIds.filter(isString)
    : [];

  const input: SubmitRevisionInput = {
    artifactId: artifact.id,
    html: body.html,
    summary: body.summary,
    authorName: session.user.name || body.authorName,
    actorUserId: session.user.id,
    source: isIntegrationSource(body.source) ? body.source : 'web',
    resolvedThreadIds,
  };

  const revision = await createArtifactRevision(input);

  return NextResponse.json({ revision }, { status: 201 });
}
