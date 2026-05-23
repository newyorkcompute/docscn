import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const base = process.env.DOCSCN_SMOKE_URL ?? 'http://localhost:3000';
const cli = join(process.cwd(), 'dist/packages/cli/src/index.js');
const email = `agent-smoke-${Date.now()}@docscn.local`;
const password = 'agent-smoke-password';

async function jsonFetch(url, init = {}) {
  const response = await fetch(url, init);
  const payload = await response.json().catch(() => null);

  assert.ok(
    response.ok,
    `${url} failed ${response.status}: ${JSON.stringify(payload)}`,
  );

  return { response, payload };
}

async function pageFetch(url) {
  const response = await fetch(url);
  const body = await response.text();

  assert.ok(
    response.ok,
    `${url} failed ${response.status}: ${body.slice(0, 240)}`,
  );

  return body;
}

async function createSignedInUser() {
  const signUp = await jsonFetch(`${base}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: base },
    body: JSON.stringify({
      email,
      password,
      name: 'Agent Smoke',
    }),
  });
  const setCookie =
    signUp.response.headers.getSetCookie?.() ??
    [signUp.response.headers.get('set-cookie')].filter(Boolean);

  return setCookie.map((value) => value.split(';')[0]).join('; ');
}

async function createCliToken(cookie) {
  const start = await jsonFetch(`${base}/api/cli/auth/start`, {
    method: 'POST',
  });

  await jsonFetch(`${base}/api/cli/auth/approve`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie, origin: base },
    body: JSON.stringify({ userCode: start.payload.userCode }),
  });

  const poll = await jsonFetch(`${base}/api/cli/auth/poll`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ deviceCode: start.payload.deviceCode }),
  });

  assert.equal(poll.payload.status, 'approved');
  assert.ok(poll.payload.token, 'poll response should include a token');

  return poll.payload.token;
}

async function createCliConfig(apiKey) {
  const smokeDir = await mkdtemp(join(tmpdir(), 'docscn-agent-smoke-'));

  await mkdir(join(smokeDir, '.docscn'), { recursive: true, mode: 0o700 });
  await writeFile(
    join(smokeDir, '.docscn', 'config.json'),
    `${JSON.stringify(
      {
        defaultHost: base,
        profiles: { default: { host: base, apiKey } },
      },
      null,
      2,
    )}\n`,
    { mode: 0o600 },
  );

  return smokeDir;
}

async function runCli(args, configDir) {
  const { stdout, stderr } = await execFileAsync(
    process.execPath,
    [cli, ...args],
    {
      env: { ...process.env, DOCSCN_CONFIG_DIR: configDir },
      timeout: 20_000,
    },
  );

  assert.equal(stderr.trim(), '');

  return stdout.trim();
}

async function main() {
  const cookie = await createSignedInUser();
  const apiKey = await createCliToken(cookie);
  const configDir = await createCliConfig(apiKey);
  const artifactPath = join(configDir, 'artifact.html');

  await writeFile(
    artifactPath,
    '<!doctype html><html><body><main><h1>Agent smoke artifact</h1></main></body></html>',
  );

  await runCli(['whoami', '--host', base], configDir);

  const publish = await runCli(
    [
      'publish',
      artifactPath,
      '--host',
      base,
      '--title',
      'Agent smoke artifact',
      '--description',
      'Smoke test artifact',
      '--kind',
      'custom-html',
      '--visibility',
      'unlisted',
    ],
    configDir,
  );
  const artifactUrl = publish.split('\n').at(-1);
  const artifactSlug = artifactUrl?.split('/').at(-1);

  assert.ok(artifactSlug, `could not parse artifact slug from ${publish}`);

  const publishedPage = await pageFetch(artifactUrl);
  assert.match(
    publishedPage,
    /Agent smoke artifact/,
    'published artifact URL should be viewable without CLI auth',
  );

  const threadOutput = await runCli(
    [
      'thread',
      'create',
      artifactSlug,
      '--host',
      base,
      '--title',
      'Agent follow-up',
      '--body',
      'Please revise this smoke artifact.',
      '--requested-change',
      'Add more detail.',
    ],
    configDir,
  );
  const threadId = threadOutput.match(/Thread (.+)/)?.[1]?.trim();

  assert.ok(threadId, `could not parse thread id from ${threadOutput}`);

  const artifactJson = await runCli(
    ['artifact', 'get', artifactSlug, '--host', base, '--json'],
    configDir,
  );
  const parsedArtifact = JSON.parse(artifactJson);

  assert.ok(
    parsedArtifact.threads?.some((thread) => thread.id === threadId),
    'created thread should be returned by artifact get',
  );

  const revisedPath = join(configDir, 'revised.html');
  await writeFile(
    revisedPath,
    '<!doctype html><html><body><main><h1>Agent smoke artifact revised</h1><p>Added more detail.</p></main></body></html>',
  );
  await runCli(
    [
      'revise',
      artifactSlug,
      revisedPath,
      '--host',
      base,
      '--summary',
      'Addressed smoke feedback',
      '--resolve',
      threadId,
    ],
    configDir,
  );

  const revisedPage = await pageFetch(artifactUrl);
  assert.match(
    revisedPage,
    /Agent smoke artifact revised/,
    'published artifact URL should show the persisted revision',
  );

  await runCli(
    [
      'comment',
      threadId,
      '--host',
      base,
      '--body',
      'Revised and resolved via CLI smoke test.',
    ],
    configDir,
  );

  console.log(`agent smoke ok ${artifactUrl}`);
}

await main();
