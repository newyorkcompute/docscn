import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

export interface DocscnCredentials {
  apiKey?: string;
  baseUrl: string;
}

export interface DocscnCliProfile {
  apiKey: string;
  host: string;
}

export interface DocscnCliConfig {
  defaultHost: string;
  profiles: Record<string, DocscnCliProfile>;
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

export async function resolveDocscnCredentials(): Promise<DocscnCredentials> {
  const config = await readCliConfig();
  const baseUrl = normalizeHost(
    process.env['DOCSCN_URL'] ?? config?.defaultHost ?? 'http://localhost:3000',
  );
  const apiKey =
    process.env['DOCSCN_API_KEY'] ?? findProfileForHost(config, baseUrl)?.apiKey;

  return { apiKey, baseUrl };
}
