import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { chmod, mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
import { build } from 'esbuild';

const execFileAsync = promisify(execFile);
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const bundleDir = join(root, 'dist', 'cli-release');
const releasesDir = join(root, 'dist', 'releases');
const bundlePath = join(bundleDir, 'docscn.cjs');
const pkgBinary = join(
  root,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'pkg.cmd' : 'pkg',
);
const defaultTargets = [
  {
    assetName: 'docscn-darwin-arm64',
    pkgTarget: 'node20-macos-arm64',
  },
  {
    assetName: 'docscn-darwin-x64',
    pkgTarget: 'node20-macos-x64',
  },
  {
    assetName: 'docscn-linux-arm64',
    pkgTarget: 'node20-linux-arm64',
  },
  {
    assetName: 'docscn-linux-x64',
    pkgTarget: 'node20-linux-x64',
  },
];

function selectedTargets() {
  const requestedTargets = process.env.DOCSCN_RELEASE_TARGETS;

  if (!requestedTargets) {
    return defaultTargets;
  }

  const requestedAssets = new Set(
    requestedTargets
      .split(',')
      .map((target) => target.trim())
      .filter(Boolean),
  );

  return defaultTargets.filter((target) =>
    requestedAssets.has(target.assetName),
  );
}

function sha256File(filePath) {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256');
    const stream = createReadStream(filePath);

    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

async function main() {
  const targets = selectedTargets();

  if (!targets.length) {
    throw new Error(
      'No release targets selected. Check DOCSCN_RELEASE_TARGETS.',
    );
  }

  await rm(bundleDir, { force: true, recursive: true });
  await rm(releasesDir, { force: true, recursive: true });
  await mkdir(bundleDir, { recursive: true });
  await mkdir(releasesDir, { recursive: true });

  await build({
    bundle: true,
    entryPoints: [join(root, 'packages', 'cli', 'src', 'release-entry.ts')],
    format: 'cjs',
    outfile: bundlePath,
    platform: 'node',
    target: 'node20',
    tsconfig: join(root, 'tsconfig.base.json'),
  });
  await chmod(bundlePath, 0o755);

  for (const target of targets) {
    await execFileAsync(pkgBinary, [
      bundlePath,
      '--targets',
      target.pkgTarget,
      '--output',
      join(releasesDir, target.assetName),
      '--public-packages',
      '*',
    ]);
  }

  const checksums = await Promise.all(
    targets.map(async (target) => {
      const hash = await sha256File(join(releasesDir, target.assetName));

      return `${hash}  ${target.assetName}`;
    }),
  );

  await writeFile(join(releasesDir, 'SHA256SUMS'), `${checksums.join('\n')}\n`);
  console.log(`Wrote ${targets.length} release asset(s) to dist/releases`);
}

await main();
