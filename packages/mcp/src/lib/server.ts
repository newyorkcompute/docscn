// @ts-nocheck
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { createDocscnApiClient } from './client.js';
import { resolveDocscnCredentials } from './credentials.js';

export const docscnMcpVersion = '0.0.1';

function jsonToolResult(value) {
  return {
    content: [
      {
        type: 'text',
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
  visibility: z
    .enum(['public', 'unlisted', 'private'])
    .optional()
    .describe('Defaults to unlisted.'),
  kind: z
    .enum([
      'incident-timeline',
      'migration-plan',
      'generated-dashboard',
      'architecture-explainer',
      'animated-report',
      'ui-prototype',
      'pr-review',
      'custom-html',
    ])
    .optional()
    .describe('Defaults to custom-html.'),
  authorName: z
    .string()
    .optional()
    .describe('Display name for the publishing agent.'),
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
  summary: z.string().describe('Short summary of what changed in this revision.'),
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

export async function createDocscnMcpServer() {
  const credentials = await resolveDocscnCredentials();
  const client = createDocscnApiClient(credentials);

  const server = new McpServer(
    {
      name: 'docscn',
      version: docscnMcpVersion,
    },
    {
      instructions: [
        'docscn hosts self-contained HTML artifacts for publish → review → revise workflows.',
        `Connected to ${credentials.baseUrl}.`,
        'Use publish_artifact to publish HTML, get_feedback before revising, and submit_revision with resolvedThreadIds from open threads.',
        'Artifacts must include a complete <html> document. Prefer unlisted visibility unless the user asks otherwise.',
      ].join(' '),
    },
  );

  server.tool(
    'publish_artifact',
    'Publish a self-contained HTML artifact to docscn and return its stable URL.',
    publishArtifactShape,
    async (input) => jsonToolResult(await client.publishArtifact(input)),
  );

  server.tool(
    'get_feedback',
    'Fetch structured review feedback and a ready-to-use revision prompt for an artifact.',
    getFeedbackShape,
    async (input) => jsonToolResult(await client.getFeedback(input)),
  );

  server.tool(
    'submit_revision',
    'Submit a replacement HTML revision for an artifact, optionally resolving review threads.',
    submitRevisionShape,
    async (input) => jsonToolResult(await client.submitRevision(input)),
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
  'get_feedback',
  'submit_revision',
];
