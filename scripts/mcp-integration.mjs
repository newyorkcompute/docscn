import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const base = process.env.DOCSCN_TEST_URL ?? 'http://localhost:3000';
const email = `mcp-integration-${Date.now()}@docscn.local`;
const password = 'mcp-integration-password';
const configDir = await mkdtemp(join(tmpdir(), 'docscn-mcp-integration-'));

process.env.DOCSCN_CONFIG_DIR = configDir;

const { createDocscnApiClient } =
  await import('../dist/packages/mcp/src/lib/client.js');

async function jsonFetch(path, init = {}) {
  const url = path.startsWith('http') ? path : `${base}${path}`;
  const response = await fetch(url, init);
  const payload = await response.json().catch(() => null);

  assert.ok(
    response.ok,
    `${url} failed ${response.status}: ${JSON.stringify(payload)}`,
  );

  return { response, payload };
}

async function createSignedInCookie({
  emailAddress = email,
  name = 'MCP Integration Test',
} = {}) {
  const signUp = await jsonFetch('/api/auth/sign-up/email', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: base },
    body: JSON.stringify({
      email: emailAddress,
      password,
      name,
    }),
  });
  const setCookie =
    signUp.response.headers.getSetCookie?.() ??
    [signUp.response.headers.get('set-cookie')].filter(Boolean);

  return setCookie.map((value) => value.split(';')[0]).join('; ');
}

async function createApiKeyViaCliAuth(cookie) {
  const start = await jsonFetch('/api/cli/auth/start', { method: 'POST' });

  await jsonFetch('/api/cli/auth/approve', {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie, origin: base },
    body: JSON.stringify({ userCode: start.payload.userCode.toLowerCase() }),
  });

  const approved = await jsonFetch('/api/cli/auth/poll', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ deviceCode: start.payload.deviceCode }),
  });

  assert.equal(approved.payload.status, 'approved');
  assert.ok(approved.payload.token);

  return approved.payload.token;
}

const html =
  '<!doctype html><html><body><main><h1>MCP integration artifact</h1></main></body></html>';

const anonymousClient = createDocscnApiClient({ baseUrl: base });
const published = await anonymousClient.publishArtifact({
  title: `MCP integration anonymous ${Date.now()}`,
  description: 'MCP client anonymous publish integration test.',
  html,
});

assert.match(published.url, /^https?:\/\/.+\/artifacts\/.+/);
assert.ok(published.slug);
assert.ok(
  published.claimToken,
  'anonymous MCP publish should return a claim token',
);
assert.equal(
  published.claimReceiptSaved,
  true,
  'anonymous MCP publish should save a local claim receipt',
);

const anonymousArtifactResponse = await fetch(
  `${base}/api/artifacts/${encodeURIComponent(published.slug)}`,
);
assert.equal(anonymousArtifactResponse.status, 200);

const cookie = await createSignedInCookie();
const apiKey = await createApiKeyViaCliAuth(cookie);
const client = createDocscnApiClient({ baseUrl: base, apiKey });

const principal = await client.getMe();
assert.equal(principal.kind, 'api-key');

const owned = await client.publishArtifact({
  title: `MCP integration owned ${Date.now()}`,
  description: 'MCP client authenticated publish integration test.',
  html,
  visibility: 'private',
});

assert.match(owned.url, /^https?:\/\/.+\/artifacts\/.+/);
assert.ok(owned.slug);
assert.equal(owned.claimReceiptSaved, false);

const listed = await client.listArtifacts();
assert.ok(
  listed.some((artifact) => artifact.slug === owned.slug),
  'list_artifacts should include the owned private artifact',
);

const fetched = await client.getArtifact(owned.slug);
assert.equal(fetched.artifact.slug, owned.slug);
assert.equal(fetched.artifact.revisions.length, 1);
assert.equal(fetched.threads.length, 0);

const invitedEmail = `mcp-invited-${Date.now()}@docscn.local`;
const invitedCookie = await createSignedInCookie({
  emailAddress: invitedEmail,
  name: 'MCP Invited User',
});
const invitedApiKey = await createApiKeyViaCliAuth(invitedCookie);
const invitedClient = createDocscnApiClient({
  baseUrl: base,
  apiKey: invitedApiKey,
});

const share = await client.shareArtifact({
  artifactIdOrSlug: owned.slug,
  email: invitedEmail,
  role: 'commenter',
});
assert.equal(share.email, invitedEmail);
assert.equal(share.role, 'commenter');

const shareList = await client.listArtifactShares(owned.slug);
assert.ok(
  shareList.some(
    (candidate) =>
      candidate.email === invitedEmail && candidate.role === 'commenter',
  ),
);

const invitedFetched = await invitedClient.getArtifact(owned.slug);
assert.equal(invitedFetched.artifact.slug, owned.slug);

const invitedThread = await invitedClient.createThread({
  artifactIdOrSlug: owned.slug,
  title: 'MCP invited commenter thread',
  body: 'Commenter share should allow MCP review threads.',
});
assert.equal(invitedThread.status, 'open');

await client.removeArtifactShare({
  artifactIdOrSlug: owned.slug,
  email: invitedEmail,
});

await assert.rejects(
  () => invitedClient.getArtifact(owned.slug),
  /Artifact not found/,
);

const thread = await client.createThread({
  artifactIdOrSlug: owned.slug,
  title: 'MCP integration thread',
  body: 'Please add more detail to the artifact summary.',
  requestedChange: 'Expand the main heading section.',
  anchorLabel: 'Main heading',
  anchorKind: 'element',
  anchorX: 30,
  anchorY: 40,
});

assert.equal(thread.status, 'open');
assert.equal(thread.title, 'MCP integration thread');
assert.equal(thread.comments.length, 1);
assert.equal(
  thread.comments[0].body,
  'Please add more detail to the artifact summary.',
);
assert.equal(thread.anchor?.x, 30);

const comment = await client.addComment({
  threadId: thread.id,
  body: 'Following up from the MCP integration test.',
});

assert.equal(comment.body, 'Following up from the MCP integration test.');
assert.equal(comment.role, 'agent');

const afterComment = await client.getArtifact(owned.slug);
const updatedThread = afterComment.threads.find(
  (candidate) => candidate.id === thread.id,
);
assert.ok(updatedThread);
assert.equal(updatedThread.comments.length, 2);

const feedback = await client.getFeedback({ artifactIdOrSlug: owned.slug });
assert.equal(feedback.bundle.artifact.slug, owned.slug);
assert.equal(feedback.bundle.openThreads.length, 2);
assert.ok(
  feedback.bundle.openThreads.some((candidate) => candidate.id === thread.id),
);
assert.match(feedback.prompt, /MCP integration owned/);

const resolved = await client.updateThreadStatus({
  threadId: thread.id,
  status: 'resolved',
});
assert.equal(resolved.status, 'resolved');

const claimFromSavedReceipts = await client.claimArtifacts();
assert.equal(claimFromSavedReceipts.claimed.length, 1);
assert.equal(claimFromSavedReceipts.claimed[0].slug, published.slug);

console.log('mcp integration ok');
