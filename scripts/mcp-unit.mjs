import assert from 'node:assert/strict';

const { docscnMcpToolNames, createDocscnMcpServer } = await import(
  '../dist/packages/mcp/src/lib/server.js'
);

assert.deepEqual(docscnMcpToolNames, [
  'publish_artifact',
  'get_feedback',
  'submit_revision',
]);

const previousKey = process.env.DOCSCN_API_KEY;
process.env.DOCSCN_API_KEY = 'docscn_sk_mcp_unit';
process.env.DOCSCN_URL = 'http://localhost:3000';

try {
  const server = await createDocscnMcpServer();
  assert.ok(server);
} finally {
  if (previousKey) {
    process.env.DOCSCN_API_KEY = previousKey;
  } else {
    delete process.env.DOCSCN_API_KEY;
  }
}

console.log('mcp unit ok');
