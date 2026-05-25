import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import {
  claimSavedAnonymousArtifacts,
  createDocscnApiClient,
} from './client.js';
import { resolveDocscnCredentials } from './credentials.js';

export const docscnMcpVersion = '0.0.1';

const artifactKindSchema = z.enum([
  'incident-timeline',
  'migration-plan',
  'generated-dashboard',
  'architecture-explainer',
  'animated-report',
  'ui-prototype',
  'pr-review',
  'custom-html',
]);

const visibilitySchema = z.enum(['public', 'unlisted', 'private']);

const shareRoleSchema = z.enum(['viewer', 'commenter']);

const threadStatusSchema = z.enum(['open', 'needs-revision', 'resolved']);

const anchorKindSchema = z.enum(['point', 'text', 'element']);

function jsonToolResult(value: unknown) {
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(value, null, 2),
      },
    ],
  };
}

const publishArtifactShape = {
  title: z.string().describe('Artifact title shown in the docscn UI.'),
  description: z
    .string()
    .describe('Short description of the artifact contents.'),
  html: z
    .string()
    .describe('Complete self-contained HTML document including <html>.'),
  visibility: visibilitySchema.optional().describe('Defaults to unlisted.'),
  kind: artifactKindSchema.optional().describe('Defaults to custom-html.'),
  authorName: z
    .string()
    .optional()
    .describe('Display name for the publishing agent.'),
};

const getArtifactShape = {
  artifactIdOrSlug: z
    .string()
    .describe('Artifact id or slug from publish_artifact or list_artifacts.'),
};

const shareArtifactShape = {
  artifactIdOrSlug: z.string().describe('Artifact id or slug to share.'),
  email: z.string().email().describe('Email address to invite.'),
  role: shareRoleSchema
    .optional()
    .describe('Defaults to viewer. Use commenter to allow review comments.'),
};

const removeArtifactShareShape = {
  artifactIdOrSlug: z.string().describe('Artifact id or slug to update.'),
  email: z.string().email().describe('Email address to remove.'),
};

const updateArtifactVisibilityShape = {
  artifactIdOrSlug: z.string().describe('Artifact id or slug to update.'),
  visibility: visibilitySchema.describe(
    'New general access: public, unlisted, or private.',
  ),
};

const getFeedbackShape = {
  artifactIdOrSlug: z
    .string()
    .describe('Artifact id or slug from publish_artifact.'),
  revisionId: z
    .string()
    .optional()
    .describe('Revision to inspect. Defaults to the current revision.'),
};

const submitRevisionShape = {
  artifactIdOrSlug: z.string().describe('Artifact id or slug to revise.'),
  html: z
    .string()
    .describe('Complete replacement HTML document including <html>.'),
  summary: z
    .string()
    .describe('Short summary of what changed in this revision.'),
  resolvedThreadIds: z
    .array(z.string())
    .optional()
    .describe(
      'Open thread ids from get_feedback to mark resolved with this revision.',
    ),
  authorName: z
    .string()
    .optional()
    .describe('Display name for the revising agent.'),
};

const createThreadShape = {
  artifactIdOrSlug: z.string().describe('Artifact id or slug to review.'),
  title: z.string().describe('Short thread title.'),
  body: z.string().describe('Initial comment body for the thread.'),
  authorName: z
    .string()
    .optional()
    .describe('Display name for the reviewing agent.'),
  status: threadStatusSchema.optional().describe('Defaults to open.'),
  requestedChange: z
    .string()
    .optional()
    .describe('Structured change request for the artifact author.'),
  revisionId: z
    .string()
    .optional()
    .describe('Revision to attach the thread to. Defaults to current.'),
  anchorLabel: z
    .string()
    .optional()
    .describe('Pin label when anchoring feedback to the artifact canvas.'),
  anchorKind: anchorKindSchema
    .optional()
    .describe('Anchor type when anchorLabel is provided. Defaults to point.'),
  anchorX: z
    .number()
    .optional()
    .describe('Horizontal pin position as a percentage of artifact width.'),
  anchorY: z
    .number()
    .optional()
    .describe('Vertical pin position as a percentage of artifact height.'),
};

const addCommentShape = {
  threadId: z
    .string()
    .describe('Review thread id from get_artifact or get_feedback.'),
  body: z.string().describe('Comment text.'),
  authorName: z
    .string()
    .optional()
    .describe('Display name for the commenting agent.'),
};

const updateThreadStatusShape = {
  threadId: z.string().describe('Review thread id to update.'),
  status: threadStatusSchema.describe(
    'New thread status. Only the artifact owner can change status.',
  ),
};

const claimArtifactsShape = {
  receipts: z
    .array(
      z.object({
        artifactId: z.string(),
        slug: z.string(),
        title: z.string(),
        claimToken: z.string(),
        createdAt: z.string(),
      }),
    )
    .optional()
    .describe(
      'Optional claim receipts. When omitted, uses receipts saved locally from anonymous publish_artifact calls.',
    ),
};

export async function createDocscnMcpServer() {
  const credentials = await resolveDocscnCredentials();
  const client = createDocscnApiClient(credentials);

  if (credentials.apiKey) {
    try {
      await claimSavedAnonymousArtifacts(client);
    } catch {
      // Non-fatal: the host may not be reachable during MCP startup.
    }
  }

  const server = new McpServer(
    {
      name: 'docscn',
      version: docscnMcpVersion,
    },
    {
      instructions: [
        'docscn hosts self-contained HTML artifacts for publish → review → revise workflows.',
        `Connected to ${credentials.baseUrl}.`,
        credentials.apiKey
          ? 'Authenticated with an API key. Full publish, review, revision, and claim flows are available.'
          : 'No API key found; publish_artifact can still create anonymous unlisted view-only artifacts and saves local claim receipts.',
        'Use publish_artifact, list_artifacts, get_artifact, get_feedback, share_artifact, create_thread, add_comment, submit_revision, and update_thread_status for the full loop.',
        'Artifacts must include a complete <html> document. Prefer unlisted visibility unless the user asks otherwise.',
        'Public/private publishing, comments, threads, revisions, and claim_artifacts require login or DOCSCN_API_KEY.',
      ].join(' '),
    },
  );

  server.tool(
    'publish_artifact',
    'Publish a self-contained HTML artifact to docscn and return its stable URL. Works without an API key for anonymous unlisted artifacts; claim receipts are saved locally for recovery after login.',
    publishArtifactShape,
    async (input) => jsonToolResult(await client.publishArtifact(input)),
  );

  server.tool(
    'list_artifacts',
    'List artifacts visible to the caller: public and unlisted artifacts, plus owned private artifacts when authenticated.',
    {},
    async () => jsonToolResult({ artifacts: await client.listArtifacts() }),
  );

  server.tool(
    'get_artifact',
    'Fetch artifact metadata, revision history, and review threads.',
    getArtifactShape,
    async (input) =>
      jsonToolResult(await client.getArtifact(input.artifactIdOrSlug)),
  );

  server.tool(
    'list_artifact_shares',
    'List invited people for an artifact. Only the artifact owner can view sharing settings. Requires authentication.',
    getArtifactShape,
    async (input) =>
      jsonToolResult({
        shares: await client.listArtifactShares(input.artifactIdOrSlug),
      }),
  );

  server.tool(
    'share_artifact',
    'Invite an email address to a private artifact as viewer or commenter. Only the artifact owner can share. Requires authentication.',
    shareArtifactShape,
    async (input) => jsonToolResult(await client.shareArtifact(input)),
  );

  server.tool(
    'remove_artifact_share',
    'Remove an invited email address from an artifact. Only the artifact owner can remove access. Requires authentication.',
    removeArtifactShareShape,
    async (input) => jsonToolResult(await client.removeArtifactShare(input)),
  );

  server.tool(
    'update_artifact_visibility',
    'Update an artifact general access setting to public, unlisted, or private. Only the artifact owner can change visibility. Requires authentication.',
    updateArtifactVisibilityShape,
    async (input) =>
      jsonToolResult(await client.updateArtifactVisibility(input)),
  );

  server.tool(
    'get_feedback',
    'Fetch structured review feedback and a ready-to-use revision prompt for an artifact.',
    getFeedbackShape,
    async (input) => jsonToolResult(await client.getFeedback(input)),
  );

  server.tool(
    'submit_revision',
    'Submit a replacement HTML revision for an artifact, optionally resolving review threads. Requires authentication.',
    submitRevisionShape,
    async (input) => jsonToolResult(await client.submitRevision(input)),
  );

  server.tool(
    'create_thread',
    'Create a review thread on an artifact with optional canvas anchor metadata. Requires authentication.',
    createThreadShape,
    async (input) => jsonToolResult(await client.createThread(input)),
  );

  server.tool(
    'add_comment',
    'Add a comment to an existing review thread. Requires authentication.',
    addCommentShape,
    async (input) => jsonToolResult(await client.addComment(input)),
  );

  server.tool(
    'update_thread_status',
    'Update review thread status. Only the artifact owner can change status. Requires authentication.',
    updateThreadStatusShape,
    async (input) => jsonToolResult(await client.updateThreadStatus(input)),
  );

  server.tool(
    'claim_artifacts',
    'Recover anonymous artifacts for the authenticated caller using saved local claim receipts or explicit receipts. Requires authentication.',
    claimArtifactsShape,
    async (input) => jsonToolResult(await client.claimArtifacts(input)),
  );

  server.tool(
    'get_me',
    'Return the authenticated caller identity for the configured API key. Requires authentication.',
    {},
    async () => jsonToolResult(await client.getMe()),
  );

  return server;
}

export async function runDocscnMcpServer() {
  const server = await createDocscnMcpServer();
  const transport = new StdioServerTransport();

  await server.connect(transport);
}

export const docscnMcpToolNames = [
  'publish_artifact',
  'list_artifacts',
  'get_artifact',
  'list_artifact_shares',
  'share_artifact',
  'remove_artifact_share',
  'update_artifact_visibility',
  'get_feedback',
  'submit_revision',
  'create_thread',
  'add_comment',
  'update_thread_status',
  'claim_artifacts',
  'get_me',
];
