import assert from 'node:assert/strict';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

const { docscnMcpToolNames, createDocscnMcpServer } =
  await import('../dist/packages/mcp/src/lib/server.js');
const { createDocscnApiClient } =
  await import('../dist/packages/mcp/src/lib/client.js');
const {
  findProfileForHost,
  getAnonymousClaimReceipts,
  getConfigPath,
  normalizeHost,
  readCliConfig,
  resolveDocscnCredentials,
  saveAnonymousClaimReceipt,
} = await import('../dist/packages/mcp/src/lib/credentials.js');

assert.deepEqual(docscnMcpToolNames, [
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
  () => anonymousClient.listArtifactShares('artifact-example'),
  /requires a docscn API key/,
);

await assertRejectsWith(
  () =>
    anonymousClient.shareArtifact({
      artifactIdOrSlug: 'artifact-example',
      email: 'reviewer@example.com',
    }),
  /requires a docscn API key/,
);

await assertRejectsWith(
  () =>
    anonymousClient.updateArtifactVisibility({
      artifactIdOrSlug: 'artifact-example',
      visibility: 'private',
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
  () => anonymousClient.claimArtifacts(),
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

const mcpConfigDir = await mkdtemp(join(tmpdir(), 'docscn-mcp-unit-'));
process.env.DOCSCN_CONFIG_DIR = mcpConfigDir;

assert.equal(normalizeHost('https://docscn.ai///'), 'https://docscn.ai');
assert.ok(getConfigPath().includes(mcpConfigDir));

const previousMcpUrl = process.env.DOCSCN_URL;
const previousMcpKey = process.env.DOCSCN_API_KEY;
delete process.env.DOCSCN_API_KEY;
process.env.DOCSCN_URL = 'https://staging.docscn.ai/';

try {
  const envOnlyCredentials = await resolveDocscnCredentials();
  assert.equal(envOnlyCredentials.baseUrl, 'https://staging.docscn.ai');
  assert.equal(envOnlyCredentials.apiKey, undefined);

  delete process.env.DOCSCN_API_KEY;
  const configPath = getConfigPath();
  await mkdir(dirname(configPath), { recursive: true });
  await writeFile(
    configPath,
    `${JSON.stringify({
      defaultHost: 'https://staging.docscn.ai',
      profiles: {
        default: {
          apiKey: 'docscn_sk_mcp_profile',
          host: 'https://staging.docscn.ai',
        },
      },
    })}\n`,
  );

  const config = await readCliConfig();
  assert.equal(
    findProfileForHost(config, 'https://staging.docscn.ai/')?.apiKey,
    'docscn_sk_mcp_profile',
  );

  const resolved = await resolveDocscnCredentials();
  assert.equal(resolved.apiKey, 'docscn_sk_mcp_profile');
  assert.equal(resolved.baseUrl, 'https://staging.docscn.ai');

  await saveAnonymousClaimReceipt('https://staging.docscn.ai/', {
    artifactId: 'artifact-mcp-claim',
    slug: 'mcp-claim-unit',
    title: 'MCP claim unit',
    claimToken: 'docscn_claim_mcp_unit',
    createdAt: new Date().toISOString(),
  });
  assert.equal(
    (await getAnonymousClaimReceipts('https://staging.docscn.ai')).length,
    1,
  );
} finally {
  if (previousMcpUrl) {
    process.env.DOCSCN_URL = previousMcpUrl;
  } else {
    delete process.env.DOCSCN_URL;
  }
  if (previousMcpKey) {
    process.env.DOCSCN_API_KEY = previousMcpKey;
  } else {
    delete process.env.DOCSCN_API_KEY;
  }
}

console.log('mcp unit ok');
