import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
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
const { getCliHelp, publishArtifactFromCli, runDocscnCli } = await import(
  '../dist/packages/cli/src/lib/cli.js'
);

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
