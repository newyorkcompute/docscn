# docscn CLI

Minimal CLI for publishing self-contained HTML artifacts to a docscn server.

## Building

Run `nx build cli` to build the library.

## Local Usage

```bash
DOCSCN_API_KEY=docscn_sk_... npm run cli -- publish artifact.html
```

Defaults:

- `DOCSCN_URL` or `http://localhost:3000`
- `visibility=unlisted`
- `kind=custom-html`
- `author=docscn CLI`
