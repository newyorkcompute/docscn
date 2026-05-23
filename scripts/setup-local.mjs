import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { copyFile, readFile, writeFile } from 'node:fs/promises';
import net from 'node:net';

const envExamplePath = '.env.example';
const envLocalPath = '.env.local';
const requiredEnvKeys = [
  'NEXT_PUBLIC_APP_URL',
  'BETTER_AUTH_SECRET',
  'BETTER_AUTH_URL',
  'DATABASE_URL',
  'S3_ENDPOINT',
  'S3_REGION',
  'S3_BUCKET',
  'S3_ACCESS_KEY_ID',
  'S3_SECRET_ACCESS_KEY',
];

function npmCommand() {
  return process.platform === 'win32' ? 'npm.cmd' : 'npm';
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: options.quiet ? 'ignore' : 'inherit',
      ...options,
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(' ')} exited with ${code}`));
    });
  });
}

async function commandWorks(command, args) {
  try {
    await run(command, args, { quiet: true });
    return true;
  } catch {
    return false;
  }
}

function parseEnvKeys(contents) {
  const keys = new Set();

  for (const line of contents.split('\n')) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=/);

    if (match?.[1]) {
      keys.add(match[1]);
    }
  }

  return keys;
}

function generateLocalSecret() {
  return `docscn-local-${randomBytes(32).toString('base64url')}`;
}

async function ensureEnvLocal() {
  const example = await readFile(envExamplePath, 'utf8');
  let local = '';

  try {
    local = await readFile(envLocalPath, 'utf8');
  } catch {
    local = example.replace(
      'BETTER_AUTH_SECRET=replace-with-at-least-32-random-characters',
      `BETTER_AUTH_SECRET=${generateLocalSecret()}`,
    );
    await writeFile(envLocalPath, local);
    console.log('Created .env.local from .env.example');
    return;
  }

  const exampleLines = example.split('\n');
  const localKeys = parseEnvKeys(local);
  const missingLines = exampleLines.filter((line) => {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=/);

    return match?.[1]
      ? requiredEnvKeys.includes(match[1]) && !localKeys.has(match[1])
      : false;
  });
  let nextLocal = local;

  if (missingLines.length) {
    nextLocal = `${nextLocal.trimEnd()}\n\n# Added by npm run setup:local\n${missingLines.join('\n')}\n`;
    console.log(
      `Added missing local env keys: ${missingLines.map((line) => line.split('=')[0]).join(', ')}`,
    );
  }

  if (
    nextLocal.includes(
      'BETTER_AUTH_SECRET=replace-with-at-least-32-random-characters',
    )
  ) {
    nextLocal = nextLocal.replace(
      'BETTER_AUTH_SECRET=replace-with-at-least-32-random-characters',
      `BETTER_AUTH_SECRET=${generateLocalSecret()}`,
    );
    console.log('Generated a local BETTER_AUTH_SECRET');
  }

  if (nextLocal !== local) {
    await writeFile(envLocalPath, nextLocal);
  }
}

function waitForTcp({ host, port, timeoutMs }) {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    function attempt() {
      const socket = net.createConnection({ host, port });

      socket.once('connect', () => {
        socket.end();
        resolve();
      });
      socket.once('error', () => {
        socket.destroy();

        if (Date.now() - startedAt > timeoutMs) {
          reject(new Error(`Timed out waiting for ${host}:${port}`));
          return;
        }

        setTimeout(attempt, 1000);
      });
    }

    attempt();
  });
}

async function main() {
  await ensureEnvLocal();

  if (!(await commandWorks('docker', ['--version']))) {
    throw new Error('Docker is required for the persistent local stack.');
  }

  if (!(await commandWorks('docker', ['compose', 'version']))) {
    throw new Error(
      'Docker Compose is required for the persistent local stack.',
    );
  }

  console.log('Starting local Postgres and MinIO...');
  await run('docker', [
    'compose',
    'up',
    '-d',
    'postgres',
    'minio',
    'minio-init',
  ]);

  console.log('Waiting for Postgres on localhost:5433...');
  await waitForTcp({ host: '127.0.0.1', port: 5433, timeoutMs: 60_000 });

  console.log('Applying database migrations...');
  await run(npmCommand(), ['run', 'db:migrate']);

  console.log('\nPersistent local stack is ready.');
  console.log('Run the app with: npm run dev:persistent');
  console.log('Then verify the CLI loop with: npm run smoke:agent');
}

await main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
