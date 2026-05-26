import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import type { AnonymousClaimReceipt } from '@docscn/sdk';

export interface DocscnCliProfile {
  apiKey: string;
  host: string;
}

export interface DocscnCliConfig {
  defaultHost: string;
  profiles: Record<string, DocscnCliProfile>;
  anonymousClaims?: Record<string, AnonymousClaimReceipt[]>;
  updateCheck?: {
    checkedAt: string;
    latestVersion?: string;
  };
}

export function normalizeHost(value: string) {
  return value.replace(/\/+$/, '');
}

export function getConfigPath() {
  return join(
    process.env['DOCSCN_CONFIG_DIR'] ?? homedir(),
    '.docscn',
    'config.json',
  );
}

export async function readCliConfig(): Promise<DocscnCliConfig | undefined> {
  try {
    return JSON.parse(
      await readFile(getConfigPath(), 'utf8'),
    ) as DocscnCliConfig;
  } catch {
    return undefined;
  }
}

export async function writeCliConfig(config: DocscnCliConfig) {
  const configPath = getConfigPath();

  await mkdir(dirname(configPath), { mode: 0o700, recursive: true });
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, {
    mode: 0o600,
  });
}

export function findProfileForHost(
  config: DocscnCliConfig | undefined,
  host: string,
) {
  if (!config) {
    return undefined;
  }

  return Object.values(config.profiles).find(
    (profile) => normalizeHost(profile.host) === normalizeHost(host),
  );
}

export async function saveDefaultProfile(input: DocscnCliProfile) {
  const existing = await readCliConfig();
  const host = normalizeHost(input.host);

  await writeCliConfig({
    defaultHost: host,
    profiles: {
      ...(existing?.profiles ?? {}),
      default: {
        apiKey: input.apiKey,
        host,
      },
    },
    anonymousClaims: existing?.anonymousClaims,
    updateCheck: existing?.updateCheck,
  });
}

export async function saveAnonymousClaimReceipt(
  hostValue: string,
  receipt: AnonymousClaimReceipt,
) {
  const existing = await readCliConfig();
  const host = normalizeHost(hostValue);
  const claimsForHost = existing?.anonymousClaims?.[host] ?? [];

  await writeCliConfig({
    defaultHost: existing?.defaultHost ?? host,
    profiles: existing?.profiles ?? {},
    anonymousClaims: {
      ...(existing?.anonymousClaims ?? {}),
      [host]: [
        ...claimsForHost.filter(
          (claim) => claim.artifactId !== receipt.artifactId,
        ),
        receipt,
      ],
    },
    updateCheck: existing?.updateCheck,
  });
}

export async function getAnonymousClaimReceipts(hostValue: string) {
  const config = await readCliConfig();
  const host = normalizeHost(hostValue);

  return config?.anonymousClaims?.[host] ?? [];
}

export async function removeAnonymousClaimReceipts(
  hostValue: string,
  artifactIds: string[],
) {
  const existing = await readCliConfig();
  if (!existing?.anonymousClaims) {
    return;
  }

  const host = normalizeHost(hostValue);
  const completed = new Set(artifactIds);
  const remaining = (existing.anonymousClaims[host] ?? []).filter(
    (receipt) => !completed.has(receipt.artifactId),
  );

  await writeCliConfig({
    ...existing,
    anonymousClaims: {
      ...existing.anonymousClaims,
      [host]: remaining,
    },
  });
}
