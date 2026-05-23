import { spawn } from 'node:child_process';
import { access, readFile } from 'node:fs/promises';
import net from 'node:net';

const envLocalPath = '.env.local';
const requiredEnvKeys = [
  'DATABASE_URL',
  'BETTER_AUTH_SECRET',
  'S3_ENDPOINT',
  'S3_BUCKET',
];

function run(command, args, options = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      stdio: options.quiet ? 'ignore' : 'inherit',
      ...options,
    });

    child.on('error', () => resolve(false));
    child.on('exit', (code) => resolve(code === 0));
  });
}

async function commandWorks(command, args) {
  return run(command, args, { quiet: true });
}

function waitForTcp({ host, port, timeoutMs }) {
  const startedAt = Date.now();

  return new Promise((resolve) => {
    function attempt() {
      const socket = net.createConnection({ host, port });

      socket.once('connect', () => {
        socket.end();
        resolve(true);
      });
      socket.once('error', () => {
        socket.destroy();

        if (Date.now() - startedAt > timeoutMs) {
          resolve(false);
          return;
        }

        setTimeout(attempt, 500);
      });
    }

    attempt();
  });
}

async function checkHttp(url) {
  try {
    const response = await fetch(url, { redirect: 'manual' });
    return response.ok || response.status === 307 || response.status === 308;
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

async function main() {
  const checks = [];
  let failed = 0;

  function record(name, ok, detail) {
    checks.push({ name, ok, detail });
    const prefix = ok ? 'ok' : 'fail';
    console.log(`${prefix.padEnd(4)} ${name}${detail ? ` — ${detail}` : ''}`);

    if (!ok) {
      failed += 1;
    }
  }

  const nodeVersion = process.versions.node;
  record('Node.js', Number(nodeVersion.split('.')[0]) >= 20, `v${nodeVersion}`);

  record(
    'Dependencies',
    await access('node_modules').then(
      () => true,
      () => false,
    ),
    'run npm install if missing',
  );

  record('Docker', await commandWorks('docker', ['--version']));
  record(
    'Docker Compose',
    await commandWorks('docker', ['compose', 'version']),
  );

  let envLocal = '';

  try {
    envLocal = await readFile(envLocalPath, 'utf8');
    record('.env.local', true);
  } catch {
    record('.env.local', false, 'run npm run setup:local');
  }

  if (envLocal) {
    const envKeys = parseEnvKeys(envLocal);
    const missingKeys = requiredEnvKeys.filter((key) => !envKeys.has(key));

    record(
      'Required env keys',
      missingKeys.length === 0,
      missingKeys.length ? `missing ${missingKeys.join(', ')}` : undefined,
    );
  }

  const postgresReady = await waitForTcp({
    host: '127.0.0.1',
    port: 5433,
    timeoutMs: 2_000,
  });
  record(
    'Postgres',
    postgresReady,
    postgresReady ? 'localhost:5433' : 'run npm run db:up',
  );

  const minioReady = await waitForTcp({
    host: '127.0.0.1',
    port: 9000,
    timeoutMs: 2_000,
  });
  record(
    'MinIO',
    minioReady,
    minioReady ? 'localhost:9000' : 'run npm run db:up',
  );

  const appReady = await checkHttp('http://localhost:3000');
  record(
    'Web app',
    appReady,
    appReady ? 'http://localhost:3000' : 'run npm run dev:persistent',
  );

  console.log('');

  if (failed === 0) {
    console.log('docscn local environment looks healthy.');
    return;
  }

  console.log(`${failed} check(s) failed. See CONTRIBUTING.md for setup help.`);
  process.exit(1);
}

await main();
