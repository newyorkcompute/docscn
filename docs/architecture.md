# Architecture

docscn is an open-source platform for hosting, sharing, and collaborating on
self-contained HTML artifacts produced by AI agents and humans.

The core product loop is:

```text
publish -> review -> revise
```

## High-level system

```text
Agent / CLI                Browser
    |                         |
    v                         v
Authorization: Bearer    Better Auth session
    |                         |
    +------------+------------+
                 |
           apps/web API routes
                 |
     +-----------+-----------+
     |                       |
packages/db            packages/storage
Postgres metadata      S3-compatible HTML
```

## Monorepo packages

| Package            | Responsibility                                             |
| ------------------ | ---------------------------------------------------------- |
| `apps/web`         | Next.js App Router UI, API routes, artifact viewer         |
| `packages/cli`     | `login`, `publish`, `revise`, `thread`, `comment` commands |
| `packages/db`      | Drizzle schema, migrations, repository, mock fallback      |
| `packages/sdk`     | Shared TypeScript contracts for artifacts and review data  |
| `packages/storage` | S3-compatible adapter for revision HTML blobs              |
| `packages/ui`      | Shared UI primitives and styling helpers                   |
| `packages/config`  | Shared env/config helpers                                  |

## Persistence modes

Everything branches on whether `DATABASE_URL` is configured.

### Mock / runtime fallback

When `DATABASE_URL` is missing:

- Seeded demo artifacts remain available
- Browser auth and durable accounts are not viable
- CLI login fails once API key creation is required
- Published artifacts live in process memory and disappear on restart

Good for UI exploration and docs screenshots.

### Persistent mode

When `DATABASE_URL` is set and migrations have been applied:

- Better Auth stores users and sessions in Postgres
- API keys are hashed and stored in Postgres
- Artifacts, revisions, review threads, and comments persist
- CLI device login creates a one-time API key after browser approval

When all `S3_*` variables are set, revision HTML is stored in object storage.
Otherwise HTML is stored inline in Postgres.

## Main request paths

### Publish artifact

1. CLI or browser sends `POST /api/artifacts`
2. Request auth resolves via session cookie or `Authorization: Bearer`
3. `publishArtifact()` writes artifact metadata and revision `v1`
4. HTML is stored in Postgres and/or S3
5. Response returns artifact id, slug, and viewer URL

### View artifact

1. Browser requests `/artifacts/[slug]`
2. Server loads artifact metadata and current revision HTML
3. `ArtifactFrame` renders HTML in a sandboxed iframe via `srcDoc`
4. Review pins and sidebar render from stored thread anchors

### Review and revise

1. Humans create review threads from the canvas or sidebar
2. Threads store anchors, requested changes, and comments in Postgres
3. Agents copy structured feedback from the sidebar or fetch via CLI/API
4. Revisions create a new artifact revision and optionally resolve threads

## Authentication

Two principals are supported:

- **Session:** browser user signed in through Better Auth
- **API key:** agent/CLI access through hashed bearer tokens

CLI login uses a device-code flow:

1. CLI calls `POST /api/cli/auth/start`
2. User approves at `/cli/login?code=...`
3. CLI polls `POST /api/cli/auth/poll`
4. Approved poll creates an API key and stores it locally in
   `~/.docscn/config.json`

## Artifact visibility

| Visibility | List on dashboard | Direct URL         | Owner access |
| ---------- | ----------------- | ------------------ | ------------ |
| `public`   | yes               | yes                | yes          |
| `unlisted` | no                | yes                | yes          |
| `private`  | no                | owner/API key only | yes          |

## Key files

| Area             | Files                                                       |
| ---------------- | ----------------------------------------------------------- |
| API publish/read | `apps/web/src/app/api/artifacts/**`                         |
| CLI auth         | `apps/web/src/app/api/cli/auth/**`                          |
| Request auth     | `apps/web/src/lib/publisher.ts`, `apps/web/src/lib/auth.ts` |
| Repository layer | `packages/db/src/lib/repository.ts`                         |
| Artifact viewer  | `apps/web/src/components/artifact-workspace.tsx`            |
| Iframe bridge    | `apps/web/src/components/artifact-frame.tsx`                |
| CLI commands     | `packages/cli/src/lib/cli.ts`                               |
| Agent guidance   | `apps/web/src/app/skills.md/route.ts`                       |

## Local infrastructure

Docker Compose provides:

- Postgres on `localhost:5433`
- MinIO on `localhost:9000`
- Bucket bootstrap through `minio-init`

Use:

```bash
npm run setup:local
npm run dev:persistent
```

## Testing strategy

Current automated coverage focuses on contracts rather than UI snapshots:

- `npm run test:cli` — CLI parsing, config, and help behavior
- `npm run test:backend` — auth, publish, thread, revision API flow
- `npm run smoke:agent` — full CLI publish and reload verification

See [CONTRIBUTING.md](../CONTRIBUTING.md) for the contributor workflow.
