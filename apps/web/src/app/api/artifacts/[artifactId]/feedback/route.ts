import { NextResponse } from 'next/server';
import {
  buildAgentFeedbackContext,
  formatAgentFeedbackPrompt,
} from '@docscn/sdk';
import { findArtifact, listReviewThreads } from '@docscn/db';
import { getRequestPrincipal, hasBearerToken } from '../../../../../lib/publisher';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ artifactId: string }> },
) {
  const { artifactId } = await params;
  const revisionId = new URL(request.url).searchParams.get('revisionId');
  const principal = await getRequestPrincipal(request);

  if (!principal && hasBearerToken(request)) {
    return NextResponse.json({ error: 'Invalid API key.' }, { status: 401 });
  }

  const artifact = await findArtifact(artifactId, {
    includeUnlisted: true,
    viewerUserId: principal?.userId,
  });

  if (!artifact) {
    return NextResponse.json({ error: 'Artifact not found.' }, { status: 404 });
  }

  const targetRevisionId = revisionId ?? artifact.currentRevisionId;
  const bundle = buildAgentFeedbackContext(
    artifact,
    targetRevisionId,
    await listReviewThreads(artifact.id),
  );

  if (!bundle) {
    return NextResponse.json({ error: 'Revision not found.' }, { status: 404 });
  }

  return NextResponse.json({
    bundle,
    prompt: formatAgentFeedbackPrompt(bundle),
  });
}
