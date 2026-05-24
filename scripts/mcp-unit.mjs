import assert from 'node:assert/strict';

const { docscnMcpToolNames, createDocscnMcpServer } = await import(
  '../dist/packages/mcp/src/lib/server.js'
);
const { createDocscnApiClient } = await import(
  '../dist/packages/mcp/src/lib/client.js'
);

assert.deepEqual(docscnMcpToolNames, [
  'publish_artifact',
  'list_artifacts',
  'get_artifact',
  'get_feedback',
  'submit_revision',
  'create_thread',
  'add_comment',
  'update_thread_status',
  'claim_artifacts',
  'get_me',
]);

const previousKey = process.env.DOCSCN_API_KEY;
delete process.env.DOCSCN_API_KEY;
process.env.DOCSCN_URL = 'http://localhost:3000';

async function assertRejectsWith(callback, match) {
  await assert.rejects(callback, match);
}

try {
  const anonymousServer = await createDocscnMcpServer();
  assert.ok(anonymousServer);

  process.env.DOCSCN_API_KEY = 'docscn_sk_mcp_unit';
  const authenticatedServer = await createDocscnMcpServer();
  assert.ok(authenticatedServer);
} finally {
  if (previousKey) {
    process.env.DOCSCN_API_KEY = previousKey;
  } else {
    delete process.env.DOCSCN_API_KEY;
  }
}

const anonymousClient = createDocscnApiClient({
  baseUrl: 'http://localhost:3000',
});
const authenticatedClient = createDocscnApiClient({
  baseUrl: 'http://localhost:3000',
  apiKey: 'docscn_sk_mcp_unit',
});

const validHtml =
  '<!doctype html><html><body><main><h1>MCP unit</h1></main></body></html>';

await assertRejectsWith(
  () =>
    anonymousClient.publishArtifact({
      title: 'Invalid HTML',
      description: 'Should fail validation before network.',
      html: '<div>not a document</div>',
    }),
  /self-contained document/,
);

await assertRejectsWith(
  () =>
    anonymousClient.publishArtifact({
      title: 'Private anonymous',
      description: 'Should fail before network.',
      html: validHtml,
      visibility: 'private',
    }),
  /Anonymous MCP publish only supports unlisted/,
);

await assertRejectsWith(
  () =>
    anonymousClient.submitRevision({
      artifactIdOrSlug: 'artifact-example',
      html: validHtml,
      summary: 'Needs auth',
    }),
  /requires a docscn API key/,
);

await assertRejectsWith(
  () =>
    anonymousClient.createThread({
      artifactIdOrSlug: 'artifact-example',
      title: 'Needs auth',
      body: 'Thread body',
    }),
  /requires a docscn API key/,
);

await assertRejectsWith(
  () =>
    anonymousClient.addComment({
      threadId: 'thread-example',
      body: 'Needs auth',
    }),
  /requires a docscn API key/,
);

await assertRejectsWith(
  () =>
    anonymousClient.updateThreadStatus({
      threadId: 'thread-example',
      status: 'resolved',
    }),
  /requires a docscn API key/,
);

await assertRejectsWith(
  () =>
    anonymousClient.claimArtifacts(),
  /requires a docscn API key/,
);

await assertRejectsWith(
  () => anonymousClient.getMe(),
  /requires a docscn API key/,
);

await assertRejectsWith(
  () =>
    authenticatedClient.submitRevision({
      artifactIdOrSlug: 'artifact-example',
      html: '<div>bad</div>',
      summary: 'Invalid HTML',
    }),
  /self-contained document/,
);

console.log('mcp unit ok');
