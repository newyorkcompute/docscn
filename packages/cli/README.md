# docscn CLI

Minimal CLI for publishing self-contained HTML artifacts to a docscn server.

## Building

Run `nx build cli` to build the library.

Bump the CLI version only in `package.json`. Dev builds read that file at
runtime; release binaries inject the same value at bundle time via
`scripts/build-cli-release.mjs`.

## Quick Start

```bash
docscn template list
docscn template get html-effectiveness-code-approaches --output artifact.html
docscn publish artifact.html
```

Publishing without an API key creates an anonymous unlisted, view-only artifact
and saves a local recovery receipt. `docscn login` automatically recovers saved
anonymous artifacts for 90 days after publish, then unlocks private/public owned
artifacts, comments, and revisions. After the receipt expires, the unlisted link
still works but ownership can no longer be recovered.

When you want ownership, comments, revisions, private sharing, or API keys:

```bash
docscn login --host https://docscn.ai
docscn whoami
```

Defaults:

- `DOCSCN_URL`, saved config, or `https://docscn.ai`
- `visibility=unlisted`
- `kind=custom-html`
- `author=docscn CLI`

For local development against the Next.js app, pass `--host http://localhost:3000`
or set `DOCSCN_URL=http://localhost:3000`.

## Templates

The CLI discovers templates from the GitHub copy of this repository:

```bash
docscn template list
docscn template get html-effectiveness-prompt-tuner --output prompt-tuner.html
docscn publish prompt-tuner.html
```

Templates live in `examples/artifacts/`. Installed CLIs do not need a local
checkout to inspect or copy a starter HTML file. For forks or release testing,
override the source with `DOCSCN_TEMPLATE_REPOSITORY` and
`DOCSCN_TEMPLATE_REF`, or point `DOCSCN_TEMPLATE_RAW_BASE` at another raw file
host.

## Collaboration Commands

```bash
docscn artifact feedback artifact-slug
docscn revise artifact-slug revised.html --summary "Addressed review feedback"
docscn share artifact-slug --email reviewer@example.com --role commenter
docscn comment thread-id --body "Updated in revision 2."
```
