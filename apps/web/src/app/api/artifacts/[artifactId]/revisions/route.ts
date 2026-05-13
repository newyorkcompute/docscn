import { NextResponse } from 'next/server';
import { createArtifactRevision, findArtifact } from '@docscn/db';
import type { IntegrationSource, SubmitRevisionInput } from '@docscn/sdk';

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
  const artifact = await findArtifact(artifactId);

  if (!artifact) {
    return NextResponse.json({ error: 'Artifact not found.' }, { status: 404 });
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
    authorName: body.authorName,
    source: isIntegrationSource(body.source) ? body.source : 'web',
    resolvedThreadIds,
  };

  const revision = await createArtifactRevision(input);

  return NextResponse.json({ revision }, { status: 201 });
}
