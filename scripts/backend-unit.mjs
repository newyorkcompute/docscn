import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import postgres from 'postgres';

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

async function getDatabaseUrl() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const envLocal = await readFile('.env.local', 'utf8').catch(() => '');
  const match = envLocal.match(/^\s*DATABASE_URL\s*=\s*(.+)\s*$/m);

  return match?.[1]?.replace(/^['"]|['"]$/g, '');
}

async function expireArtifactClaim(artifactId) {
  const databaseUrl = await getDatabaseUrl();

  assert.ok(
    databaseUrl,
    'DATABASE_URL or .env.local DATABASE_URL is required for claim expiry tests.',
  );

  const sql = postgres(databaseUrl, { max: 1 });
  const expiredAt = new Date(Date.now() - 60 * 1000).toISOString();
  const createdAt = new Date(
    Date.now() - 91 * 24 * 60 * 60 * 1000,
  ).toISOString();

  try {
    const updatedRows = await sql`
      UPDATE artifact_claims
      SET created_at = ${createdAt}, expires_at = ${expiredAt}
      WHERE artifact_id = ${artifactId}
      RETURNING artifact_id
    `;

    assert.equal(updatedRows.length, 1);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

async function cleanupExpiredArtifactClaim(artifactId) {
  const databaseUrl = await getDatabaseUrl();

  assert.ok(
    databaseUrl,
    'DATABASE_URL or .env.local DATABASE_URL is required for claim cleanup tests.',
  );

  const sql = postgres(databaseUrl, { max: 1 });

  try {
    const deletedRows = await sql`
      DELETE FROM artifact_claims
      WHERE artifact_id = ${artifactId}
        AND claimed_at IS NULL
        AND expires_at <= now()
      RETURNING artifact_id
    `;

    assert.equal(deletedRows.length, 1);
  } finally {
    await sql.end({ timeout: 5 });
  }
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

const anonymousPublished = await jsonFetch('/api/artifacts', {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'x-forwarded-for': `claim-test-${Date.now()}`,
  },
  body: JSON.stringify({
    title: 'Anonymous claim artifact',
    description: 'Anonymous artifact to claim after sign-in.',
    html: '<!doctype html><html><body><main><h1>Anonymous claim</h1></main></body></html>',
    visibility: 'private',
    authorName: 'Anonymous Backend API agent',
    source: 'automation',
    kind: 'custom-html',
  }),
});
assert.equal(
  anonymousPublished.payload.artifact.metadata.visibility,
  'unlisted',
);
assert.ok(anonymousPublished.payload.result.claimToken);

const claimResult = await jsonFetch('/api/artifacts/claims', {
  method: 'POST',
  headers: { 'content-type': 'application/json', cookie, origin: base },
  body: JSON.stringify({
    receipts: [
      {
        artifactId: anonymousPublished.payload.result.artifactId,
        slug: anonymousPublished.payload.result.slug,
        title: 'Anonymous claim artifact',
        claimToken: anonymousPublished.payload.result.claimToken,
        createdAt: new Date().toISOString(),
      },
    ],
  }),
});
assert.equal(claimResult.payload.claimed.length, 1);

const duplicateClaimResult = await jsonFetch('/api/artifacts/claims', {
  method: 'POST',
  headers: { 'content-type': 'application/json', cookie, origin: base },
  body: JSON.stringify({
    receipts: [
      {
        artifactId: anonymousPublished.payload.result.artifactId,
        slug: anonymousPublished.payload.result.slug,
        title: 'Anonymous claim artifact',
        claimToken: anonymousPublished.payload.result.claimToken,
        createdAt: new Date().toISOString(),
      },
    ],
  }),
});
assert.deepEqual(duplicateClaimResult.payload.claimed, []);
assert.deepEqual(duplicateClaimResult.payload.skipped, [
  {
    artifactId: anonymousPublished.payload.result.artifactId,
    reason: 'already-owned',
  },
]);

const claimedThread = await jsonFetch(
  `/api/artifacts/${anonymousPublished.payload.result.slug}/threads`,
  {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie, origin: base },
    body: JSON.stringify({
      title: 'Claimed artifact thread',
      body: 'Claimed artifacts should unlock review threads.',
      authorName: 'Backend API Test',
      status: 'open',
    }),
  },
);
assert.equal(claimedThread.payload.thread.status, 'open');

const expiredAnonymousPublished = await jsonFetch('/api/artifacts', {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'x-forwarded-for': `expired-claim-test-${Date.now()}`,
  },
  body: JSON.stringify({
    title: 'Expired anonymous claim artifact',
    description: 'Anonymous artifact with an expired claim receipt.',
    html: '<!doctype html><html><body><main><h1>Expired anonymous claim</h1></main></body></html>',
    visibility: 'private',
    authorName: 'Anonymous Backend API agent',
    source: 'automation',
    kind: 'custom-html',
  }),
});
await expireArtifactClaim(expiredAnonymousPublished.payload.result.artifactId);

const expiredClaimResult = await jsonFetch('/api/artifacts/claims', {
  method: 'POST',
  headers: { 'content-type': 'application/json', cookie, origin: base },
  body: JSON.stringify({
    receipts: [
      {
        artifactId: expiredAnonymousPublished.payload.result.artifactId,
        slug: expiredAnonymousPublished.payload.result.slug,
        title: 'Expired anonymous claim artifact',
        claimToken: expiredAnonymousPublished.payload.result.claimToken,
        createdAt: new Date().toISOString(),
      },
    ],
  }),
});
assert.deepEqual(expiredClaimResult.payload.claimed, []);
assert.deepEqual(expiredClaimResult.payload.skipped, [
  {
    artifactId: expiredAnonymousPublished.payload.result.artifactId,
    reason: 'expired-token',
  },
]);

await cleanupExpiredArtifactClaim(
  expiredAnonymousPublished.payload.result.artifactId,
);

const cleanedUpExpiredClaimResult = await jsonFetch('/api/artifacts/claims', {
  method: 'POST',
  headers: { 'content-type': 'application/json', cookie, origin: base },
  body: JSON.stringify({
    receipts: [
      {
        artifactId: expiredAnonymousPublished.payload.result.artifactId,
        slug: expiredAnonymousPublished.payload.result.slug,
        title: 'Expired anonymous claim artifact',
        claimToken: expiredAnonymousPublished.payload.result.claimToken,
        createdAt: new Date().toISOString(),
      },
    ],
  }),
});
assert.deepEqual(cleanedUpExpiredClaimResult.payload.claimed, []);
assert.deepEqual(cleanedUpExpiredClaimResult.payload.skipped, [
  {
    artifactId: expiredAnonymousPublished.payload.result.artifactId,
    reason: 'expired-token',
  },
]);

const expiredArtifact = await jsonFetch(
  `/api/artifacts/${expiredAnonymousPublished.payload.result.slug}`,
);
assert.equal(
  expiredArtifact.payload.artifact.slug,
  expiredAnonymousPublished.payload.result.slug,
);

const oversized = await fetch(`${base}/api/artifacts`, {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'x-forwarded-for': `size-test-${Date.now()}`,
  },
  body: JSON.stringify({
    title: 'Oversized anonymous artifact',
    description: 'Should be rejected.',
    html: `<!doctype html><html><body>${'x'.repeat(1024 * 1024)}</body></html>`,
    visibility: 'unlisted',
    authorName: 'Backend API agent',
    source: 'automation',
    kind: 'custom-html',
  }),
});
assert.equal(oversized.status, 413);

const rateIp = `rate-test-${Date.now()}`;
for (let index = 0; index < 20; index += 1) {
  const response = await fetch(`${base}/api/artifacts`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': rateIp,
    },
    body: JSON.stringify({
      title: `Rate test ${index}`,
      description: 'Rate limit warmup.',
      html: '<!doctype html><html><body><main>rate</main></body></html>',
      visibility: 'unlisted',
      authorName: 'Backend API agent',
      source: 'automation',
      kind: 'custom-html',
    }),
  });
  assert.equal(response.status, 201);
}
const rateLimited = await fetch(`${base}/api/artifacts`, {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'x-forwarded-for': rateIp,
  },
  body: JSON.stringify({
    title: 'Rate limited',
    description: 'Should be rejected.',
    html: '<!doctype html><html><body><main>rate</main></body></html>',
    visibility: 'unlisted',
    authorName: 'Backend API agent',
    source: 'automation',
    kind: 'custom-html',
  }),
});
assert.equal(rateLimited.status, 429);

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

const feedback = await jsonFetch(`/api/artifacts/${artifactSlug}/feedback`, {
  headers: { authorization: `Bearer ${apiKey}` },
});
assert.equal(feedback.payload.bundle.artifact.slug, artifactSlug);
assert.match(feedback.payload.prompt, /Backend API artifact/);
assert.equal(feedback.payload.bundle.openThreads.length, 1);
assert.equal(
  feedback.payload.bundle.openThreads[0].id,
  thread.payload.thread.id,
);

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

const openApi = await jsonFetch('/openapi.json');
assert.equal(openApi.payload.openapi, '3.1.0');
assert.ok(openApi.payload.paths['/api/artifacts/{artifactIdOrSlug}/feedback']);
assert.equal(openApi.payload.servers[0].url, base);

console.log('backend api ok');
