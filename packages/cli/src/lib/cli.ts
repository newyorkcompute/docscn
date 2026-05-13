import { basename, extname } from 'node:path';
import { readFile } from 'node:fs/promises';
import type {
  ArtifactKind,
  ArtifactVisibility,
  CreateArtifactInput,
} from '@docscn/sdk';

export const commands = ['publish', 'help'] as const;

export type DocscnCommand = (typeof commands)[number];

const cliVisibilityOptions = ['public', 'unlisted', 'private'] as const;
const cliArtifactKinds = [
  'incident-timeline',
  'migration-plan',
  'generated-dashboard',
  'architecture-explainer',
  'animated-report',
  'ui-prototype',
  'pr-review',
  'custom-html',
] as const;

interface CliPublishOptions {
  filePath: string;
  apiKey: string;
  baseUrl: string;
  title?: string;
  description: string;
  visibility: ArtifactVisibility;
  authorName: string;
  kind: ArtifactKind;
}

interface PublishResponse {
  result?: {
    artifactId: string;
    slug: string;
    url: string;
    revisionId: string;
  };
  error?: string;
}

function parseFlagValue(args: string[], name: string) {
  const index = args.indexOf(name);

  if (index === -1) {
    return undefined;
  }

  return args[index + 1];
}

function hasFlag(args: string[], name: string) {
  return args.includes(name);
}

function normalizeBaseUrl(value: string) {
  return value.replace(/\/+$/, '');
}

function inferTitleFromPath(filePath: string) {
  const fileName = basename(filePath);
  const extension = extname(fileName);

  return extension ? fileName.slice(0, -extension.length) : fileName;
}

function parseVisibility(value: string): ArtifactVisibility {
  if (cliVisibilityOptions.includes(value as ArtifactVisibility)) {
    return value as ArtifactVisibility;
  }

  throw new Error(
    `Invalid visibility "${value}". Expected one of: ${cliVisibilityOptions.join(', ')}`,
  );
}

function parseKind(value: string): ArtifactKind {
  if (cliArtifactKinds.includes(value as ArtifactKind)) {
    return value as ArtifactKind;
  }

  throw new Error(
    `Invalid kind "${value}". Expected one of: ${cliArtifactKinds.join(', ')}`,
  );
}

function parsePublishOptions(args: string[]): CliPublishOptions {
  const filePath = args.find((arg) => !arg.startsWith('-'));

  if (!filePath) {
    throw new Error('Missing artifact HTML file path.');
  }

  const apiKey =
    parseFlagValue(args, '--api-key') ?? process.env['DOCSCN_API_KEY'];

  if (!apiKey) {
    throw new Error('Missing API key. Set DOCSCN_API_KEY or pass --api-key.');
  }

  return {
    filePath,
    apiKey,
    baseUrl: normalizeBaseUrl(
      parseFlagValue(args, '--url') ??
        process.env['DOCSCN_URL'] ??
        'http://localhost:3000',
    ),
    title: parseFlagValue(args, '--title'),
    description:
      parseFlagValue(args, '--description') ?? 'Published from docscn CLI.',
    visibility: parseVisibility(
      parseFlagValue(args, '--visibility') ?? 'unlisted',
    ),
    authorName: parseFlagValue(args, '--author') ?? 'docscn CLI',
    kind: parseKind(parseFlagValue(args, '--kind') ?? 'custom-html'),
  };
}

export function getCliHelp() {
  return `docscn

Publish and automate agent-generated HTML artifacts.

Usage:
  docscn publish artifact.html [options]

Options:
  --api-key <key>          API key. Defaults to DOCSCN_API_KEY.
  --url <url>              docscn server URL. Defaults to DOCSCN_URL or http://localhost:3000.
  --title <title>          Artifact title. Defaults to the file name.
  --description <text>     Artifact description.
  --visibility <value>     public, unlisted, or private. Defaults to unlisted.
  --kind <value>           Artifact kind. Defaults to custom-html.
  --author <name>          Artifact author/agent name. Defaults to docscn CLI.

Examples:
  DOCSCN_API_KEY=docscn_sk_... docscn publish artifact.html
  docscn publish report.html --url http://localhost:3000 --visibility private`;
}

export async function publishArtifactFromCli(args: string[]) {
  const options = parsePublishOptions(args);
  const html = await readFile(options.filePath, 'utf8');

  if (!html.toLowerCase().includes('<html')) {
    throw new Error(
      'Artifact file must be self-contained HTML including <html>.',
    );
  }

  const payload: CreateArtifactInput = {
    title: options.title ?? inferTitleFromPath(options.filePath),
    description: options.description,
    html,
    visibility: options.visibility,
    authorName: options.authorName,
    source: 'cli',
    kind: options.kind,
  };

  const response = await fetch(`${options.baseUrl}/api/artifacts`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${options.apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const result = (await response
    .json()
    .catch(() => null)) as PublishResponse | null;

  if (!response.ok) {
    throw new Error(result?.error ?? `Publish failed with ${response.status}.`);
  }

  if (!result?.result) {
    throw new Error('Publish response did not include artifact details.');
  }

  return {
    artifactId: result.result.artifactId,
    revisionId: result.result.revisionId,
    url: `${options.baseUrl}${result.result.url}`,
  };
}

export async function runDocscnCli(args = process.argv.slice(2)) {
  const [command, ...rest] = args;

  if (!command || command === 'help' || hasFlag(args, '--help')) {
    console.log(getCliHelp());
    return;
  }

  if (command !== 'publish') {
    throw new Error(`Unknown command "${command}". Run docscn help.`);
  }

  const published = await publishArtifactFromCli(rest);

  console.log(`Published ${published.artifactId}`);
  console.log(`Revision ${published.revisionId}`);
  console.log(published.url);
}
