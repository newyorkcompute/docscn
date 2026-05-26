import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const configDir = await mkdtemp(join(tmpdir(), 'docscn-cli-unit-'));
process.env.DOCSCN_CONFIG_DIR = configDir;

const {
  findProfileForHost,
  getConfigPath,
  normalizeHost,
  readCliConfig,
  getAnonymousClaimReceipts,
  removeAnonymousClaimReceipts,
  saveAnonymousClaimReceipt,
  saveDefaultProfile,
} = await import('../dist/packages/cli/src/lib/config.js');
const {
  getArtifactFeedbackFromCli,
  getArtifactFromCli,
  getCliHelp,
  getTemplateFromCli,
  listTemplatesFromCli,
  publishArtifactFromCli,
  runDocscnCli,
  shareArtifactFromCli,
} = await import('../dist/packages/cli/src/lib/cli.js');

function captureLogs(callback) {
  const originalLog = console.log;
  const messages = [];

  console.log = (...args) => {
    messages.push(args.join(' '));
  };

  return Promise.resolve(callback())
    .then(() => messages)
    .finally(() => {
      console.log = originalLog;
    });
}

async function assertRejectsWith(callback, match) {
  await assert.rejects(callback, match);
}

assert.equal(
  normalizeHost('http://localhost:3000///'),
  'http://localhost:3000',
);
assert.equal(
  getConfigPath(),
  join(configDir, '.docscn', 'config.json'),
  'config path should respect DOCSCN_CONFIG_DIR',
);

assert.equal(await readCliConfig(), undefined);

await saveDefaultProfile({
  apiKey: 'docscn_sk_unit',
  host: 'http://localhost:3000/',
});

const savedConfig = await readCliConfig();
const configText = await readFile(getConfigPath(), 'utf8');

assert.equal(savedConfig.defaultHost, 'http://localhost:3000');
assert.equal(savedConfig.profiles.default.apiKey, 'docscn_sk_unit');
assert.equal(
  JSON.parse(configText).profiles.default.host,
  'http://localhost:3000',
);
assert.equal(
  findProfileForHost(savedConfig, 'http://localhost:3000')?.apiKey,
  'docscn_sk_unit',
);

await saveAnonymousClaimReceipt('http://localhost:3000', {
  artifactId: 'artifact-anon-unit',
  slug: 'anonymous-unit',
  title: 'Anonymous unit',
  claimToken: 'docscn_claim_unit',
  createdAt: new Date().toISOString(),
});
assert.equal(
  (await getAnonymousClaimReceipts('http://localhost:3000')).length,
  1,
);
await removeAnonymousClaimReceipts('http://localhost:3000', [
  'artifact-anon-unit',
]);
assert.equal(
  (await getAnonymousClaimReceipts('http://localhost:3000')).length,
  0,
);

const help = getCliHelp();
assert.match(help, /docscn login/);
assert.match(help, /docscn artifact get/);
assert.match(help, /docscn artifact feedback/);
assert.match(help, /docscn share/);
assert.match(help, /docscn revise/);
assert.match(help, /docscn template list/);
assert.match(help, /docscn template get/);
assert.match(help, /https:\/\/docscn\.ai/);

const templateServer = createServer((request, response) => {
  if (request.url === '/examples/artifacts/templates.json') {
    response.setHeader('content-type', 'application/json');
    response.end(
      JSON.stringify({
        schemaVersion: 1,
        repository: 'https://github.com/newyorkcompute/docscn',
        templatesRoot: 'examples/artifacts',
        categories: [
          {
            id: 'docscn-starters',
            title: 'docscn starters',
            description: 'Starter templates',
          },
        ],
        templates: [
          {
            id: 'minimal',
            title: 'Minimal publish test',
            description: 'Smallest useful artifact.',
            kind: 'custom-html',
            filename: 'minimal.html',
            category: 'docscn-starters',
          },
        ],
      }),
    );
    return;
  }

  if (request.url === '/examples/artifacts/minimal.html') {
    response.setHeader('content-type', 'text/html');
    response.end('<html><body>minimal template</body></html>');
    return;
  }

  response.statusCode = 404;
  response.end('not found');
});
await new Promise((resolve) => templateServer.listen(0, '127.0.0.1', resolve));

const previousTemplateRawBase = process.env.DOCSCN_TEMPLATE_RAW_BASE;
const templateServerAddress = templateServer.address();
process.env.DOCSCN_TEMPLATE_RAW_BASE = `http://127.0.0.1:${templateServerAddress.port}`;

try {
  const templateLogs = await captureLogs(() => listTemplatesFromCli([]));
  assert.ok(templateLogs.join('\n').includes('minimal'));

  const templatePath = join(configDir, 'minimal-template.html');
  await captureLogs(() =>
    getTemplateFromCli(['minimal', '--output', templatePath]),
  );
  assert.match(await readFile(templatePath, 'utf8'), /minimal template/);
} finally {
  if (previousTemplateRawBase) {
    process.env.DOCSCN_TEMPLATE_RAW_BASE = previousTemplateRawBase;
  } else {
    delete process.env.DOCSCN_TEMPLATE_RAW_BASE;
  }
  await new Promise((resolve) => templateServer.close(resolve));
}

await assertRejectsWith(
  () => publishArtifactFromCli(['--host', 'http://example.test']),
  /Missing artifact HTML file path/,
);

const previousKey = process.env.DOCSCN_API_KEY;
delete process.env.DOCSCN_API_KEY;
await assertRejectsWith(
  () =>
    publishArtifactFromCli([
      'artifact.html',
      '--host',
      'http://unconfigured.example',
      '--visibility',
      'private',
    ]),
  /Anonymous publish only supports unlisted artifacts/,
);
if (previousKey) {
  process.env.DOCSCN_API_KEY = previousKey;
}

const htmlPath = join(configDir, 'bad.txt');
await writeFile(htmlPath, 'not html');
await assertRejectsWith(
  () => publishArtifactFromCli([htmlPath, '--host', 'http://localhost:3000']),
  /self-contained HTML/,
);

const goodHtmlPath = join(configDir, 'artifact.html');
await writeFile(goodHtmlPath, '<html><body>hello docscn</body></html>');
const cliReadRequests = [];
const cliPublishServer = createServer(async (request, response) => {
  cliReadRequests.push({
    authorization: request.headers.authorization,
    method: request.method,
    url: request.url,
  });

  if (request.url === '/api/artifacts' && request.method === 'POST') {
    assert.equal(request.headers.authorization, undefined);
    const chunks = [];
    for await (const chunk of request) {
      chunks.push(chunk);
    }
    const body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
    assert.equal(body.title, 'CLI JSON unit');
    assert.equal(body.visibility, 'unlisted');
    response.statusCode = 201;
    response.setHeader('content-type', 'application/json');
    response.end(
      JSON.stringify({
        result: {
          artifactId: 'artifact-json-unit',
          slug: 'cli-json-unit',
          url: '/artifacts/cli-json-unit',
          revisionId: 'revision-json-unit',
          claimToken: 'docscn_claim_json_unit',
        },
      }),
    );
    return;
  }

  if (request.url === '/api/artifacts/cli-json-unit') {
    assert.equal(request.headers.authorization, undefined);
    response.setHeader('content-type', 'application/json');
    response.end(
      JSON.stringify({
        artifact: {
          id: 'artifact-json-unit',
          slug: 'cli-json-unit',
          currentRevisionId: 'revision-json-unit',
          metadata: { title: 'CLI JSON unit' },
        },
        threads: [],
      }),
    );
    return;
  }

  if (request.url === '/api/artifacts/cli-json-unit/feedback') {
    assert.equal(request.headers.authorization, undefined);
    response.setHeader('content-type', 'application/json');
    response.end(
      JSON.stringify({
        bundle: {
          artifact: { id: 'artifact-json-unit', title: 'CLI JSON unit' },
          revision: { id: 'revision-json-unit', version: 1 },
          openThreads: [],
        },
        prompt: 'No feedback yet.',
      }),
    );
    return;
  }

  response.statusCode = 404;
  response.end('not found');
});
await new Promise((resolve) =>
  cliPublishServer.listen(0, '127.0.0.1', resolve),
);
const cliPublishAddress = cliPublishServer.address();
const cliPublishHost = `http://127.0.0.1:${cliPublishAddress.port}`;

try {
  const publishLogs = await captureLogs(() =>
    runDocscnCli([
      'publish',
      goodHtmlPath,
      '--host',
      cliPublishHost,
      '--title',
      'CLI JSON unit',
      '--json',
    ]),
  );
  const published = JSON.parse(publishLogs.join('\n'));
  assert.equal(published.anonymous, true);
  assert.equal(published.claimReceiptSaved, true);
  assert.equal(published.url, `${cliPublishHost}/artifacts/cli-json-unit`);
  assert.deepEqual(published.nextCommands, [
    `docscn login --host ${cliPublishHost}`,
  ]);

  const artifactLogs = await captureLogs(() =>
    getArtifactFromCli(['cli-json-unit', '--host', cliPublishHost, '--json']),
  );
  assert.equal(
    JSON.parse(artifactLogs.join('\n')).artifact.id,
    published.artifactId,
  );

  const feedbackLogs = await captureLogs(() =>
    getArtifactFeedbackFromCli([
      'cli-json-unit',
      '--host',
      cliPublishHost,
      '--json',
    ]),
  );
  assert.equal(JSON.parse(feedbackLogs.join('\n')).prompt, 'No feedback yet.');
  assert.ok(
    cliReadRequests.every((request) => request.authorization === undefined),
  );
} finally {
  await new Promise((resolve) => cliPublishServer.close(resolve));
}

const cliAuthenticatedServer = createServer(async (request, response) => {
  assert.equal(request.headers.authorization, 'Bearer docscn_sk_unit');

  if (request.url === '/api/artifacts' && request.method === 'POST') {
    response.statusCode = 201;
    response.setHeader('content-type', 'application/json');
    response.end(
      JSON.stringify({
        result: {
          artifactId: 'artifact-auth-unit',
          slug: 'cli-auth-unit',
          url: '/artifacts/cli-auth-unit',
          revisionId: 'revision-auth-unit',
          claimToken: 'docscn_claim_should_not_save',
        },
      }),
    );
    return;
  }

  if (
    request.url === '/api/artifacts/revise-json-unit/revisions' &&
    request.method === 'POST'
  ) {
    response.setHeader('content-type', 'application/json');
    response.end(JSON.stringify({ ok: true }));
    return;
  }

  response.statusCode = 404;
  response.end('not found');
});
await new Promise((resolve) =>
  cliAuthenticatedServer.listen(0, '127.0.0.1', resolve),
);
const cliAuthenticatedAddress = cliAuthenticatedServer.address();
const cliAuthenticatedHost = `http://127.0.0.1:${cliAuthenticatedAddress.port}`;

try {
  const authenticatedPublishLogs = await captureLogs(() =>
    runDocscnCli([
      'publish',
      goodHtmlPath,
      '--host',
      cliAuthenticatedHost,
      '--api-key',
      'docscn_sk_unit',
      '--title',
      'Authenticated JSON unit',
      '--json',
    ]),
  );
  const authenticatedPublish = JSON.parse(authenticatedPublishLogs.join('\n'));
  assert.equal(authenticatedPublish.anonymous, false);
  assert.equal(authenticatedPublish.claimReceiptSaved, false);

  const revisionLogs = await captureLogs(() =>
    runDocscnCli([
      'revise',
      'revise-json-unit',
      goodHtmlPath,
      '--host',
      cliAuthenticatedHost,
      '--api-key',
      'docscn_sk_unit',
      '--summary',
      'Exercise JSON response',
      '--json',
    ]),
  );
  assert.equal(JSON.parse(revisionLogs.join('\n')).ok, true);
} finally {
  await new Promise((resolve) => cliAuthenticatedServer.close(resolve));
}

await assertRejectsWith(
  () =>
    shareArtifactFromCli([
      'artifact-unit',
      '--host',
      'http://localhost:3000',
      '--email',
      'reviewer@example.com',
      '--role',
      'editor',
    ]),
  /Invalid role/,
);

const cliShareState = [];
const cliShareServer = createServer(async (request, response) => {
  if (request.headers.authorization !== 'Bearer docscn_sk_unit') {
    response.statusCode = 401;
    response.setHeader('content-type', 'application/json');
    response.end(JSON.stringify({ error: 'Invalid API key.' }));
    return;
  }

  if (request.url === '/api/artifacts/artifact-unit/shares') {
    response.setHeader('content-type', 'application/json');

    if (request.method === 'GET') {
      response.end(JSON.stringify({ shares: cliShareState }));
      return;
    }

    const chunks = [];
    for await (const chunk of request) {
      chunks.push(chunk);
    }
    const body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');

    if (request.method === 'POST') {
      const share = {
        id: 'share-cli-unit',
        artifactId: 'artifact-unit',
        email: body.email,
        role: body.role,
        createdAt: new Date().toISOString(),
      };
      cliShareState.splice(0, cliShareState.length, share);
      response.statusCode = 201;
      response.end(JSON.stringify({ share }));
      return;
    }

    if (request.method === 'DELETE') {
      cliShareState.splice(0, cliShareState.length);
      response.end(JSON.stringify({ ok: true }));
      return;
    }
  }

  response.statusCode = 404;
  response.end('not found');
});
await new Promise((resolve) => cliShareServer.listen(0, '127.0.0.1', resolve));
const cliShareAddress = cliShareServer.address();
const cliShareHost = `http://127.0.0.1:${cliShareAddress.port}`;

try {
  const addShareLogs = await captureLogs(() =>
    shareArtifactFromCli([
      'artifact-unit',
      '--host',
      cliShareHost,
      '--api-key',
      'docscn_sk_unit',
      '--email',
      'Reviewer@Example.com',
      '--role',
      'commenter',
    ]),
  );
  assert.match(addShareLogs.join('\n'), /reviewer@example.com as commenter/);

  const listShareLogs = await captureLogs(() =>
    shareArtifactFromCli([
      'artifact-unit',
      '--host',
      cliShareHost,
      '--api-key',
      'docscn_sk_unit',
      '--role',
      'editor',
    ]),
  );
  assert.match(listShareLogs.join('\n'), /reviewer@example.com {2}commenter/);

  const removeShareLogs = await captureLogs(() =>
    shareArtifactFromCli([
      'artifact-unit',
      '--host',
      cliShareHost,
      '--api-key',
      'docscn_sk_unit',
      '--email',
      'reviewer@example.com',
      '--remove',
      '--role',
      'editor',
    ]),
  );
  assert.match(removeShareLogs.join('\n'), /Removed reviewer@example.com/);
} finally {
  await new Promise((resolve) => cliShareServer.close(resolve));
}

const logs = await captureLogs(() => runDocscnCli(['help']));
assert.ok(logs.join('\n').includes('Host, share, and collaborate'));

console.log('cli unit ok');
