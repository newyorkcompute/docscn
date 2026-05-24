# docscn CLI

Minimal CLI for publishing self-contained HTML artifacts to a docscn server.

## Building

Run `nx build cli` to build the library.

## Local Usage

```bash
npm run cli -- publish artifact.html
```

Publishing without an API key creates an anonymous unlisted, view-only artifact
and saves a local recovery receipt. `docscn login` automatically recovers saved
anonymous artifacts, then unlocks private/public owned artifacts, comments, and
revisions.

Defaults:

- `DOCSCN_URL` or `http://localhost:3000`
- `visibility=unlisted`
- `kind=custom-html`
- `author=docscn CLI`
