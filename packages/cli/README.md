# docscn CLI

Minimal CLI for publishing self-contained HTML artifacts to a docscn server.

## Building

Run `nx build cli` to build the library.

## Local Usage

```bash
npm run cli -- publish artifact.html
```

Publishing without an API key creates an anonymous unlisted, view-only artifact.
Use `docscn login` or `DOCSCN_API_KEY=docscn_sk_...` for private/public owned
artifacts, comments, and revisions.

Defaults:

- `DOCSCN_URL` or `http://localhost:3000`
- `visibility=unlisted`
- `kind=custom-html`
- `author=docscn CLI`
