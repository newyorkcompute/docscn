import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
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
  getCliHelp,
  getTemplateFromCli,
  listTemplatesFromCli,
  publishArtifactFromCli,
  runDocscnCli,
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
assert.match(help, /docscn revise/);
assert.match(help, /docscn template list/);
assert.match(help, /docscn template get/);

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

const logs = await captureLogs(() => runDocscnCli(['help']));
assert.ok(logs.join('\n').includes('Host, share, and collaborate'));

console.log('cli unit ok');
