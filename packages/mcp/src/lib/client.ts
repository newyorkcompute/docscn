import type {
  AgentFeedbackContext,
  AnonymousClaimReceipt,
  Artifact,
  ArtifactKind,
  ArtifactRevision,
  ArtifactShare,
  ArtifactShareRole,
  ArtifactVisibility,
  ClaimArtifactsResult,
  CreateArtifactInput,
  PublishResult,
  ReviewAnchor,
  ReviewComment,
  ReviewThread,
  ReviewThreadStatus,
} from '@docscn/sdk';
import type { DocscnCredentials } from './credentials.js';
import {
  getAnonymousClaimReceipts,
  removeAnonymousClaimReceipts,
  saveAnonymousClaimReceipt,
} from './credentials.js';

interface ApiErrorResponse {
  error?: string;
}

interface PublishArtifactResponse extends ApiErrorResponse {
  artifact?: unknown;
  result?: PublishResult;
}

interface ArtifactFeedbackResponse extends ApiErrorResponse {
  bundle?: AgentFeedbackContext;
  prompt?: string;
}

interface SubmitRevisionResponse extends ApiErrorResponse {
  revision?: ArtifactRevision;
}

interface ListArtifactsResponse extends ApiErrorResponse {
  artifacts?: Artifact[];
}

interface GetArtifactResponse extends ApiErrorResponse {
  artifact?: Artifact;
  threads?: ReviewThread[];
}

interface CreateThreadResponse extends ApiErrorResponse {
  thread?: ReviewThread;
}

interface CreateCommentResponse extends ApiErrorResponse {
  comment?: ReviewComment;
}

interface UpdateThreadResponse extends ApiErrorResponse {
  thread?: ReviewThread;
}

interface ClaimArtifactsResponse extends ApiErrorResponse {
  claimed?: ClaimArtifactsResult['claimed'];
  skipped?: ClaimArtifactsResult['skipped'];
}

interface MeResponse extends ApiErrorResponse {
  principal?: {
    userId: string;
    name?: string;
    apiKeyId?: string;
    kind: 'session' | 'api-key';
  };
}

interface SharesResponse extends ApiErrorResponse {
  shares?: ArtifactShare[];
}

interface ShareResponse extends ApiErrorResponse {
  share?: ArtifactShare;
}

interface VisibilityResponse extends ApiErrorResponse {
  artifact?: Artifact;
}

async function readJsonResponse<T>(response: Response): Promise<T | null> {
  return response.json().catch(() => null) as Promise<T | null>;
}

function requireApiKey(credentials: DocscnCredentials, operation: string) {
  if (!credentials.apiKey) {
    throw new Error(
      `${operation} requires a docscn API key. Run "docscn login --host ${credentials.baseUrl}" or set DOCSCN_API_KEY.`,
    );
  }

  return credentials.apiKey;
}

function buildArtifactUrl(baseUrl: string, pathOrUrl: string) {
  return pathOrUrl.startsWith('http') ? pathOrUrl : `${baseUrl}${pathOrUrl}`;
}

export interface PublishArtifactRequest {
  title: string;
  description: string;
  html: string;
  visibility?: ArtifactVisibility;
  kind?: ArtifactKind;
  authorName?: string;
}

export interface GetFeedbackRequest {
  artifactIdOrSlug: string;
  revisionId?: string;
}

export interface SubmitRevisionRequest {
  artifactIdOrSlug: string;
  html: string;
  summary: string;
  resolvedThreadIds?: string[];
  authorName?: string;
}

export interface CreateThreadRequest {
  artifactIdOrSlug: string;
  title: string;
  body: string;
  authorName?: string;
  status?: ReviewThreadStatus;
  requestedChange?: string;
  revisionId?: string;
  anchorLabel?: string;
  anchorKind?: ReviewAnchor['kind'];
  anchorX?: number;
  anchorY?: number;
  anchor?: ReviewAnchor;
}

export interface AddCommentRequest {
  threadId: string;
  body: string;
  authorName?: string;
}

export interface UpdateThreadStatusRequest {
  threadId: string;
  status: ReviewThreadStatus;
}

export interface ClaimArtifactsRequest {
  receipts?: AnonymousClaimReceipt[];
}

export interface ShareArtifactRequest {
  artifactIdOrSlug: string;
  email: string;
  role?: ArtifactShareRole;
}

export interface RemoveArtifactShareRequest {
  artifactIdOrSlug: string;
  email: string;
}

export interface UpdateArtifactVisibilityRequest {
  artifactIdOrSlug: string;
  visibility: ArtifactVisibility;
}

export function createDocscnApiClient(credentials: DocscnCredentials) {
  async function apiFetch<T>(
    path: string,
    init: RequestInit = {},
    options: { requireAuth?: boolean } = {},
  ) {
    if (options.requireAuth) {
      requireApiKey(credentials, 'This operation');
    }

    const response = await fetch(`${credentials.baseUrl}${path}`, {
      ...init,
      headers: {
        ...(credentials.apiKey
          ? { authorization: `Bearer ${credentials.apiKey}` }
          : {}),
        'content-type': 'application/json',
        ...init.headers,
      },
    });
    const payload = await readJsonResponse<T & ApiErrorResponse>(response);

    if (!response.ok) {
      throw new Error(
        payload?.error ?? `Request failed with ${response.status}.`,
      );
    }

    return payload as T;
  }

  return {
    async publishArtifact(input: PublishArtifactRequest) {
      if (!input.html.toLowerCase().includes('<html')) {
        throw new Error(
          'Artifact HTML must be a self-contained document including <html>.',
        );
      }
      const visibility = input.visibility ?? 'unlisted';

      if (!credentials.apiKey && visibility !== 'unlisted') {
        throw new Error(
          `Anonymous MCP publish only supports unlisted artifacts. Run "docscn login --host ${credentials.baseUrl}" or set DOCSCN_API_KEY to publish ${visibility} artifacts.`,
        );
      }

      const payload: CreateArtifactInput = {
        title: input.title,
        description: input.description,
        html: input.html,
        visibility,
        authorName: input.authorName ?? 'docscn MCP',
        source: 'mcp',
        kind: input.kind ?? 'custom-html',
      };

      const result = await apiFetch<PublishArtifactResponse>('/api/artifacts', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!result.result) {
        throw new Error('Publish response did not include artifact details.');
      }

      if (!credentials.apiKey && result.result.claimToken) {
        await saveAnonymousClaimReceipt(credentials.baseUrl, {
          artifactId: result.result.artifactId,
          slug: result.result.slug,
          title: input.title,
          claimToken: result.result.claimToken,
          createdAt: new Date().toISOString(),
        });
      }

      return {
        ...result.result,
        url: buildArtifactUrl(credentials.baseUrl, result.result.url),
        claimReceiptSaved: Boolean(
          !credentials.apiKey && result.result.claimToken,
        ),
      };
    },

    async listArtifacts() {
      const result = await apiFetch<ListArtifactsResponse>('/api/artifacts');

      return result.artifacts ?? [];
    },

    async getArtifact(artifactIdOrSlug: string) {
      const result = await apiFetch<GetArtifactResponse>(
        `/api/artifacts/${encodeURIComponent(artifactIdOrSlug)}`,
      );

      if (!result.artifact) {
        throw new Error('Artifact response did not include artifact details.');
      }

      return {
        artifact: result.artifact,
        threads: result.threads ?? [],
      };
    },

    async listArtifactShares(artifactIdOrSlug: string) {
      const result = await apiFetch<SharesResponse>(
        `/api/artifacts/${encodeURIComponent(artifactIdOrSlug)}/shares`,
        {},
        { requireAuth: true },
      );

      return result.shares ?? [];
    },

    async shareArtifact(input: ShareArtifactRequest) {
      requireApiKey(credentials, 'Sharing artifacts');

      const result = await apiFetch<ShareResponse>(
        `/api/artifacts/${encodeURIComponent(input.artifactIdOrSlug)}/shares`,
        {
          method: 'POST',
          body: JSON.stringify({
            email: input.email,
            role: input.role ?? 'viewer',
          }),
        },
        { requireAuth: true },
      );

      if (!result.share) {
        throw new Error('Share response did not include share details.');
      }

      return result.share;
    },

    async removeArtifactShare(input: RemoveArtifactShareRequest) {
      requireApiKey(credentials, 'Removing artifact shares');

      await apiFetch<{ ok?: boolean }>(
        `/api/artifacts/${encodeURIComponent(input.artifactIdOrSlug)}/shares`,
        {
          method: 'DELETE',
          body: JSON.stringify({ email: input.email }),
        },
        { requireAuth: true },
      );

      return { ok: true };
    },

    async updateArtifactVisibility(input: UpdateArtifactVisibilityRequest) {
      requireApiKey(credentials, 'Updating artifact visibility');

      const result = await apiFetch<VisibilityResponse>(
        `/api/artifacts/${encodeURIComponent(input.artifactIdOrSlug)}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ visibility: input.visibility }),
        },
        { requireAuth: true },
      );

      if (!result.artifact) {
        throw new Error(
          'Visibility response did not include artifact details.',
        );
      }

      return result.artifact;
    },

    async getFeedback(input: GetFeedbackRequest) {
      const query = input.revisionId
        ? `?revisionId=${encodeURIComponent(input.revisionId)}`
        : '';

      const result = await apiFetch<ArtifactFeedbackResponse>(
        `/api/artifacts/${encodeURIComponent(input.artifactIdOrSlug)}/feedback${query}`,
      );

      if (!result.bundle || !result.prompt) {
        throw new Error('Feedback response did not include bundle details.');
      }

      return {
        bundle: result.bundle,
        prompt: result.prompt,
      };
    },

    async submitRevision(input: SubmitRevisionRequest) {
      requireApiKey(credentials, 'Submitting revisions');

      if (!input.html.toLowerCase().includes('<html')) {
        throw new Error(
          'Revision HTML must be a self-contained document including <html>.',
        );
      }

      const result = await apiFetch<SubmitRevisionResponse>(
        `/api/artifacts/${encodeURIComponent(input.artifactIdOrSlug)}/revisions`,
        {
          method: 'POST',
          body: JSON.stringify({
            html: input.html,
            summary: input.summary,
            authorName: input.authorName ?? 'docscn MCP',
            source: 'mcp',
            resolvedThreadIds: input.resolvedThreadIds ?? [],
          }),
        },
        { requireAuth: true },
      );

      if (!result.revision) {
        throw new Error('Revision response did not include revision details.');
      }

      return result.revision;
    },

    async createThread(input: CreateThreadRequest) {
      requireApiKey(credentials, 'Creating review threads');

      const result = await apiFetch<CreateThreadResponse>(
        `/api/artifacts/${encodeURIComponent(input.artifactIdOrSlug)}/threads`,
        {
          method: 'POST',
          body: JSON.stringify({
            title: input.title,
            body: input.body,
            authorName: input.authorName ?? 'docscn MCP',
            role: 'agent',
            status: input.status ?? 'open',
            requestedChange: input.requestedChange,
            revisionId: input.revisionId,
            anchorLabel: input.anchorLabel,
            anchorKind: input.anchorKind,
            anchorX: input.anchorX,
            anchorY: input.anchorY,
            anchor: input.anchor,
          }),
        },
        { requireAuth: true },
      );

      if (!result.thread) {
        throw new Error('Thread response did not include thread details.');
      }

      return result.thread;
    },

    async addComment(input: AddCommentRequest) {
      requireApiKey(credentials, 'Adding review comments');

      const result = await apiFetch<CreateCommentResponse>(
        `/api/review-threads/${encodeURIComponent(input.threadId)}/comments`,
        {
          method: 'POST',
          body: JSON.stringify({
            body: input.body,
            authorName: input.authorName ?? 'docscn MCP',
            role: 'agent',
          }),
        },
        { requireAuth: true },
      );

      if (!result.comment) {
        throw new Error('Comment response did not include comment details.');
      }

      return result.comment;
    },

    async updateThreadStatus(input: UpdateThreadStatusRequest) {
      requireApiKey(credentials, 'Updating review thread status');

      const result = await apiFetch<UpdateThreadResponse>(
        `/api/review-threads/${encodeURIComponent(input.threadId)}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status: input.status }),
        },
        { requireAuth: true },
      );

      if (!result.thread) {
        throw new Error('Thread response did not include thread details.');
      }

      return result.thread;
    },

    async claimArtifacts(input: ClaimArtifactsRequest = {}) {
      requireApiKey(credentials, 'Claiming anonymous artifacts');

      const receipts =
        input.receipts ??
        (await getAnonymousClaimReceipts(credentials.baseUrl));

      if (!receipts.length) {
        return {
          claimed: [],
          skipped: [],
          message: 'No saved anonymous claim receipts found for this host.',
        };
      }

      const result = await apiFetch<ClaimArtifactsResponse>(
        '/api/artifacts/claims',
        {
          method: 'POST',
          body: JSON.stringify({ receipts }),
        },
        { requireAuth: true },
      );

      const completedIds = [
        ...(result.claimed ?? []).map((artifact) => artifact.artifactId),
        ...(result.skipped ?? []).map((artifact) => artifact.artifactId),
      ];

      await removeAnonymousClaimReceipts(credentials.baseUrl, completedIds);

      return {
        claimed: result.claimed ?? [],
        skipped: result.skipped ?? [],
      };
    },

    async getMe() {
      requireApiKey(credentials, 'Reading caller identity');

      const result = await apiFetch<MeResponse>(
        '/api/me',
        {},
        { requireAuth: true },
      );

      if (!result.principal) {
        throw new Error('Identity response did not include a principal.');
      }

      return result.principal;
    },
  };
}

export type DocscnApiClient = ReturnType<typeof createDocscnApiClient>;

export async function claimSavedAnonymousArtifacts(client: DocscnApiClient) {
  return client.claimArtifacts();
}
