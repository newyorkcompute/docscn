import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

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
  });
}
