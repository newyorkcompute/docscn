# Self-hosting docscn

This guide covers running docscn in production with persistent Postgres, object
storage, and Better Auth. For local development, see
[CONTRIBUTING.md](../CONTRIBUTING.md).

## Overview

docscn needs three durable services in production:

| Service                   | Purpose                                              |
| ------------------------- | ---------------------------------------------------- |
| **Postgres**              | Users, sessions, API keys, artifacts, review threads |
| **S3-compatible storage** | Revision HTML blobs                                  |
| **Node.js app**           | Next.js web app and API routes                       |

The app also expects a public HTTPS URL for browser auth and CLI device login.

## Prerequisites

- Node.js 20+
- A Postgres 14+ database
- An S3-compatible bucket for artifact HTML
- A domain or stable public URL (for example `https://docscn.example.com`)

Optional but recommended:

- Docker Compose for co-located Postgres and MinIO
- A reverse proxy or managed platform that terminates TLS

## Environment variables

Copy `.env.example` to your deployment environment and set every value below.

| Variable               | Required | Description                              |
| ---------------------- | -------- | ---------------------------------------- |
| `NEXT_PUBLIC_APP_URL`  | yes      | Public app URL used in the browser       |
| `BETTER_AUTH_URL`      | yes      | Same public URL Better Auth should trust |
| `BETTER_AUTH_SECRET`   | yes      | Random secret, at least 32 characters    |
| `DATABASE_URL`         | yes      | Postgres connection string               |
| `S3_ENDPOINT`          | yes\*    | S3-compatible endpoint URL               |
| `S3_REGION`            | yes\*    | Provider region                          |
| `S3_BUCKET`            | yes\*    | Bucket for artifact HTML                 |
| `S3_ACCESS_KEY_ID`     | yes\*    | Object storage access key                |
| `S3_SECRET_ACCESS_KEY` | yes\*    | Object storage secret key                |

\* All five `S3_*` variables must be set together. If any are missing, revision
HTML is stored inline in Postgres instead of object storage.

`REDIS_URL` is reserved for future queue/cache work and is not required today.

### Example production env

```bash
NEXT_PUBLIC_APP_URL=https://docscn.example.com
BETTER_AUTH_URL=https://docscn.example.com
BETTER_AUTH_SECRET=replace-with-a-long-random-secret

DATABASE_URL=postgres://docscn:strong-password@db.internal:5432/docscn

S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
S3_REGION=auto
S3_BUCKET=docscn-artifacts
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
```

Generate a secret locally:

```bash
openssl rand -base64 48
```

## Database setup

1. Create a Postgres database and user.
2. Point `DATABASE_URL` at it.
3. Apply migrations before starting the app:

```bash
DATABASE_URL='postgres://...' npm run db:migrate
```

Managed Postgres works the same way as self-hosted Postgres. Common options:

- Neon
- Supabase
- RDS
- Cloud SQL
- Docker Compose Postgres from this repo

## Object storage setup

docscn stores revision HTML at keys like:

```text
artifacts/{artifactId}/revisions/{revisionId}.html
```

Create a bucket and credentials with read/write access. Compatible providers
include:

- Cloudflare R2
- AWS S3
- MinIO
- Tigris

For MinIO on your own infrastructure, the repo's `docker-compose.yml` is a
reasonable starting point. Create the bucket before publishing artifacts.

## Build and run

Install dependencies and build the workspace:

```bash
npm ci
npm run build
```

The web app is configured with Next.js `output: 'standalone'`, which produces a
self-contained server bundle suitable for containers or VM deployment.

### Managed platform (Vercel or similar)

1. Connect the repository.
2. Set all required environment variables in the project settings.
3. Run migrations against your production database.
4. Deploy the web app.

Make sure the platform exposes the same public URL you set in
`NEXT_PUBLIC_APP_URL` and `BETTER_AUTH_URL`.

### Docker Compose infrastructure + app on a VM

A common self-hosted layout:

1. Run Postgres and MinIO with `docker compose up -d postgres minio minio-init`
2. Run migrations with production `DATABASE_URL`
3. Build and start the Next.js app with the same env vars
4. Put Caddy, nginx, or another reverse proxy in front of the app

Example migration and startup flow:

```bash
cp .env.example .env.production
# edit .env.production

export $(grep -v '^#' .env.production | xargs)
npm ci
npm run build
npm run db:migrate
HOSTNAME=0.0.0.0 PORT=3000 npm run start
```

If your host uses a process manager, run the web app through that instead of
keeping a shell session open.

## First-run checklist

After deploy:

1. Open the public URL in a browser
2. Create the first account through `/sign-up`
3. Install the CLI:

```bash
curl https://docscn.example.com/install -fsS | bash
```

4. Publish a test artifact:

```bash
docscn template get html-effectiveness-code-approaches --output artifact.html
docscn publish artifact.html --host https://docscn.example.com
docscn login --host https://docscn.example.com
docscn whoami --host https://docscn.example.com
```

5. Open the returned URL in a private window to confirm sharing works

## CLI distribution

Production users can install the CLI through your instance's `/install` route,
which downloads release binaries from GitHub Releases. Tag and publish CLI
releases with:

```bash
git tag v0.0.2
git push origin v0.0.2
```

The `Release CLI` workflow builds platform binaries automatically.

## Maintenance

Anonymous publish recovery tokens expire 90 days after publish. Expired
unclaimed tokens cannot recover ownership, but their unlisted artifacts remain
viewable at the original URLs.

Run the cleanup task periodically to delete expired unclaimed claim rows:

```bash
npm run claims:cleanup -- --dry-run
npm run claims:cleanup
```

Schedule the non-dry-run command with your platform scheduler or cron using the
same `DATABASE_URL` as the web app.

## Backups

Back up both persistence layers:

- **Postgres:** regular logical or managed backups of users, artifacts, threads,
  and API key metadata
- **Object storage:** bucket replication or provider-native backup/versioning

Restoring Postgres without the matching object storage bucket will leave
artifacts with missing HTML if revisions were stored in S3.

## Security checklist

- Use HTTPS in production
- Set a unique `BETTER_AUTH_SECRET`
- Keep Postgres and object storage credentials private
- Treat API keys like passwords; rotate compromised keys immediately
- Restrict database and bucket access to the app runtime only
- Review artifact visibility defaults before exposing a public instance

Report security issues privately through [SECURITY.md](../SECURITY.md).

## Troubleshooting

### CLI login returns 503

`DATABASE_URL` is missing or migrations have not been applied. Run
`npm run db:migrate` against the production database and restart the app.

### Published artifacts show blank HTML

All five `S3_*` variables are probably set, but the bucket is unreachable or
the object was not written. Verify bucket credentials and that the bucket
exists.

### Auth cookies fail after login

`BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` must match the public URL users
visit, including scheme (`https://`).

### Migrations fail on startup

Ensure Postgres is reachable and the database user can create tables. Retry
after the database is fully ready.

## Related docs

- [Architecture](./architecture.md)
- [Contributing](../CONTRIBUTING.md)
- [Security policy](../SECURITY.md)
