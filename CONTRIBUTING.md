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

See [docs/architecture.md](./docs/architecture.md) for the system overview.

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

### Commit messages

Use short, imperative subject lines:

- `Add contributor docs and CI workflow`
- `Fix unlisted artifact page access`
- `Polish review sidebar empty state`

## Checks to run

Always:

```bash
npm run lint
npm run typecheck
npm run format:check
npm run test:cli
```

For auth, API, or persistence changes, also run the persistent stack:

```bash
npm run setup:local
npm run dev:persistent
npm run doctor
npm run test:backend
npm run smoke:agent
```

`test:backend` and `smoke:agent` expect the app at `http://localhost:3000`
with Postgres and MinIO available.

## Pull requests

Open a PR against `main` with:

- What changed and why
- Screenshots or recordings for UI changes
- Test plan / commands run
- Notes on migrations, env vars, or breaking changes

CI runs lint, typecheck, formatting, CLI tests, and a backend integration
check on pull requests.

## Reporting security issues

Please do not open public issues for security vulnerabilities. See
[SECURITY.md](./SECURITY.md).

## License

By contributing, you agree that your contributions will be licensed under the
MIT License.
