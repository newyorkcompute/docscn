import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { basename, extname } from 'node:path';
import type {
  ArtifactKind,
  ArtifactVisibility,
  CreateArtifactInput,
  ReviewThreadStatus,
} from '@docscn/sdk';
import {
  findProfileForHost,
  getConfigPath,
  normalizeHost,
  readCliConfig,
  saveDefaultProfile,
} from './config.js';

export const commands = [
  'artifact',
  'comment',
  'help',
  'login',
  'publish',
  'revise',
  'thread',
  'version',
  'whoami',
] as const;

export type DocscnCommand = (typeof commands)[number];
export const docscnCliVersion = '0.0.1';

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
const cliThreadStatusOptions = ['open', 'needs-revision', 'resolved'] as const;
const valueFlags = new Set([
  '--anchor-label',
  '--anchor-x',
  '--anchor-y',
  '--api-key',
  '--author',
  '--body',
  '--description',
  '--host',
  '--kind',
  '--requested-change',
  '--resolve',
  '--revision',
  '--status',
  '--summary',
  '--title',
  '--url',
  '--visibility',
]);

interface CliPublishOptions {
  filePath: string;
  apiKey?: string;
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

interface ApiErrorResponse {
  error?: string;
}

interface CliLoginStartResponse extends ApiErrorResponse {
  deviceCode?: string;
  userCode?: string;
  verificationUrl?: string;
  expiresAt?: string;
  intervalSeconds?: number;
}

interface CliLoginPollResponse extends ApiErrorResponse {
  status?:
    | 'pending'
    | 'approved'
    | 'expired'
    | 'not-found'
    | 'already-consumed';
  token?: string;
}

interface WhoamiResponse extends ApiErrorResponse {
  principal?: {
    kind: 'api-key' | 'session';
    name?: string;
    userId: string;
  };
}

interface ArtifactResponse extends ApiErrorResponse {
  artifact?: {
    id: string;
    slug: string;
    currentRevisionId: string;
    metadata: {
      title: string;
    };
  };
  threads?: Array<{
    id: string;
    status: ReviewThreadStatus;
    title: string;
  }>;
}

interface ArtifactFeedbackResponse extends ApiErrorResponse {
  bundle?: {
    artifact: {
      id: string;
      title: string;
    };
    revision: {
      id: string;
      version: number;
    };
    openThreads: Array<{
      id: string;
      status: ReviewThreadStatus;
      title: string;
    }>;
  };
  prompt?: string;
}

interface RevisionResponse extends ApiErrorResponse {
  revision?: {
    id: string;
    version: number;
    summary: string;
  };
}

interface ThreadResponse extends ApiErrorResponse {
  thread?: {
    id: string;
    status: ReviewThreadStatus;
    title: string;
  };
}

interface CommentResponse extends ApiErrorResponse {
  comment?: {
    id: string;
  };
}

interface Credentials {
  apiKey: string;
  baseUrl: string;
}

interface PublishTarget {
  apiKey?: string;
  baseUrl: string;
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

function collectFlagValues(args: string[], name: string) {
  return args.reduce<string[]>((values, arg, index) => {
    if (arg === name && args[index + 1]) {
      values.push(args[index + 1]);
    }

    return values;
  }, []);
}

function getPositionals(args: string[]) {
  const positionals: string[] = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg.startsWith('-')) {
      if (valueFlags.has(arg)) {
        index += 1;
      }
      continue;
    }

    positionals.push(arg);
  }

  return positionals;
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

function parseThreadStatus(value: string): ReviewThreadStatus {
  if (cliThreadStatusOptions.includes(value as ReviewThreadStatus)) {
    return value as ReviewThreadStatus;
  }

  throw new Error(
    `Invalid status "${value}". Expected one of: ${cliThreadStatusOptions.join(', ')}`,
  );
}

function parseCoordinate(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid coordinate "${value}".`);
  }

  return parsed;
}

async function resolveCredentials(args: string[]): Promise<Credentials> {
  const config = await readCliConfig();
  const baseUrl = normalizeHost(
    parseFlagValue(args, '--host') ??
      parseFlagValue(args, '--url') ??
      process.env['DOCSCN_URL'] ??
      config?.defaultHost ??
      'http://localhost:3000',
  );
  const apiKey =
    parseFlagValue(args, '--api-key') ??
    process.env['DOCSCN_API_KEY'] ??
    findProfileForHost(config, baseUrl)?.apiKey;

  if (!apiKey) {
    throw new Error(
      `Missing API key. Run "docscn login --host ${baseUrl}" or set DOCSCN_API_KEY.`,
    );
  }

  return { apiKey, baseUrl };
}

async function resolvePublishTarget(args: string[]): Promise<PublishTarget> {
  const config = await readCliConfig();
  const baseUrl = normalizeHost(
    parseFlagValue(args, '--host') ??
      parseFlagValue(args, '--url') ??
      process.env['DOCSCN_URL'] ??
      config?.defaultHost ??
      'http://localhost:3000',
  );
  const apiKey =
    parseFlagValue(args, '--api-key') ??
    process.env['DOCSCN_API_KEY'] ??
    findProfileForHost(config, baseUrl)?.apiKey;

  return { apiKey, baseUrl };
}

async function parsePublishOptions(args: string[]): Promise<CliPublishOptions> {
  const [filePath] = getPositionals(args);

  if (!filePath) {
    throw new Error('Missing artifact HTML file path.');
  }

  const target = await resolvePublishTarget(args);
  const visibility = parseVisibility(
    parseFlagValue(args, '--visibility') ?? 'unlisted',
  );

  if (!target.apiKey && visibility !== 'unlisted') {
    throw new Error(
      `Anonymous publish only supports unlisted artifacts. Run "docscn login --host ${target.baseUrl}" to publish ${visibility} artifacts.`,
    );
  }

  return {
    filePath,
    apiKey: target.apiKey,
    baseUrl: target.baseUrl,
    title: parseFlagValue(args, '--title'),
    description:
      parseFlagValue(args, '--description') ?? 'Published from docscn CLI.',
    visibility,
    authorName: parseFlagValue(args, '--author') ?? 'docscn CLI',
    kind: parseKind(parseFlagValue(args, '--kind') ?? 'custom-html'),
  };
}

async function readJsonResponse<T>(response: Response): Promise<T | null> {
  return response.json().catch(() => null) as Promise<T | null>;
}

async function apiFetch<T>(
  credentials: Credentials,
  path: string,
  init: RequestInit = {},
) {
  const response = await fetch(`${credentials.baseUrl}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${credentials.apiKey}`,
      'content-type': 'application/json',
      ...init.headers,
    },
  });
  const payload = await readJsonResponse<T & ApiErrorResponse>(response);

  if (!response.ok) {
    throw new Error(
      payload?.error ?? `Request failed with ${response.status}.`,
    );
  }

  return payload;
}

function openBrowser(url: string) {
  const command =
    process.platform === 'darwin'
      ? 'open'
      : process.platform === 'win32'
        ? 'cmd'
        : 'xdg-open';
  const args = process.platform === 'win32' ? ['/c', 'start', '', url] : [url];
  const child = spawn(command, args, {
    detached: true,
    stdio: 'ignore',
  });

  child.unref();
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildArtifactUrl(baseUrl: string, pathOrUrl: string) {
  return pathOrUrl.startsWith('http') ? pathOrUrl : `${baseUrl}${pathOrUrl}`;
}

export function getCliHelp() {
  return `docscn

Host, share, and collaborate on AI-generated HTML artifacts.

Usage:
  docscn --version
  docscn login [--host <url>]
  docscn whoami [--host <url>]
  docscn publish artifact.html [options]
  docscn artifact get <artifact-id-or-slug> [--json]
  docscn artifact feedback <artifact-id-or-slug> [--json] [--revision <revision-id>]
  docscn revise <artifact-id-or-slug> artifact.html --summary <text> [--resolve <thread-id>]
  docscn thread create <artifact-id-or-slug> --title <text> --body <text>
  docscn comment <thread-id> --body <text>

Options:
  --api-key <key>          API key. Defaults to DOCSCN_API_KEY or ~/.docscn/config.json. Publish can run without this for unlisted view-only artifacts.
  --host, --url <url>      docscn server URL. Defaults to DOCSCN_URL, saved config, or http://localhost:3000.
  --title <title>          Artifact title. Defaults to the file name.
  --description <text>     Artifact description.
  --visibility <value>     public, unlisted, or private. Defaults to unlisted.
  --kind <value>           Artifact kind. Defaults to custom-html.
  --author <name>          Artifact author/agent name. Defaults to docscn CLI.
  --summary <text>         Revision summary.
  --resolve <thread-id>    Mark a thread resolved when revising. Repeatable.
  --json                   Print machine-readable JSON for supported commands.

Examples:
  docscn login --host http://localhost:3000
  docscn publish report.html --host http://localhost:3000
  docscn publish report.html --visibility private
  docscn artifact get artifact-slug --json
  docscn artifact feedback artifact-slug --json
  docscn revise artifact-slug report.html --summary "Addressed open feedback" --resolve thread-123`;
}

export async function publishArtifactFromCli(args: string[]) {
  const options = await parsePublishOptions(args);
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
      ...(options.apiKey ? { authorization: `Bearer ${options.apiKey}` } : {}),
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const result = await readJsonResponse<PublishResponse>(response);

  if (!response.ok) {
    throw new Error(result?.error ?? `Publish failed with ${response.status}.`);
  }

  if (!result?.result) {
    throw new Error('Publish response did not include artifact details.');
  }

  if (!options.apiKey) {
    console.warn(
      'Published as an anonymous unlisted artifact. Sign in with "docscn login" to unlock comments, revisions, private sharing, and future analytics.',
    );
  }

  return {
    artifactId: result.result.artifactId,
    revisionId: result.result.revisionId,
    url: buildArtifactUrl(options.baseUrl, result.result.url),
  };
}

export async function loginFromCli(args: string[]) {
  const config = await readCliConfig();
  const baseUrl = normalizeHost(
    parseFlagValue(args, '--host') ??
      parseFlagValue(args, '--url') ??
      process.env['DOCSCN_URL'] ??
      config?.defaultHost ??
      'http://localhost:3000',
  );
  const response = await fetch(`${baseUrl}/api/cli/auth/start`, {
    method: 'POST',
  });
  const login = await readJsonResponse<CliLoginStartResponse>(response);

  if (
    !response.ok ||
    !login?.deviceCode ||
    !login.userCode ||
    !login.verificationUrl ||
    !login.expiresAt
  ) {
    throw new Error(login?.error ?? `Login failed with ${response.status}.`);
  }

  console.log(`Opening ${login.verificationUrl}`);
  console.log(`Code: ${login.userCode}`);

  try {
    openBrowser(login.verificationUrl);
  } catch {
    console.log('Could not open a browser automatically.');
  }

  const intervalMs = (login.intervalSeconds ?? 2) * 1000;

  while (Date.now() < Date.parse(login.expiresAt)) {
    await sleep(intervalMs);

    const pollResponse = await fetch(`${baseUrl}/api/cli/auth/poll`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ deviceCode: login.deviceCode }),
    });
    const poll = await readJsonResponse<CliLoginPollResponse>(pollResponse);

    if (poll?.status === 'pending') {
      continue;
    }

    if (poll?.status === 'approved' && poll.token) {
      await saveDefaultProfile({ apiKey: poll.token, host: baseUrl });
      console.log(`Saved docscn credentials to ${getConfigPath()}`);
      return;
    }

    throw new Error(poll?.error ?? `Login ${poll?.status ?? 'failed'}.`);
  }

  throw new Error('Login expired. Run docscn login again.');
}

export async function whoamiFromCli(args: string[]) {
  const credentials = await resolveCredentials(args);
  const result = await apiFetch<WhoamiResponse>(credentials, '/api/me');

  if (!result?.principal) {
    throw new Error('whoami response did not include a principal.');
  }

  console.log(
    `Signed in to ${credentials.baseUrl} as ${result.principal.name ?? result.principal.userId}`,
  );
  console.log(`Principal: ${result.principal.kind}`);
}

export async function getArtifactFromCli(args: string[]) {
  const [artifactId] = getPositionals(args);

  if (!artifactId) {
    throw new Error('Missing artifact id or slug.');
  }

  const credentials = await resolveCredentials(args);
  const result = await apiFetch<ArtifactResponse>(
    credentials,
    `/api/artifacts/${encodeURIComponent(artifactId)}`,
  );

  if (hasFlag(args, '--json')) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (!result?.artifact) {
    throw new Error('Artifact response did not include artifact details.');
  }

  console.log(`${result.artifact.metadata.title}`);
  console.log(`Artifact: ${result.artifact.id}`);
  console.log(`Revision: ${result.artifact.currentRevisionId}`);
  console.log(
    `Open threads: ${(result.threads ?? []).filter((thread) => thread.status !== 'resolved').length}`,
  );
}

export async function getArtifactFeedbackFromCli(args: string[]) {
  const [artifactId] = getPositionals(args);

  if (!artifactId) {
    throw new Error('Missing artifact id or slug.');
  }

  const credentials = await resolveCredentials(args);
  const revisionId = parseFlagValue(args, '--revision');
  const query = revisionId
    ? `?revisionId=${encodeURIComponent(revisionId)}`
    : '';
  const result = await apiFetch<ArtifactFeedbackResponse>(
    credentials,
    `/api/artifacts/${encodeURIComponent(artifactId)}/feedback${query}`,
  );

  if (hasFlag(args, '--json')) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (!result?.prompt) {
    throw new Error('Feedback response did not include a prompt.');
  }

  console.log(result.prompt);
}

export async function reviseArtifactFromCli(args: string[]) {
  const [artifactId, filePath] = getPositionals(args);
  const summary = parseFlagValue(args, '--summary');

  if (!artifactId || !filePath) {
    throw new Error(
      'Usage: docscn revise <artifact-id-or-slug> artifact.html --summary <text>',
    );
  }

  if (!summary) {
    throw new Error('Missing --summary for revision.');
  }

  const credentials = await resolveCredentials(args);
  const html = await readFile(filePath, 'utf8');

  if (!html.toLowerCase().includes('<html')) {
    throw new Error(
      'Revision file must be self-contained HTML including <html>.',
    );
  }

  const result = await apiFetch<RevisionResponse>(
    credentials,
    `/api/artifacts/${encodeURIComponent(artifactId)}/revisions`,
    {
      method: 'POST',
      body: JSON.stringify({
        authorName: parseFlagValue(args, '--author') ?? 'docscn CLI',
        html,
        resolvedThreadIds: collectFlagValues(args, '--resolve'),
        source: 'cli',
        summary,
      }),
    },
  );

  if (!result?.revision) {
    throw new Error('Revision response did not include revision details.');
  }

  console.log(`Revision ${result.revision.id}`);
  console.log(`Version ${result.revision.version}`);
}

export async function createThreadFromCli(args: string[]) {
  const [artifactId] = getPositionals(args);
  const title = parseFlagValue(args, '--title');
  const body = parseFlagValue(args, '--body');

  if (!artifactId || !title || !body) {
    throw new Error(
      'Usage: docscn thread create <artifact-id-or-slug> --title <text> --body <text>',
    );
  }

  const credentials = await resolveCredentials(args);
  const result = await apiFetch<ThreadResponse>(
    credentials,
    `/api/artifacts/${encodeURIComponent(artifactId)}/threads`,
    {
      method: 'POST',
      body: JSON.stringify({
        anchorLabel: parseFlagValue(args, '--anchor-label'),
        anchorX: parseCoordinate(parseFlagValue(args, '--anchor-x')),
        anchorY: parseCoordinate(parseFlagValue(args, '--anchor-y')),
        authorName: parseFlagValue(args, '--author') ?? 'docscn CLI',
        body,
        requestedChange: parseFlagValue(args, '--requested-change'),
        role: 'agent',
        status: parseThreadStatus(parseFlagValue(args, '--status') ?? 'open'),
        title,
      }),
    },
  );

  if (!result?.thread) {
    throw new Error('Thread response did not include thread details.');
  }

  console.log(`Thread ${result.thread.id}`);
  console.log(`Status ${result.thread.status}`);
}

export async function createCommentFromCli(args: string[]) {
  const [threadId] = getPositionals(args);
  const body = parseFlagValue(args, '--body');

  if (!threadId || !body) {
    throw new Error('Usage: docscn comment <thread-id> --body <text>');
  }

  const credentials = await resolveCredentials(args);
  const result = await apiFetch<CommentResponse>(
    credentials,
    `/api/review-threads/${encodeURIComponent(threadId)}/comments`,
    {
      method: 'POST',
      body: JSON.stringify({
        authorName: parseFlagValue(args, '--author') ?? 'docscn CLI',
        body,
        role: 'agent',
      }),
    },
  );

  if (!result?.comment) {
    throw new Error('Comment response did not include comment details.');
  }

  console.log(`Comment ${result.comment.id}`);
}

export async function runDocscnCli(args = process.argv.slice(2)) {
  const [command, ...rest] = args;

  if (command === 'version' || command === '--version' || command === '-v') {
    console.log(`docscn ${docscnCliVersion}`);
    return;
  }

  if (!command || command === 'help' || hasFlag(args, '--help')) {
    console.log(getCliHelp());
    return;
  }

  if (command === 'login') {
    await loginFromCli(rest);
    return;
  }

  if (command === 'whoami') {
    await whoamiFromCli(rest);
    return;
  }

  if (command === 'publish') {
    const published = await publishArtifactFromCli(rest);

    console.log(`Published ${published.artifactId}`);
    console.log(`Revision ${published.revisionId}`);
    console.log(published.url);
    return;
  }

  if (command === 'artifact' && rest[0] === 'get') {
    await getArtifactFromCli(rest.slice(1));
    return;
  }

  if (command === 'artifact' && rest[0] === 'feedback') {
    await getArtifactFeedbackFromCli(rest.slice(1));
    return;
  }

  if (command === 'revise') {
    await reviseArtifactFromCli(rest);
    return;
  }

  if (command === 'thread' && rest[0] === 'create') {
    await createThreadFromCli(rest.slice(1));
    return;
  }

  if (command === 'comment') {
    await createCommentFromCli(rest);
    return;
  }

  throw new Error(`Unknown command "${args.join(' ')}". Run docscn help.`);
}
