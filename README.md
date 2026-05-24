# docscn

[![CI](https://github.com/newyorkcompute/docscn/actions/workflows/ci.yml/badge.svg)](https://github.com/newyorkcompute/docscn/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/github/license/newyorkcompute/docscn)](https://github.com/newyorkcompute/docscn/blob/main/LICENSE)

docscn is an open-source platform for hosting, sharing, and collaborating on
AI-generated HTML artifacts. Publish interactive plans, reports, diagrams,
prototypes, and docs from agents, share them at stable URLs, review them with
your team, and let agents revise from feedback.

The core loop is:

```text
publish -> review -> revise
```

docscn is not a notes app or markdown editor. It is a collaborative hosting and
publishing layer for the self-contained HTML artifacts AI agents increasingly
produce: incident timelines, migration plans, generated dashboards,
architecture explainers, animated reports, UI prototypes, custom editing
interfaces, and PR review artifacts.

docscn is inspired by the idea that HTML is often a better artifact format than
Markdown for agent-generated work: richer structure, easier sharing, and more
readable review surfaces. That framing comes in part from Anthropic's
[Using Claude Code: The unreasonable effectiveness of HTML](https://claude.com/blog/using-claude-code-the-unreasonable-effectiveness-of-html).

Within Coinbase, we also run an internal service for sharing these kinds of
HTML artifacts across teams. docscn is the open-source version of that pattern:
a place to host artifacts at stable URLs, review them visually, and send
structured feedback back into the next revision.

## Monorepo

This repo uses Nx with npm workspaces.

```text
apps/
  web/        Next.js app for hosting and collaborating on artifacts
packages/
  ui/         Shared shadcn-inspired UI primitives
  db/         Drizzle/Postgres schema, migrations, repository, mock fallback
  storage/    S3-compatible artifact HTML storage adapter
  sdk/        Public contracts, OpenAPI spec, and agent feedback helpers
  cli/        Agent-first CLI for login, publishing, feedback, and revisions
  mcp/        MCP server for publish, feedback, and revision tools
  config/     Shared configuration and environment contracts
```

## Local Development

Fastest path, using the built-in mock/runtime fallback:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`, then try the local installer:

```bash
curl http://localhost:3000/install -fsS | bash
docscn --version
```

If `~/.local/bin` is not on your shell `PATH`, the installer prints the export
line to add.

Useful commands:

```bash
npm run build
npm run lint
npm test
npm run typecheck
npm run format
```

## Self-Hosted Quick Start

For local development with Docker Postgres and MinIO:

```bash
npm install
npm run setup:local
npm run dev:persistent
```

For production deployment, see [docs/self-hosting.md](./docs/self-hosting.md).

docscn is designed to run locally with replaceable open-source infrastructure:
Postgres for metadata, MinIO/S3-compatible storage for artifact HTML, and Better
Auth for sessions. The app is safe to run without configured services: if
`DATABASE_URL` is missing, it falls back to in-process published artifacts plus
the AI-native seed examples.

To run the persistent stack locally:

```bash
npm install
npm run setup:local
npm run dev:persistent
```

`npm run setup:local` creates `.env.local` when needed, fills in the local
Postgres/MinIO settings, starts Docker Compose services, and applies Drizzle
migrations.

The Docker Compose database is exposed at
`postgres://docscn:docscn@localhost:5433/docscn` to avoid conflicts with an
existing local Postgres on port `5432`.

MinIO is exposed at `http://localhost:9000`, with its console at
`http://localhost:9001`. The `minio-init` service creates the
`docscn-artifacts` bucket used by the S3 adapter.

Local service commands:

```bash
npm run db:up         # start local Docker Postgres + MinIO
npm run db:down       # stop local Docker services
npm run db:generate   # create migrations from packages/db/src/lib/schema.ts
npm run db:migrate    # apply migrations using .env.local
npm run db:studio     # open Drizzle Studio using .env.local
npm run dev:persistent # run Next.js with .env.local loaded explicitly
```

To run the app with the local Docker services explicitly:

```bash
DATABASE_URL='postgres://docscn:docscn@localhost:5433/docscn' \
S3_ENDPOINT='http://localhost:9000' \
S3_REGION='us-east-1' \
S3_BUCKET='docscn-artifacts' \
S3_ACCESS_KEY_ID='docscn' \
S3_SECRET_ACCESS_KEY='docscn-local-secret' \
npm run dev
```

## Portable Stack

The core stack is intentionally OSS-friendly and provider-portable:

- **App/runtime:** Next.js, React, Tailwind CSS, Nx, and shadcn-inspired local UI
  primitives.
- **Auth:** Better Auth with local Postgres tables. OAuth providers can be added
  later without changing artifact ownership.
- **Database:** Postgres via Drizzle ORM. Local Docker Postgres works the same
  way as Neon, Supabase, RDS, or another Postgres-compatible host.
- **Object storage:** S3-compatible adapter. Local MinIO can be swapped for
  Cloudflare R2, AWS S3, Tigris, or another compatible provider through env vars.
- **Publishing credentials:** first publish can be anonymous and unlisted with a
  local recovery receipt; hashed API keys stored in Postgres unlock owned/private
  artifacts and collaboration.

No core data path depends on a single hosted vendor. Hosted defaults can be
convenient, but the interfaces are meant to be replaceable.

## MVP Features

- Polished light/dark landing page for hosting, sharing, and collaboration.
- Dashboard with AI-native artifact examples.
- Better Auth email/password foundation with owner-aware artifact publishing.
- Anonymous unlisted publishing with automatic recovery after sign-in, plus
  hashed API keys for owned agent and CLI publishing through `Authorization:
  Bearer`.
- Publish Artifact flow backed by `/api/artifacts`, with Drizzle/Postgres when
  configured and a local runtime fallback otherwise.
- Sandboxed artifact viewer using iframe `srcDoc`.
- Artifact metadata: title, description, author/agent, date, visibility, source.
- Visibility rules: public artifacts are listed, unlisted artifacts are direct
  link shareable, and private artifacts are owner-only.
- Review threads, revision history, and collaboration metadata around each artifact.
- Figma-style comment pins over the artifact viewer for review context.
- SDK contracts shaped for publish APIs, MCP tools, skills, and agents.
- Agent-first CLI flow for no-login unlisted publishing, browser login, local
  credential storage, reading feedback, comments, and revisions.
- MCP server with tools for publish, list, fetch, feedback, review threads, revisions, claims, and identity.
- Public `/skills.md` endpoint that tells agents how to interact with docscn.
- OpenAPI spec at `/openapi.json` for REST integrations.

## Self-Hosting Direction

The MVP now includes the first persistence layer and remains designed for an
open-source, self-hostable architecture:

- Postgres with Drizzle ORM.
- Better Auth for login and public/private artifacts.
- S3-compatible storage for artifact HTML and assets.
- Redis-compatible queues/cache for automation and scheduled reports.
- Docker Compose friendly local services.
- Cloud-hosted friendly deployments on replaceable providers such as Neon,
  Upstash, Cloudflare R2, and Vercel.

Copy `.env.example` to `.env.local` when wiring real services later.

## Agent-First CLI

docscn is designed so agents operate through the CLI after reading
`/skills.md`. The browser remains the human-owned surface for account creation
and approval, while the CLI stores an API key locally at
`~/.docscn/config.json`.

For local development with the installed CLI:

```bash
curl http://localhost:3000/install -fsS | bash
docscn login --host http://localhost:3000
docscn whoami --host http://localhost:3000
docscn publish artifact.html --host http://localhost:3000
```

When hacking on the CLI source directly, use the workspace command:

```bash
npm run cli -- --version
npm run cli -- publish artifact.html --host http://localhost:3000
```

The login command opens `/cli/login` in the browser. The user signs in or
creates an account, approves the CLI connection, and the CLI saves a local token.
Agents should never ask for the user's password.

Agent workflow commands:

```bash
docscn artifact get <artifact-id-or-slug> --json --host http://localhost:3000
docscn revise <artifact-id-or-slug> revised.html \
  --summary "Addressed review feedback" \
  --resolve <thread-id> \
  --host http://localhost:3000
docscn thread create <artifact-id-or-slug> \
  --title "Suggested improvement" \
  --body "..." \
  --host http://localhost:3000
docscn comment <thread-id> \
  --body "Updated in revision 2." \
  --host http://localhost:3000
```

Raw API keys still work for automation and tests:

```bash
DOCSCN_API_KEY=docscn_sk_... npm run cli -- publish report.html \
  --host http://localhost:3000 \
  --title "Launch readiness report" \
  --visibility unlisted \
  --kind custom-html \
  --author "Cursor agent"
```

The hosted install shape is:

```bash
curl https://docscn.ai/install -fsS | bash
docscn login --host https://docscn.ai
docscn publish artifact.html --host https://docscn.ai
```

## MCP server

For MCP-native clients (Cursor, Claude Desktop), use the docscn MCP server:

```bash
npm run mcp
```

It exposes the full docscn REST API as MCP tools over stdio (see [docs/mcp.md](./docs/mcp.md)).
See [docs/mcp.md](./docs/mcp.md) for configuration examples.

REST clients can use the OpenAPI spec at `/openapi.json` (source: `packages/sdk/openapi.yaml`).

## Tests And Smoke

The current test coverage focuses on the agent/API/CLI contract. UI tests can
wait until the interface settles.

```bash
npm run test:cli       # CLI config and command behavior
npm run test:mcp       # MCP server module and tool registration
npm run test:backend   # localhost backend API contract
npm test               # CLI + MCP + backend tests
npm run smoke:agent    # full local agent flow through the built CLI
```

`npm run test:backend` and `npm run smoke:agent` expect the local web app to be
running at `http://localhost:3000` with Postgres and MinIO available. The smoke
script signs up a test user, completes CLI device auth, verifies saved config,
publishes an artifact, verifies the published URL is viewable, reads feedback,
creates a thread, submits a revision, and comments as an agent.

## Contributing

Contributions are welcome. Start with:

- [CONTRIBUTING.md](./CONTRIBUTING.md) for local setup and PR expectations
- [CHANGELOG.md](./CHANGELOG.md) for release history
- [docs/architecture.md](./docs/architecture.md) for the system overview
- [docs/mcp.md](./docs/mcp.md) for MCP server setup
- [docs/self-hosting.md](./docs/self-hosting.md) for production deployment
- [ROADMAP.md](./ROADMAP.md) for project direction
- [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) for community standards
- [SECURITY.md](./SECURITY.md) for vulnerability reporting
- [examples/artifacts/](./examples/artifacts/) for sample HTML to publish locally
- `/examples` in the web app for previewing the starter gallery before publishing

Useful contributor commands:

```bash
npm run doctor
npm run setup:local
npm run dev:persistent
npm run test
```

## License

MIT
