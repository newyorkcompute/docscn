# docscn CLI

Minimal CLI for publishing self-contained HTML artifacts to a docscn server.

## Building

Run `nx build cli` to build the library.

## Local Usage

```bash
npm run cli -- publish artifact.html
npm run cli -- template list
npm run cli -- template get html-effectiveness-code-approaches --output artifact.html
```

Publishing without an API key creates an anonymous unlisted, view-only artifact
and saves a local recovery receipt. `docscn login` automatically recovers saved
anonymous artifacts for 90 days after publish, then unlocks private/public owned
artifacts, comments, and revisions. After the receipt expires, the unlisted link
still works but ownership can no longer be recovered.

Defaults:

- `DOCSCN_URL` or `http://localhost:3000`
- `visibility=unlisted`
- `kind=custom-html`
- `author=docscn CLI`

## Templates

The CLI discovers templates from the GitHub copy of this repository:

```bash
docscn template list
docscn template get html-effectiveness-prompt-tuner --output prompt-tuner.html
docscn publish prompt-tuner.html --host http://localhost:3000
```

Templates live in `examples/artifacts/`. Installed CLIs do not need a local
checkout to inspect or copy a starter HTML file. For forks or release testing,
override the source with `DOCSCN_TEMPLATE_REPOSITORY` and
`DOCSCN_TEMPLATE_REF`, or point `DOCSCN_TEMPLATE_RAW_BASE` at another raw file
host.
