# docscn

[![CI](https://github.com/newyorkcompute/docscn/actions/workflows/ci.yml/badge.svg)](https://github.com/newyorkcompute/docscn/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/github/license/newyorkcompute/docscn)](https://github.com/newyorkcompute/docscn/blob/main/LICENSE)

**Live demo:** [docscn.ai](https://docscn.ai) · [Template library](https://docscn.ai/templates)

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
readable review surfaces.

### Inspiration

The public template library and much of our copy build on the “HTML over
markdown for agent artifacts” thread:

- [Using Claude Code: The unreasonable effectiveness of HTML](https://claude.com/blog/using-claude-code-the-unreasonable-effectiveness-of-html) — Anthropic’s post on why agents should ship self-contained HTML instead of walls of markdown
- [The unreasonable effectiveness of HTML — examples](https://thariqs.github.io/html-effectiveness/) — [Thariq Karanick](https://x.com/trq212)’s companion gallery of 20 browser-open `.html` demos (exploration, PR review, design systems, decks, editors, and more)
- [Thariq’s post on X](https://x.com/trq212/status/2052809885763747935) — the thread that kicked off the examples site and the broader conversation
- [@trq212 on X](https://x.com/trq212) — follow-up writing on the same theme

Within Coinbase, we also run an internal service for sharing these kinds of
HTML artifacts across teams. docscn is the open-source version of that pattern:
a place to host artifacts at stable URLs, review them visually, and send
structured feedback back into the next revision.

## Quick start (hosted)

```bash
curl https://docscn.ai/install -fsS | bash
docscn template list
docscn template get html-effectiveness-code-approaches --output artifact.html
docscn publish artifact.html --host https://docscn.ai
```

Open the published URL, or sign in when you want ownership, comments, revisions,
private sharing, or API keys:

```bash
docscn login --host https://docscn.ai
```

Browse templates in the browser at [docscn.ai/templates](https://docscn.ai/templates).
Agents can read [docscn.ai/skills.md](https://docscn.ai/skills.md) for the full
workflow.

## Monorepo

This repo uses Nx with npm workspaces.

```text
apps/
  web/        Next.js app for hosting and collaborating on artifacts
  web-e2e/    Playwright browser tests for critical publishing and sharing flows
packages/
  ui/         Shared shadcn-inspired UI primitives
  db/         Drizzle/Postgres schema, migrations, repository, mock fallback
  storage/    S3-compatible artifact HTML storage adapter
  sdk/        Public contracts, OpenAPI spec, and agent feedback helpers
  cli/        Agent-first CLI for login, publishing, feedback, and revisions
  mcp/        MCP server for publish, feedback, and revision tools
  config/     Shared configuration and environment contracts
```

## Local development

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
npm run test:e2e
npm run typecheck
npm run format
```

## Self-hosted quick start

For local development with Docker Postgres and MinIO:

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
npm run db:up          # start local Docker Postgres + MinIO
npm run db:down        # stop local Docker services
npm run db:generate    # create migrations from packages/db/src/lib/schema.ts
npm run db:migrate     # apply migrations using .env.local
npm run db:studio      # open Drizzle Studio using .env.local
npm run dev:persistent # run Next.js with .env.local loaded explicitly
```

For production deployment, see [docs/self-hosting.md](./docs/self-hosting.md).

docscn is designed to run locally with replaceable open-source infrastructure:
Postgres for metadata, MinIO/S3-compatible storage for artifact HTML, and Better
Auth for sessions. The app is safe to run without configured services: if
`DATABASE_URL` is missing, it falls back to in-process published artifacts plus
the AI-native seed examples.

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

## Portable stack

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
  local recovery receipt that can claim ownership for 90 days; hashed API keys
  stored in Postgres unlock owned/private artifacts and collaboration.
- **Future queues/cache:** Redis-compatible infrastructure is planned for
  automation and scheduled reports; it is not required for the current local
  stack.

No core data path depends on a single hosted vendor. Hosted defaults can be
convenient, but the interfaces are meant to be replaceable.

Copy `.env.example` to `.env.local` when wiring real services.

## Features

- Polished light/dark landing page for hosting, sharing, and collaboration.
- Public template library (Thariq Karanick HTML-effectiveness collection) with
  CLI `template list` / `template get` and a `/templates` browser.
- Dashboard with AI-native artifact examples and a getting-started empty state.
- Better Auth email/password foundation with owner-aware artifact publishing.
- Anonymous unlisted publishing with automatic recovery for 90 days after
  sign-in, plus hashed API keys for owned agent and CLI publishing through
  `Authorization: Bearer`.
- Private artifact sharing by email with viewer/commenter roles, plus public and
  unlisted link-sharing modes. Invites grant access immediately; v1 does not send
  email notifications.
- Publish Artifact flow backed by `/api/artifacts`, with Drizzle/Postgres when
  configured and a local runtime fallback otherwise.
- Sandboxed artifact viewer using iframe `srcDoc`.
- Artifact metadata: title, description, author/agent, date, visibility, source.
- Visibility rules: public artifacts are listed, unlisted artifacts are direct
  link shareable, and private artifacts require ownership or an email invite.
- Review threads, revision history, and collaboration metadata around each artifact.
- Figma-style comment pins over the artifact viewer for review context.
- SDK contracts shaped for publish APIs, MCP tools, skills, and agents.
- Agent-first CLI flow for no-login unlisted publishing, browser login, local
  credential storage, sharing, reading feedback, comments, and revisions.
- MCP server with tools for publish, list, fetch, sharing, visibility, feedback,
  review threads, revisions, claims, and identity.
- Public `/skills.md` endpoint that tells agents how to interact with docscn.
- OpenAPI spec at `/openapi.json` for REST integrations.
- `curl | bash` installer backed by [GitHub Releases](https://github.com/newyorkcompute/docscn/releases)
  (`docscn-darwin-*`, `docscn-linux-*`).

## Agent-first CLI

docscn is designed so agents operate through the CLI after reading
`/skills.md`. The browser remains the human-owned surface for account creation
and approval, while the CLI stores an API key locally at
`~/.docscn/config.json`.

Hosted workflow:

```bash
curl https://docscn.ai/install -fsS | bash
docscn template list
docscn template get html-effectiveness-code-approaches --output artifact.html
docscn publish artifact.html --host https://docscn.ai
docscn login --host https://docscn.ai   # optional: claim ownership and collaborate
```

Local development with the installed CLI:

```bash
curl http://localhost:3000/install -fsS | bash
docscn template list
docscn publish artifact.html --host http://localhost:3000
docscn login --host http://localhost:3000
docscn whoami --host http://localhost:3000
```

When hacking on the CLI source directly, use the workspace command:

```bash
npm run cli -- --version
npm run cli -- template list
npm run cli -- publish artifact.html --host http://localhost:3000
```

The login command opens `/cli/login` in the browser. The user signs in or
creates an account, approves the CLI connection, and the CLI saves a local token.
Agents should never ask for the user's password.

Agent workflow commands:

```bash
docscn artifact feedback <artifact-id-or-slug> --host http://localhost:3000
docscn artifact get <artifact-id-or-slug> --json --host http://localhost:3000
docscn revise <artifact-id-or-slug> revised.html \
  --summary "Addressed review feedback" \
  --resolve <thread-id> \
  --host http://localhost:3000
docscn thread create <artifact-id-or-slug> \
  --title "Suggested improvement" \
  --body "..." \
  --host http://localhost:3000
docscn share <artifact-id-or-slug> \
  --email reviewer@example.com \
  --role commenter \
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

CLI releases: bump `packages/cli/package.json`, tag `v*`, and push to trigger the
[Release CLI](.github/workflows/release-cli.yml) workflow. See
[packages/cli/README.md](./packages/cli/README.md).

## MCP server

For MCP-native clients (Cursor, Claude Desktop), use the docscn MCP server:

```bash
npm run mcp
```

It exposes the full docscn REST API as MCP tools over stdio. See
[docs/mcp.md](./docs/mcp.md) for configuration examples.

REST clients can use the OpenAPI spec at `/openapi.json` (source:
`packages/sdk/openapi.yaml`).

## Tests and smoke

The test suite covers the agent/API/CLI contract plus browser E2E coverage for
the highest-risk user flows.

```bash
npm run test:cli       # CLI config and command behavior
npm run test:mcp       # MCP server module and tool registration
npm run test:backend   # localhost backend API contract
npm run test:e2e       # Playwright coverage for publish/claim and private sharing
npm test               # CLI + MCP + backend tests
npm run smoke:agent    # full local agent flow through the built CLI
```

`npm run test:backend`, `npm run test:e2e`, and `npm run smoke:agent` expect the
local web app to be running at `http://localhost:3000` with Postgres and MinIO
available. The Playwright suite exercises anonymous publish recovery after
sign-up and private sharing access for viewer/commenter/revoked users. The smoke
script signs up a test user, completes CLI device auth, verifies saved config,
publishes an artifact, verifies the published URL is viewable, reads feedback,
creates a thread, submits a revision, and comments as an agent.

## Contributing

Contributions are welcome. Start with:

- [CONTRIBUTING.md](./CONTRIBUTING.md) for local setup and PR expectations
- [CHANGELOG.md](./CHANGELOG.md) for release history
- [ROADMAP.md](./ROADMAP.md) for project direction
- [docs/architecture.md](./docs/architecture.md) for the system overview
- [docs/mcp.md](./docs/mcp.md) for MCP server setup
- [docs/self-hosting.md](./docs/self-hosting.md) for production deployment
- [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) for community standards
- [SECURITY.md](./SECURITY.md) for vulnerability reporting
- [examples/artifacts/](./examples/artifacts/) for the template manifest and sample HTML
- [docscn.ai/templates](https://docscn.ai/templates) for browsing the public template library

Useful contributor commands:

```bash
npm run doctor
npm run setup:local
npm run dev:persistent
npm run test
npm run test:e2e
```

## License

MIT
