import assert from 'node:assert/strict';

const base = process.env.DOCSCN_TEST_URL ?? 'http://localhost:3000';
const { createDocscnApiClient } = await import(
  '../dist/packages/mcp/src/lib/client.js'
);

const html =
  '<!doctype html><html><body><main><h1>MCP integration artifact</h1></main></body></html>';

const anonymousClient = createDocscnApiClient({ baseUrl: base });
const published = await anonymousClient.publishArtifact({
  title: `MCP integration ${Date.now()}`,
  description: 'MCP client anonymous publish integration test.',
  html,
});

assert.match(published.url, /^https?:\/\/.+\/artifacts\/.+/);
assert.ok(published.slug);
assert.ok(published.claimToken, 'anonymous MCP publish should return a claim token');

const artifactResponse = await fetch(
  `${base}/api/artifacts/${encodeURIComponent(published.slug)}`,
);
assert.equal(artifactResponse.status, 200);

console.log('mcp integration ok');
