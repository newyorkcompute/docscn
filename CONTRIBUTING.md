# Contributing to docscn

Thanks for helping make docscn a better open-source platform for hosting,
sharing, and collaborating on AI-generated HTML artifacts.

## Ways to contribute

- Report bugs and rough edges in [GitHub Issues](https://github.com/newyorkcompute/docscn/issues)
- Improve docs, examples, and onboarding
- Fix UI/UX issues in the artifact viewer or review flow
- Extend the CLI, SDK, or API contracts
- Add tests for the publish → review → revise loop

Before large changes, open an issue or draft PR so we can align on direction.

## Development setup

### Quick start (mock mode)

Good for UI work and first exploration. No Docker required.

```bash
git clone https://github.com/newyorkcompute/docscn.git
cd docscn
npm install
npm run dev
```

Open `http://localhost:3000`. Without `DATABASE_URL`, the app uses in-memory
published artifacts plus seeded demo artifacts.

### Persistent local stack

Required for auth, CLI login, API keys, and durable publish/reload behavior.

```bash
npm install
npm run setup:local
npm run dev:persistent
npm run doctor
```

`npm run setup:local` creates `.env.local`, starts Postgres and MinIO through
Docker Compose, and applies Drizzle migrations.

### Hacking on the CLI

Use the workspace CLI instead of the release installer when developing locally:

```bash
npm run cli -- login --host http://localhost:3000
npm run cli -- publish examples/artifacts/minimal.html --host http://localhost:3000
```

## Project layout

See [docs/architecture.md](./docs/architecture.md) for the system overview and
[docs/self-hosting.md](./docs/self-hosting.md) for production deployment.

```text
apps/web/          Next.js app, API routes, artifact viewer
packages/cli/      Agent-first CLI
packages/db/       Drizzle schema, migrations, repository layer
packages/sdk/      Shared contracts
packages/storage/  S3-compatible artifact HTML storage
packages/ui/       Shared UI primitives
scripts/           Setup, smoke tests, release helpers
```

## Making changes

1. Create a branch from `main`
2. Keep PRs focused and small when possible
3. Match existing code style and naming in the touched area
4. Update docs when behavior or setup changes
5. Run the checks below before opening a PR

Git hooks install automatically on `npm install` (via Husky). Before each
commit, lint-staged runs Prettier and ESLint on staged files only. CI remains
the required gate — skip hooks in a pinch with `git commit --no-verify`.

### Commit messages

Use short, imperative subject lines:

- `Add contributor docs and CI workflow`
- `Fix unlisted artifact page access`
- `Polish review sidebar empty state`

### Pull request titles

Use the same voice as commit subjects — short, imperative, no ticket prefixes:

- `Add …` for features
- `Fix …` for bugs
- `Bump …` for dependency or CI updates
- `Improve …` or `Polish …` for UX and copy
- `Expand …` when extending an existing surface

Link related issues in the PR body or commit with `Closes #123` when the PR
resolves a ticket.

### Conventional Commits (optional)

We follow a human-first imperative style by default. If you prefer
[Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/), map our
verbs to types like this:

| Imperative subject                    | Conventional type    |
| ------------------------------------- | -------------------- |
| `Add …`, `Expand …`                   | `feat:`              |
| `Fix …`                               | `fix:`               |
| `Bump …`                              | `chore:` or `build:` |
| `Improve …`, `Polish …`, `Refactor …` | `refactor:`          |
| Docs-only changes                     | `docs:`              |
| Test-only changes                     | `test:`              |
| CI/workflow-only changes              | `ci:`                |

Examples:

- `feat: add anonymous artifact recovery`
- `fix: prevent Postgres pool exhaustion in dev`
- `chore: bump Next.js to 16.2.6`

Use Conventional Commits on **squash-merge titles** when you want structured
history on `main`. Individual commits on a branch can stay imperative — we do
not enforce types locally.

For breaking API, CLI, or schema changes, add a footer:

```text
BREAKING CHANGE: describe what callers must update
```

We do not run commitlint or other commit hooks yet. If we later automate
releases or changelogs from commit history, we may adopt tooling then.

## Checks to run

Always:

```bash
npm run lint
npm run typecheck
npm run format:check
npm run openapi:check
npm run test:cli
npm run test:mcp
```

For auth, API, or persistence changes, also run the persistent stack:

```bash
npm run setup:local
npm run dev:persistent
npm run doctor
npm run test:backend
npm run test:mcp:integration
npm run smoke:agent
```

`test:backend`, `test:mcp:integration`, and `smoke:agent` expect the app at
`http://localhost:3000` with Postgres and MinIO available.

## Pull requests

Open a PR against `main` and fill out
[the PR template](.github/pull_request_template.md):

- **Summary** — what changed and why (1–3 bullets)
- **Type of change** — check the relevant box
- **Test plan** — check commands you actually ran
- **Screenshots / recordings** — required for UI changes when possible
- **Notes** — migrations, env vars, breaking changes, deferrals, follow-ups

CI runs three jobs on pull requests: static checks (lint, typecheck, formatting,
OpenAPI sync) and unit tests (CLI, MCP) in parallel, then a backend integration
job with Postgres and MinIO.

## Reporting security issues

Please do not open public issues for security vulnerabilities. See
[SECURITY.md](./SECURITY.md).

## License

By contributing, you agree that your contributions will be licensed under the
MIT License.
