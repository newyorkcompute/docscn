import { createHash } from 'node:crypto';
import {
  chmod,
  mkdtemp,
  readFile,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { readCliConfig, writeCliConfig } from './config.js';
import { docscnCliVersion } from './version.js';
import { defaultDocscnHost, hasFlag, parseFlagValue } from './args.js';

const releaseRepository = 'newyorkcompute/docscn';
const updateCheckTimeoutMs = 1500;
const updateNoticeIntervalMs = 24 * 60 * 60 * 1000;

interface GitHubReleaseResponse {
  tag_name?: string;
}

interface CliUpdateCheck {
  currentVersion: string;
  latestVersion: string;
  updateAvailable: boolean;
}

interface CliUpdateResult extends CliUpdateCheck {
  assetName: string;
  binaryPath: string;
}

function normalizeVersion(value: string) {
  return value.trim().replace(/^v/i, '');
}

function normalizeReleaseTag(value: string) {
  const normalized = value.trim();

  return normalized.toLowerCase().startsWith('v')
    ? normalized
    : `v${normalized}`;
}

function compareVersions(left: string, right: string) {
  const leftParts = normalizeVersion(left).split('.').map(Number);
  const rightParts = normalizeVersion(right).split('.').map(Number);
  const partCount = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < partCount; index += 1) {
    const leftPart = Number.isFinite(leftParts[index]) ? leftParts[index] : 0;
    const rightPart = Number.isFinite(rightParts[index])
      ? rightParts[index]
      : 0;

    if (leftPart > rightPart) {
      return 1;
    }

    if (leftPart < rightPart) {
      return -1;
    }
  }

  return 0;
}

function detectPlatform() {
  if (process.platform === 'darwin' || process.platform === 'linux') {
    return process.platform;
  }

  throw new Error(`Unsupported operating system: ${process.platform}`);
}

function detectArch() {
  if (process.arch === 'arm64') {
    return 'arm64';
  }

  if (process.arch === 'x64') {
    return 'x64';
  }

  throw new Error(`Unsupported CPU architecture: ${process.arch}`);
}

function getAssetName() {
  return `docscn-${detectPlatform()}-${detectArch()}`;
}

function getReleaseMetadataUrl() {
  return (
    process.env['DOCSCN_RELEASE_METADATA_URL'] ??
    `https://api.github.com/repos/${
      process.env['DOCSCN_RELEASE_REPOSITORY'] ?? releaseRepository
    }/releases/latest`
  );
}

function getReleaseDownloadBase(version: string) {
  const override = process.env['DOCSCN_RELEASE_DOWNLOAD_BASE_URL'];

  if (override) {
    return override.replace(/\/+$/, '');
  }

  const repository =
    process.env['DOCSCN_RELEASE_REPOSITORY'] ?? releaseRepository;
  const tag = normalizeReleaseTag(version);

  return `https://github.com/${repository}/releases/download/${tag}`;
}

async function fetchWithTimeout(url: string, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      headers: {
        accept: 'application/json',
        'user-agent': `docscn-cli/${docscnCliVersion}`,
      },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchLatestVersion() {
  const response = await fetchWithTimeout(
    getReleaseMetadataUrl(),
    updateCheckTimeoutMs,
  );
  const payload = (await response
    .json()
    .catch(() => null)) as GitHubReleaseResponse | null;

  if (!response.ok || !payload?.tag_name) {
    throw new Error(
      `Could not check latest docscn release (${response.status}).`,
    );
  }

  return normalizeVersion(payload.tag_name);
}

async function downloadFile(url: string, outputPath: string) {
  const response = await fetch(url, {
    headers: {
      'user-agent': `docscn-cli/${docscnCliVersion}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Download failed with ${response.status}: ${url}`);
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  await writeFile(outputPath, bytes);
}

function sha256(value: Buffer) {
  return createHash('sha256').update(value).digest('hex');
}

async function verifyChecksum(
  binaryPath: string,
  assetName: string,
  sumsPath: string,
) {
  const sums = await readFile(sumsPath, 'utf8');
  const line = sums
    .split('\n')
    .find((candidate) => candidate.trim().endsWith(`  ${assetName}`));
  const expected = line?.trim().split(/\s+/)[0];

  if (!expected) {
    throw new Error(`SHA256SUMS did not include ${assetName}.`);
  }

  const actual = sha256(await readFile(binaryPath));

  if (actual !== expected) {
    throw new Error(`Checksum verification failed for ${assetName}.`);
  }
}

function isPackagedBinary() {
  return Boolean((process as NodeJS.Process & { pkg?: unknown }).pkg);
}

function getUpdateBinaryPath() {
  const override = process.env['DOCSCN_UPDATE_BINARY_PATH'];

  if (override) {
    return override;
  }

  if (isPackagedBinary()) {
    return process.execPath;
  }

  throw new Error(
    'Self-update is only available for the installed docscn release binary. To update this checkout, pull the repository or rerun the installer.',
  );
}

async function replaceBinary(currentPath: string, nextPath: string) {
  const backupPath = `${currentPath}.bak-${process.pid}`;
  let backedUp = false;

  try {
    await rename(currentPath, backupPath);
    backedUp = true;
    await rename(nextPath, currentPath);
  } catch (error) {
    if (backedUp) {
      await rename(backupPath, currentPath).catch(() => undefined);
    }

    throw error;
  }

  await rm(backupPath, { force: true });
}

export async function checkForCliUpdate(): Promise<CliUpdateCheck> {
  const latestVersion = await fetchLatestVersion();

  return {
    currentVersion: docscnCliVersion,
    latestVersion,
    updateAvailable: compareVersions(docscnCliVersion, latestVersion) < 0,
  };
}

export async function updateCliFromCli(
  args: string[],
): Promise<CliUpdateResult | undefined> {
  const requestedVersion = parseFlagValue(args, '--version');
  const checkOnly = hasFlag(args, '--check');
  const json = hasFlag(args, '--json');
  const check = requestedVersion
    ? {
        currentVersion: docscnCliVersion,
        latestVersion: normalizeVersion(requestedVersion),
        updateAvailable:
          compareVersions(
            docscnCliVersion,
            normalizeVersion(requestedVersion),
          ) !== 0,
      }
    : await checkForCliUpdate();

  if (checkOnly) {
    if (json) {
      console.log(JSON.stringify(check, null, 2));
      return undefined;
    }

    if (check.updateAvailable) {
      console.log(
        `docscn ${check.latestVersion} is available. Current: ${check.currentVersion}. Run: docscn update`,
      );
    } else {
      console.log(`docscn ${check.currentVersion} is up to date.`);
    }

    return undefined;
  }

  if (!check.updateAvailable) {
    if (json) {
      console.log(JSON.stringify(check, null, 2));
    } else {
      console.log(`docscn ${check.currentVersion} is up to date.`);
    }

    return undefined;
  }

  const binaryPath = getUpdateBinaryPath();
  const assetName = getAssetName();
  const downloadBase = getReleaseDownloadBase(check.latestVersion);
  const installDir = dirname(binaryPath);
  const tmpDir = await mkdtemp(join(installDir || tmpdir(), '.docscn-update-'));
  const nextPath = join(tmpDir, 'docscn');
  const sumsPath = join(tmpDir, 'SHA256SUMS');

  try {
    await downloadFile(`${downloadBase}/${assetName}`, nextPath);
    await downloadFile(`${downloadBase}/SHA256SUMS`, sumsPath);
    await verifyChecksum(nextPath, assetName, sumsPath);
    await chmod(nextPath, 0o755);
    await replaceBinary(binaryPath, nextPath);
  } finally {
    await rm(tmpDir, { force: true, recursive: true });
  }

  const result = {
    ...check,
    assetName,
    binaryPath,
  };

  if (json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(
      `Updated docscn ${check.currentVersion} -> ${check.latestVersion}`,
    );
  }

  return result;
}

export async function maybeShowUpdateNotice(command: string | undefined) {
  if (
    !command ||
    command === 'help' ||
    command === 'update' ||
    command === 'version' ||
    command === '--version' ||
    command === '-v' ||
    process.env['CI'] ||
    process.env['DOCSCN_SKIP_UPDATE_CHECK'] ||
    !isPackagedBinary()
  ) {
    return;
  }

  try {
    const config = await readCliConfig();
    const lastCheckedAt = Date.parse(config?.updateCheck?.checkedAt ?? '');

    if (
      Number.isFinite(lastCheckedAt) &&
      Date.now() - lastCheckedAt < updateNoticeIntervalMs
    ) {
      return;
    }

    const check = await checkForCliUpdate();

    await writeCliConfig({
      defaultHost: config?.defaultHost ?? defaultDocscnHost,
      profiles: config?.profiles ?? {},
      anonymousClaims: config?.anonymousClaims,
      updateCheck: {
        checkedAt: new Date().toISOString(),
        latestVersion: check.latestVersion,
      },
    });

    if (check.updateAvailable) {
      console.warn(
        `docscn ${check.latestVersion} is available. Run "docscn update" to upgrade from ${check.currentVersion}.`,
      );
    }
  } catch {
    // Update notices should never block normal CLI commands.
  }
}
