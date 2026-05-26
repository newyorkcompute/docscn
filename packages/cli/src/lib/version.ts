import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

declare const DOCSCN_CLI_VERSION: string | undefined;

const require = createRequire(import.meta.url);

function readVersionFromPackage(): string {
  return require(
    join(dirname(fileURLToPath(import.meta.url)), '../../package.json'),
  ).version as string;
}

/** CLI version from package.json; release builds inject DOCSCN_CLI_VERSION at bundle time. */
export const docscnCliVersion: string =
  typeof DOCSCN_CLI_VERSION === 'string'
    ? DOCSCN_CLI_VERSION
    : readVersionFromPackage();
