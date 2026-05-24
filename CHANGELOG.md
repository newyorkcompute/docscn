# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Nothing yet.

## [0.1.0] - 2026-05-23

Initial public MVP for hosting, sharing, and collaborating on AI-generated HTML
artifacts.

### Added

- Next.js web app with sandboxed artifact viewer and review workspace
- Publish → review → revise loop with comment pins, threads, and revisions
- Canvas-native annotation modes for point, text, and element feedback
- Postgres persistence with Drizzle ORM and S3-compatible artifact HTML storage
- Better Auth email/password sign-in and owner-aware artifact visibility
- Hashed API keys and CLI device login flow
- Agent-first CLI for login, publish, revise, threads, and comments
- Public `/skills.md` endpoint for agent guidance
- `curl | bash` CLI installer backed by GitHub Releases binaries
- Local Docker Compose stack for Postgres and MinIO
- `npm run setup:local`, `npm run dev:persistent`, and `npm run doctor`
- Example artifact at `examples/artifacts/minimal.html`
- Contributor docs, architecture overview, issue/PR templates, and CI workflow
- Backend API and agent smoke tests

### Changed

- Reframed product copy around hosting, sharing, and collaboration
- Moved review panel to a persistent right sidebar on desktop
- Made comment pins scroll with artifact content inside the iframe
- Improved first-run localhost onboarding on the landing page and dashboard

### Fixed

- White flash when navigating to artifacts in dark mode
- Unlisted artifact pages not loading for direct link visitors
- CLI login failures when `DATABASE_URL` was missing or Postgres was not ready
- macOS CLI release binaries built on native runners for code signing compatibility

[Unreleased]: https://github.com/newyorkcompute/docscn/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/newyorkcompute/docscn/releases/tag/v0.1.0
