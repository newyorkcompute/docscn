import { randomUUID } from 'node:crypto';
import { eq, or } from 'drizzle-orm';
import type {
  Actor,
  AgentFeedbackBundle,
  Artifact,
  ArtifactRevision,
  CreateArtifactInput,
  PublishResult,
  ReviewComment,
  ReviewThread,
} from '@docscn/sdk';
import { slugifyArtifactTitle } from '@docscn/sdk';
import { getDb, isDatabaseConfigured } from './client';
import {
  artifactRevisions,
  artifacts,
  reviewComments,
  reviewThreads,
} from './schema';
import {
  getAgentFeedbackBundle as getMockAgentFeedbackBundle,
  getArtifactById as getMockArtifactById,
  getArtifacts as getMockArtifacts,
  getReviewThreads as getMockReviewThreads,
} from './db';

const runtimeArtifacts: Artifact[] = [];
const runtimeThreads: ReviewThread[] = [];

function createPublishActor(input: CreateArtifactInput): Actor {
  const trimmedName = input.authorName.trim() || 'Agent';

  return {
    id: `actor-${slugifyArtifactTitle(trimmedName) || 'agent'}`,
    name: trimmedName,
    role: input.source === 'web' ? 'human' : 'agent',
    avatarFallback: trimmedName.slice(0, 2).toUpperCase() || 'AI',
  };
}

function createPublishedArtifact(input: CreateArtifactInput): Artifact {
  const now = new Date().toISOString();
  const id = `artifact-${randomUUID()}`;
  const revisionId = `revision-${randomUUID()}`;
  const slugBase = slugifyArtifactTitle(input.title) || 'untitled-artifact';
  const author = createPublishActor(input);

  return {
    id,
    slug: `${slugBase}-${id.slice(-8)}`,
    currentRevisionId: revisionId,
    metadata: {
      title: input.title.trim(),
      description: input.description.trim(),
      author,
      createdAt: now,
      visibility: input.visibility,
      kind: input.kind,
      tags: ['published'],
      source: input.source,
    },
    revisions: [
      {
        id: revisionId,
        version: 1,
        summary: 'Published from docscn.',
        html: input.html,
        createdAt: now,
        author,
        changeRequestIds: [],
      },
    ],
  };
}

function mapArtifactRows(
  artifactRows: (typeof artifacts.$inferSelect)[],
  revisionRows: (typeof artifactRevisions.$inferSelect)[],
): Artifact[] {
  return artifactRows.map((artifact) => ({
    id: artifact.id,
    slug: artifact.slug,
    currentRevisionId: artifact.currentRevisionId,
    metadata: {
      title: artifact.title,
      description: artifact.description,
      author: artifact.author,
      createdAt: artifact.createdAt,
      visibility: artifact.visibility,
      kind: artifact.kind,
      tags: artifact.tags,
      source: artifact.source,
    },
    revisions: revisionRows
      .filter((revision) => revision.artifactId === artifact.id)
      .map<ArtifactRevision>((revision) => ({
        id: revision.id,
        version: revision.version,
        summary: revision.summary,
        html: revision.html,
        createdAt: revision.createdAt,
        author: revision.author,
        changeRequestIds: revision.changeRequestIds,
      })),
  }));
}

function mapThreadRows(
  threadRows: (typeof reviewThreads.$inferSelect)[],
  commentRows: (typeof reviewComments.$inferSelect)[],
): ReviewThread[] {
  return threadRows.map((thread) => ({
    id: thread.id,
    artifactId: thread.artifactId,
    revisionId: thread.revisionId,
    status: thread.status,
    title: thread.title,
    anchor: thread.anchor ?? undefined,
    requestedChange: thread.requestedChange ?? undefined,
    comments: commentRows
      .filter((comment) => comment.threadId === thread.id)
      .map<ReviewComment>((comment) => ({
        id: comment.id,
        body: comment.body,
        author: comment.author,
        createdAt: comment.createdAt,
        role: comment.role,
      })),
  }));
}

export async function listArtifacts(): Promise<Artifact[]> {
  if (!isDatabaseConfigured()) {
    return [...runtimeArtifacts, ...getMockArtifacts()];
  }

  const db = getDb();
  const [artifactRows, revisionRows] = await Promise.all([
    db.select().from(artifacts),
    db.select().from(artifactRevisions),
  ]);

  return mapArtifactRows(artifactRows, revisionRows);
}

export async function findArtifact(
  idOrSlug: string,
): Promise<Artifact | undefined> {
  const runtimeArtifact = runtimeArtifacts.find(
    (artifact) => artifact.id === idOrSlug || artifact.slug === idOrSlug,
  );

  if (runtimeArtifact) {
    return runtimeArtifact;
  }

  if (!isDatabaseConfigured()) {
    return getMockArtifactById(idOrSlug);
  }

  const db = getDb();
  const artifactRows = await db
    .select()
    .from(artifacts)
    .where(or(eq(artifacts.id, idOrSlug), eq(artifacts.slug, idOrSlug)))
    .limit(1);
  const artifact = artifactRows[0];

  if (!artifact) {
    return undefined;
  }

  const revisionRows = await db
    .select()
    .from(artifactRevisions)
    .where(eq(artifactRevisions.artifactId, artifact.id));

  return mapArtifactRows([artifact], revisionRows)[0];
}

export async function listReviewThreads(
  artifactId: string,
): Promise<ReviewThread[]> {
  if (!isDatabaseConfigured()) {
    return [
      ...runtimeThreads.filter((thread) => thread.artifactId === artifactId),
      ...getMockReviewThreads(artifactId),
    ];
  }

  const db = getDb();
  const threadRows = await db
    .select()
    .from(reviewThreads)
    .where(eq(reviewThreads.artifactId, artifactId));
  const commentRows = threadRows.length
    ? await db.select().from(reviewComments)
    : [];

  return mapThreadRows(threadRows, commentRows);
}

export async function publishArtifact(input: CreateArtifactInput): Promise<{
  artifact: Artifact;
  result: PublishResult;
}> {
  const artifact = createPublishedArtifact(input);
  const revision = artifact.revisions[0];

  if (!revision) {
    throw new Error('Published artifact must include an initial revision.');
  }

  if (!isDatabaseConfigured()) {
    runtimeArtifacts.unshift(artifact);

    return {
      artifact,
      result: {
        artifactId: artifact.id,
        slug: artifact.slug,
        url: `/artifacts/${artifact.slug}`,
        revisionId: revision.id,
      },
    };
  }

  const db = getDb();
  await db.insert(artifacts).values({
    id: artifact.id,
    slug: artifact.slug,
    title: artifact.metadata.title,
    description: artifact.metadata.description,
    author: artifact.metadata.author,
    createdAt: artifact.metadata.createdAt,
    visibility: artifact.metadata.visibility,
    kind: artifact.metadata.kind,
    tags: artifact.metadata.tags,
    source: artifact.metadata.source,
    currentRevisionId: artifact.currentRevisionId,
  });
  await db.insert(artifactRevisions).values({
    id: revision.id,
    artifactId: artifact.id,
    version: revision.version,
    summary: revision.summary,
    html: revision.html,
    createdAt: revision.createdAt,
    author: revision.author,
    changeRequestIds: revision.changeRequestIds,
  });

  return {
    artifact,
    result: {
      artifactId: artifact.id,
      slug: artifact.slug,
      url: `/artifacts/${artifact.slug}`,
      revisionId: revision.id,
    },
  };
}

export async function getAgentFeedbackBundle(
  artifactId: string,
  revisionId: string,
): Promise<AgentFeedbackBundle> {
  if (!isDatabaseConfigured()) {
    return getMockAgentFeedbackBundle(artifactId, revisionId);
  }

  const openThreads = (await listReviewThreads(artifactId)).filter(
    (thread) =>
      thread.revisionId === revisionId && thread.status !== 'resolved',
  );

  return {
    artifactId,
    revisionId,
    openThreads: openThreads.map((thread) => ({
      id: thread.id,
      title: thread.title,
      requestedChange: thread.requestedChange,
      comments: thread.comments.map((comment) => comment.body),
      anchor: thread.anchor,
    })),
  };
}
