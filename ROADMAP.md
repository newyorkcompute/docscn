# Roadmap

docscn is an open-source platform for hosting, sharing, and collaborating on
AI-generated HTML artifacts. The core loop is:

```text
publish -> review -> revise
```

This roadmap reflects current priorities. It is not a commitment to dates or
exact scope.

## Now

Focus: launch polish and first-run clarity for hosted and self-hosted users.

- [x] Hosted demo at [docscn.ai](https://docscn.ai)
- [x] `curl | bash` installer with GitHub Release binaries (CLI v0.3.0+)
- [x] CLI `template list` / `template get` backed by the public template library
- [x] Production self-hosting docs and deployment examples
- [x] Example artifact gallery and `/templates` browser ([#3](https://github.com/newyorkcompute/docscn/issues/3))
- [x] Dashboard empty state and onboarding flow ([#4](https://github.com/newyorkcompute/docscn/issues/4))
- [ ] README screenshot / demo GIF of the artifact viewer ([#2](https://github.com/newyorkcompute/docscn/issues/2))
- [x] Social preview image (`og:image`) for link shares

## Next

Focus: make docscn feel like a real hosting platform, not just a viewer.

- [ ] Privacy-friendly artifact page view counts ([#1](https://github.com/newyorkcompute/docscn/issues/1))
- [ ] Public artifact discovery improvements
- [ ] OAuth providers (GitHub, Google)
- [ ] Team / org ownership for shared workspaces
- [x] MCP tools built on the existing SDK contracts
- [x] Agent feedback bundle API, CLI command, and OpenAPI spec

## Later

Focus: scale, automation, and operator ergonomics.

- [ ] Redis-backed queues for async revision workflows
- [ ] Webhooks for publish, review, and revision events
- [ ] Audit log for artifact access and API key usage
- [ ] Import/export for artifacts and review history
- [ ] Helm chart or production Docker Compose stack for the full app

## How to influence the roadmap

- Open a [feature request](https://github.com/newyorkcompute/docscn/issues/new?template=feature_request.yml)
- Comment on an existing issue
- Send a PR for docs, examples, or small product polish

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the development workflow.
