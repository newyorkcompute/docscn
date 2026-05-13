# docscn

docscn is an open-source workspace for agent-generated HTML artifacts.
Publish interactive plans, reports, diagrams, prototypes, and docs. Review them
with your team. Let agents revise from feedback.

The core loop is:

```text
publish -> review -> revise
```

docscn is not a notes app or markdown editor. It is a collaborative publishing
and review layer for the self-contained HTML artifacts AI agents increasingly
produce: incident timelines, migration plans, generated dashboards,
architecture explainers, animated reports, UI prototypes, and PR review
artifacts.

## Monorepo

This repo uses Nx with npm workspaces.

```text
apps/
  web/        Next.js app for docscn.ai
packages/
  ui/         Shared shadcn-inspired UI primitives
  db/         Mock repository now, future Drizzle/Postgres package
  sdk/        Public contracts for artifacts, publishing, comments, revisions
  cli/        Future npx docscn publish artifact.html experience
  config/     Shared configuration and environment contracts
```

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Useful commands:

```bash
npm run build
npm run lint
npm run typecheck
npm run format
```

## MVP Features

- Polished dark-mode-first landing page for `docscn.ai`.
- Dashboard with AI-native artifact examples.
- Lightweight local Publish Artifact flow for pasted/uploaded HTML.
- Sandboxed artifact viewer using iframe `srcDoc`.
- Artifact metadata: title, description, author/agent, date, visibility, source.
- Review threads and revision history around each artifact.
- SDK contracts shaped for future publish APIs, MCP tools, skills, and agents.
- CLI package reserved for future `npx docscn publish artifact.html`.

## Self-Hosting Direction

The MVP uses mock/local data, but the boundaries are designed for an
open-source, self-hostable architecture:

- Postgres with Drizzle ORM.
- Better Auth for login and public/private artifacts.
- S3-compatible storage for artifact HTML and assets.
- Redis-compatible queues/cache for automation and scheduled reports.
- Docker Compose friendly local services.
- Cloud-hosted friendly deployments on replaceable providers such as Neon,
  Upstash, Cloudflare R2, and Vercel.

Copy `.env.example` to `.env.local` when wiring real services later.

## Future CLI

The CLI package is intentionally small in the MVP. The planned shape is:

```bash
npx docscn publish artifact.html
docscn login
docscn pull
docscn revisions
docscn comments
docscn export
```

## License

MIT
