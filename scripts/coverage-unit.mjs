import { spawn } from 'node:child_process';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const packageNames = ['sdk', 'db', 'cli', 'mcp'];
const coverageDir = join(repoRoot, 'coverage/unit');
const coverageTempDir = join(repoRoot, 'coverage/.v8-unit');
const coverageSummaryPath = join(coverageDir, 'coverage-summary.json');
const coverageCommentPath = join(coverageDir, 'coverage-comment.md');
const metricNames = ['lines', 'statements', 'functions', 'branches'];
const commentMarker = '<!-- docscn-coverage-comment -->';

function localBin(name) {
  const executable = process.platform === 'win32' ? `${name}.cmd` : name;
  return join(repoRoot, 'node_modules', '.bin', executable);
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: repoRoot,
      env: process.env,
      shell: false,
      stdio: 'inherit',
    });

    child.on('error', reject);
    child.on('exit', (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(
          signal
            ? `${command} exited after signal ${signal}`
            : `${command} exited with code ${code}`,
        ),
      );
    });
  });
}

function normalizeRepoPath(filePath) {
  const normalizedFilePath = filePath.replaceAll('\\', '/');
  const normalizedRepoRoot = repoRoot.replaceAll('\\', '/');

  if (normalizedFilePath.startsWith(`${normalizedRepoRoot}/`)) {
    return normalizedFilePath.slice(normalizedRepoRoot.length + 1);
  }

  return normalizedFilePath;
}

function createEmptyMetrics() {
  return Object.fromEntries(
    metricNames.map((name) => [
      name,
      {
        total: 0,
        covered: 0,
        skipped: 0,
        pct: 100,
      },
    ]),
  );
}

function addMetrics(target, source) {
  for (const name of metricNames) {
    target[name].total += source[name]?.total ?? 0;
    target[name].covered += source[name]?.covered ?? 0;
    target[name].skipped += source[name]?.skipped ?? 0;
  }

  return target;
}

function finalizeMetrics(metrics) {
  for (const name of metricNames) {
    const metric = metrics[name];
    metric.pct =
      metric.total === 0
        ? 100
        : Number(((metric.covered / metric.total) * 100).toFixed(2));
  }

  return metrics;
}

function formatPercent(value) {
  return `${Number(value ?? 0).toFixed(2)}%`;
}

function formatMetric(metric) {
  return `${formatPercent(metric.pct)} (${metric.covered}/${metric.total})`;
}

function formatMetricRow(label, metrics) {
  return `| ${label} | ${formatMetric(metrics.lines)} | ${formatMetric(
    metrics.statements,
  )} | ${formatMetric(metrics.functions)} | ${formatMetric(
    metrics.branches,
  )} |`;
}

function githubRunUrl() {
  const serverUrl = process.env.GITHUB_SERVER_URL;
  const repository = process.env.GITHUB_REPOSITORY;
  const runId = process.env.GITHUB_RUN_ID;

  if (!serverUrl || !repository || !runId) {
    return undefined;
  }

  return `${serverUrl}/${repository}/actions/runs/${runId}`;
}

function buildCoverageComment(summary) {
  const files = Object.entries(summary)
    .filter(([filePath]) => filePath !== 'total')
    .map(([filePath, metrics]) => ({
      path: normalizeRepoPath(filePath),
      metrics,
    }))
    .filter(({ path }) =>
      packageNames.some((name) => path.startsWith(`packages/${name}/src/`)),
    )
    .sort((left, right) => left.path.localeCompare(right.path));

  const packageMetrics = Object.fromEntries(
    packageNames.map((name) => [name, createEmptyMetrics()]),
  );

  for (const file of files) {
    const packageName = packageNames.find((name) =>
      file.path.startsWith(`packages/${name}/src/`),
    );

    if (packageName) {
      addMetrics(packageMetrics[packageName], file.metrics);
    }
  }

  const commitLine = process.env.GITHUB_SHA
    ? `Commit: \`${process.env.GITHUB_SHA.slice(0, 12)}\``
    : 'Generated locally.';
  const runUrl = githubRunUrl();
  const runLine = runUrl ? `Workflow run: ${runUrl}` : undefined;
  const lowCoverageFiles = files
    .filter(({ metrics }) => metrics.lines.pct < 80)
    .sort((left, right) => left.metrics.lines.pct - right.metrics.lines.pct)
    .slice(0, 20);

  const lines = [
    commentMarker,
    '## Unit test coverage',
    '',
    'Generated from `npm run coverage:unit` using the existing Node unit scripts for sdk, db, cli, and mcp.',
    '',
    commitLine,
  ];

  if (runLine) {
    lines.push(runLine);
  }

  lines.push(
    '',
    '| Scope | Lines | Statements | Functions | Branches |',
    '| --- | ---: | ---: | ---: | ---: |',
    formatMetricRow('Total', summary.total),
  );

  for (const name of packageNames) {
    lines.push(
      formatMetricRow(
        `packages/${name}`,
        finalizeMetrics(packageMetrics[name]),
      ),
    );
  }

  lines.push('', '<details>');

  if (lowCoverageFiles.length > 0) {
    lines.push(
      '<summary>Files below 80% line coverage</summary>',
      '',
      '| File | Lines | Branches |',
      '| --- | ---: | ---: |',
      ...lowCoverageFiles.map(
        ({ path, metrics }) =>
          `| \`${path}\` | ${formatMetric(metrics.lines)} | ${formatMetric(
            metrics.branches,
          )} |`,
      ),
    );
  } else {
    lines.push(
      '<summary>Files below 80% line coverage</summary>',
      '',
      'No package source files are below 80% line coverage.',
    );
  }

  lines.push('</details>', '');

  return `${lines.join('\n')}\n`;
}

await rm(coverageDir, { force: true, recursive: true });
await rm(coverageTempDir, { force: true, recursive: true });
await mkdir(coverageDir, { recursive: true });

await run(localBin('nx'), [
  'run-many',
  '-t',
  'build',
  '-p',
  packageNames.join(','),
  '--parallel=3',
]);

await run(localBin('c8'), [
  '--all',
  '--src',
  'packages/sdk/src',
  '--src',
  'packages/db/src',
  '--src',
  'packages/cli/src',
  '--src',
  'packages/mcp/src',
  '--include',
  'packages/sdk/src/**/*.ts',
  '--include',
  'packages/db/src/**/*.ts',
  '--include',
  'packages/cli/src/**/*.ts',
  '--include',
  'packages/mcp/src/**/*.ts',
  '--exclude-after-remap',
  '--reporter=json-summary',
  '--reporter=lcov',
  '--reporter=text-summary',
  '--report-dir',
  'coverage/unit',
  '--temp-directory',
  'coverage/.v8-unit',
  'node',
  'scripts/unit-coverage-runner.mjs',
]);

const summary = JSON.parse(await readFile(coverageSummaryPath, 'utf8'));
const comment = buildCoverageComment(summary);
await writeFile(coverageCommentPath, comment);

console.log(`Coverage comment written to ${coverageCommentPath}`);
