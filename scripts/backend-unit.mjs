import assert from 'node:assert/strict';

const base = process.env.DOCSCN_TEST_URL ?? 'http://localhost:3000';
const email = `backend-api-${Date.now()}@docscn.local`;
const password = 'backend-api-password';

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

async function createSignedInCookie() {
  const signUp = await jsonFetch('/api/auth/sign-up/email', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: base },
    body: JSON.stringify({
      email,
      password,
      name: 'Backend API Test',
    }),
  });
  const setCookie =
    signUp.response.headers.getSetCookie?.() ??
    [signUp.response.headers.get('set-cookie')].filter(Boolean);

  return setCookie.map((value) => value.split(';')[0]).join('; ');
}

async function createApiKeyViaCliAuth(cookie) {
  const start = await jsonFetch('/api/cli/auth/start', { method: 'POST' });

  assert.match(start.payload.deviceCode, /^docscn_dc_/);
  assert.ok(start.payload.verificationUrl.includes('/cli/login?code='));

  const pending = await jsonFetch('/api/cli/auth/poll', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ deviceCode: start.payload.deviceCode }),
  });
  assert.equal(pending.payload.status, 'pending');

  const approval = await jsonFetch('/api/cli/auth/approve', {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie, origin: base },
    body: JSON.stringify({ userCode: start.payload.userCode.toLowerCase() }),
  });
  assert.equal(approval.payload.status, 'approved');

  const approved = await jsonFetch('/api/cli/auth/poll', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ deviceCode: start.payload.deviceCode }),
  });
  assert.equal(approved.payload.status, 'approved');
  assert.ok(approved.payload.token);

  const consumed = await fetch(`${base}/api/cli/auth/poll`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ deviceCode: start.payload.deviceCode }),
  });
  assert.equal(consumed.status, 400);
  assert.equal((await consumed.json()).status, 'already-consumed');

  return approved.payload.token;
}

function authHeaders(apiKey) {
  return {
    authorization: `Bearer ${apiKey}`,
    'content-type': 'application/json',
  };
}

const cookie = await createSignedInCookie();
const apiKey = await createApiKeyViaCliAuth(cookie);

const me = await jsonFetch('/api/me', {
  headers: { authorization: `Bearer ${apiKey}` },
});
assert.equal(me.payload.principal.kind, 'api-key');

const published = await jsonFetch('/api/artifacts', {
  method: 'POST',
  headers: authHeaders(apiKey),
  body: JSON.stringify({
    title: 'Backend API artifact',
    description: 'Backend API contract test artifact.',
    html: '<!doctype html><html><body><main><h1>Backend API</h1></main></body></html>',
    visibility: 'private',
    authorName: 'Backend API agent',
    source: 'automation',
    kind: 'custom-html',
  }),
});
const artifactSlug = published.payload.result.slug;
assert.ok(artifactSlug);

const artifact = await jsonFetch(`/api/artifacts/${artifactSlug}`, {
  headers: { authorization: `Bearer ${apiKey}` },
});
assert.equal(artifact.payload.artifact.slug, artifactSlug);

const thread = await jsonFetch(`/api/artifacts/${artifactSlug}/threads`, {
  method: 'POST',
  headers: authHeaders(apiKey),
  body: JSON.stringify({
    title: 'Backend API thread',
    body: 'Please revise this artifact.',
    authorName: 'Backend API agent',
    role: 'agent',
    status: 'needs-revision',
    requestedChange: 'Add more detail.',
    anchorLabel: 'main',
    anchorX: 25,
    anchorY: 50,
  }),
});
assert.equal(thread.payload.thread.comments[0].role, 'agent');
assert.equal(thread.payload.thread.anchor.x, 25);

const comment = await jsonFetch(
  `/api/review-threads/${thread.payload.thread.id}/comments`,
  {
    method: 'POST',
    headers: authHeaders(apiKey),
    body: JSON.stringify({
      body: 'Adding a backend API follow-up.',
      authorName: 'Backend API agent',
      role: 'agent',
    }),
  },
);
assert.equal(comment.payload.comment.role, 'agent');

const revision = await jsonFetch(`/api/artifacts/${artifactSlug}/revisions`, {
  method: 'POST',
  headers: authHeaders(apiKey),
  body: JSON.stringify({
    html: '<!doctype html><html><body><main><h1>Backend API revised</h1><p>More detail.</p></main></body></html>',
    summary: 'Addressed backend API test feedback.',
    authorName: 'Backend API agent',
    source: 'automation',
    resolvedThreadIds: [thread.payload.thread.id],
  }),
});
assert.equal(revision.payload.revision.version, 2);

const reopened = await jsonFetch(
  `/api/review-threads/${thread.payload.thread.id}`,
  {
    method: 'PATCH',
    headers: authHeaders(apiKey),
    body: JSON.stringify({ status: 'open' }),
  },
);
assert.equal(reopened.payload.thread.status, 'open');

console.log('backend api ok');
