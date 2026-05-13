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
  createdAt: string;
  author: Actor;
  changeRequestIds: string[];
}

export interface Artifact {
  id: string;
  slug: string;
  metadata: ArtifactMetadata;
  currentRevisionId: string;
  revisions: ArtifactRevision[];
}

export interface ReviewAnchor {
  label: string;
  selector?: string;
  x?: number;
  y?: number;
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
  source: IntegrationSource;
  kind: ArtifactKind;
}

export interface CreateRevisionInput {
  artifactId: string;
  html: string;
  summary: string;
  author: Actor;
  source: IntegrationSource;
}

export interface PublishResult {
  artifactId: string;
  slug: string;
  url: string;
  revisionId: string;
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

export function slugifyArtifactTitle(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);
}
