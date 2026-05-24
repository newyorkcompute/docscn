export type ArtifactVisibility = 'public' | 'private' | 'unlisted';

export type ArtifactKind =
  | 'incident-timeline'
  | 'migration-plan'
  | 'generated-dashboard'
  | 'architecture-explainer'
  | 'animated-report'
  | 'ui-prototype'
  | 'pr-review'
  | 'custom-html';

export type ActorRole = 'human' | 'agent' | 'system';

export type ReviewThreadStatus = 'open' | 'resolved' | 'needs-revision';

export type IntegrationSource =
  | 'web'
  | 'cli'
  | 'cursor'
  | 'claude'
  | 'opencode'
  | 'mcp'
  | 'scheduled-report'
  | 'automation';

export interface Actor {
  id: string;
  name: string;
  role: ActorRole;
  handle?: string;
  avatarFallback: string;
}

export interface ArtifactMetadata {
  title: string;
  description: string;
  author: Actor;
  createdAt: string;
  visibility: ArtifactVisibility;
  kind: ArtifactKind;
  tags: string[];
  source: IntegrationSource;
}

export interface ArtifactRevision {
  id: string;
  version: number;
  summary: string;
  html: string;
  htmlObjectKey?: string;
  createdAt: string;
  author: Actor;
  changeRequestIds: string[];
}

export interface Artifact {
  id: string;
  slug: string;
  ownerUserId?: string;
  metadata: ArtifactMetadata;
  currentRevisionId: string;
  revisions: ArtifactRevision[];
}

export interface ReviewAnchor {
  label: string;
  kind?: 'point' | 'text' | 'element';
  selector?: string;
  quote?: string;
  elementLabel?: string;
  x?: number;
  y?: number;
  rect?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface ReviewComment {
  id: string;
  body: string;
  author: Actor;
  createdAt: string;
  role: ActorRole;
}

export interface ReviewThread {
  id: string;
  artifactId: string;
  revisionId: string;
  status: ReviewThreadStatus;
  title: string;
  anchor?: ReviewAnchor;
  requestedChange?: string;
  comments: ReviewComment[];
}

export interface CreateArtifactInput {
  title: string;
  description: string;
  html: string;
  visibility: ArtifactVisibility;
  authorName: string;
  ownerUserId?: string;
  source: IntegrationSource;
  kind: ArtifactKind;
}

export interface AnonymousClaimReceipt {
  artifactId: string;
  slug: string;
  title: string;
  claimToken: string;
  createdAt: string;
}

export interface ClaimArtifactsInput {
  receipts: AnonymousClaimReceipt[];
  userId: string;
}

export interface ClaimArtifactsResult {
  claimed: Array<{
    artifactId: string;
    slug: string;
  }>;
  skipped: Array<{
    artifactId: string;
    reason: 'already-owned' | 'expired-token' | 'invalid-token' | 'not-found';
  }>;
}

export interface CreateRevisionInput {
  artifactId: string;
  html: string;
  summary: string;
  author: Actor;
  source: IntegrationSource;
}

export interface SubmitRevisionInput {
  artifactId: string;
  html: string;
  summary: string;
  authorName: string;
  actorUserId?: string;
  source: IntegrationSource;
  resolvedThreadIds?: string[];
}

export interface CreateReviewThreadInput {
  artifactId: string;
  revisionId: string;
  title: string;
  body: string;
  authorName: string;
  authorRole?: ActorRole;
  status: ReviewThreadStatus;
  requestedChange?: string;
  anchor?: ReviewAnchor;
}

export interface CreateReviewCommentInput {
  threadId: string;
  body: string;
  authorName: string;
  role?: ActorRole;
}

export interface UpdateReviewThreadStatusInput {
  threadId: string;
  status: ReviewThreadStatus;
}

export interface ApiKey {
  id: string;
  userId: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt?: string;
  revokedAt?: string;
}

export interface CreateApiKeyInput {
  userId: string;
  name: string;
}

export interface CreatedApiKey {
  apiKey: ApiKey;
  token: string;
}

export interface ApiKeyPrincipal {
  apiKeyId: string;
  userId: string;
  name: string;
}

export interface CliLoginRequest {
  deviceCode: string;
  userCode: string;
  expiresAt: string;
  intervalSeconds: number;
}

export interface CliLoginApproval {
  userCode: string;
  status: 'approved' | 'expired' | 'not-found' | 'already-consumed';
}

export interface CliLoginPollResult {
  status: 'pending' | 'approved' | 'expired' | 'not-found' | 'already-consumed';
  token?: string;
  apiKey?: ApiKey;
}

export interface PublishResult {
  artifactId: string;
  slug: string;
  url: string;
  revisionId: string;
  claimToken?: string;
}

export interface AgentFeedbackBundle {
  artifactId: string;
  revisionId: string;
  openThreads: Array<{
    id: string;
    title: string;
    requestedChange?: string;
    comments: string[];
    anchor?: ReviewAnchor;
  }>;
}

export const artifactKinds: ArtifactKind[] = [
  'incident-timeline',
  'migration-plan',
  'generated-dashboard',
  'architecture-explainer',
  'animated-report',
  'ui-prototype',
  'pr-review',
  'custom-html',
];

export const visibilityOptions: ArtifactVisibility[] = [
  'public',
  'unlisted',
  'private',
];

export interface AgentFeedbackContext {
  artifact: {
    id: string;
    slug: string;
    title: string;
    description: string;
    visibility: ArtifactVisibility;
    kind: ArtifactKind;
  };
  revision: {
    id: string;
    version: number;
    summary: string;
  };
  instructions: {
    goal: string;
    constraints: string[];
  };
  openThreads: Array<{
    id: string;
    status: ReviewThreadStatus;
    title: string;
    anchor?: ReviewAnchor;
    requestedChange?: string;
    comments: Array<{
      author: string;
      role: ActorRole;
      body: string;
    }>;
  }>;
}

const agentFeedbackInstructions = {
  goal: 'Revise the self-contained HTML artifact using the review feedback.',
  constraints: [
    'Return a complete self-contained HTML document.',
    'Preserve useful existing interactions unless feedback asks to change them.',
    'Address each requested change explicitly.',
  ],
} as const;

export function buildAgentFeedbackContext(
  artifact: Artifact,
  revisionId: string,
  threads: ReviewThread[],
): AgentFeedbackContext | undefined {
  const revision = artifact.revisions.find(
    (candidate) => candidate.id === revisionId,
  );

  if (!revision) {
    return undefined;
  }

  const openThreads = threads.filter(
    (thread) =>
      thread.revisionId === revisionId && thread.status !== 'resolved',
  );

  return {
    artifact: {
      id: artifact.id,
      slug: artifact.slug,
      title: artifact.metadata.title,
      description: artifact.metadata.description,
      visibility: artifact.metadata.visibility,
      kind: artifact.metadata.kind,
    },
    revision: {
      id: revision.id,
      version: revision.version,
      summary: revision.summary,
    },
    instructions: {
      goal: agentFeedbackInstructions.goal,
      constraints: [...agentFeedbackInstructions.constraints],
    },
    openThreads: openThreads.map((thread) => ({
      id: thread.id,
      status: thread.status,
      title: thread.title,
      anchor: thread.anchor,
      requestedChange: thread.requestedChange,
      comments: thread.comments.map((comment) => ({
        author: comment.author.name,
        role: comment.role,
        body: comment.body,
      })),
    })),
  };
}

export function formatAgentFeedbackPrompt(context: AgentFeedbackContext) {
  return [
    `Revise "${context.artifact.title}" from revision v${context.revision.version}.`,
    '',
    context.openThreads.length
      ? 'Address these open review threads:'
      : 'There are no open review threads. Improve clarity without changing the intent.',
    ...context.openThreads.flatMap((thread, index) => [
      '',
      `${index + 1}. ${thread.title} (${thread.status})`,
      thread.requestedChange
        ? `Requested change: ${thread.requestedChange}`
        : 'Requested change: infer from comments.',
      ...thread.comments.map(
        (comment) => `- ${comment.author} (${comment.role}): ${comment.body}`,
      ),
    ]),
    '',
    'Return only a complete self-contained HTML document.',
  ].join('\n');
}

export function formatAgentFeedbackJson(context: AgentFeedbackContext) {
  return JSON.stringify(context, null, 2);
}

export function slugifyArtifactTitle(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);
}
