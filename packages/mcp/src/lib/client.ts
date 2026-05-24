import type {
  AgentFeedbackContext,
  ArtifactKind,
  ArtifactRevision,
  ArtifactVisibility,
  CreateArtifactInput,
  PublishResult,
} from '@docscn/sdk';
import type { DocscnCredentials } from './credentials.js';

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

async function readJsonResponse<T>(response: Response): Promise<T | null> {
  return response.json().catch(() => null) as Promise<T | null>;
}

async function apiFetch<T>(
  credentials: DocscnCredentials,
  path: string,
  init: RequestInit = {},
) {
  const response = await fetch(`${credentials.baseUrl}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${credentials.apiKey}`,
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

export function createDocscnApiClient(credentials: DocscnCredentials) {
  return {
    async publishArtifact(input: PublishArtifactRequest) {
      if (!input.html.toLowerCase().includes('<html')) {
        throw new Error(
          'Artifact HTML must be a self-contained document including <html>.',
        );
      }

      const payload: CreateArtifactInput = {
        title: input.title,
        description: input.description,
        html: input.html,
        visibility: input.visibility ?? 'unlisted',
        authorName: input.authorName ?? 'docscn MCP',
        source: 'mcp',
        kind: input.kind ?? 'custom-html',
      };

      const result = await apiFetch<PublishArtifactResponse>(
        credentials,
        '/api/artifacts',
        {
          method: 'POST',
          body: JSON.stringify(payload),
        },
      );

      if (!result.result) {
        throw new Error('Publish response did not include artifact details.');
      }

      return {
        ...result.result,
        url: buildArtifactUrl(credentials.baseUrl, result.result.url),
      };
    },

    async getFeedback(input: GetFeedbackRequest) {
      const query = input.revisionId
        ? `?revisionId=${encodeURIComponent(input.revisionId)}`
        : '';

      const result = await apiFetch<ArtifactFeedbackResponse>(
        credentials,
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
      if (!input.html.toLowerCase().includes('<html')) {
        throw new Error(
          'Revision HTML must be a self-contained document including <html>.',
        );
      }

      const result = await apiFetch<SubmitRevisionResponse>(
        credentials,
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
      );

      if (!result.revision) {
        throw new Error('Revision response did not include revision details.');
      }

      return result.revision;
    },
  };
}

export type DocscnApiClient = ReturnType<typeof createDocscnApiClient>;
