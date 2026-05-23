# Example artifacts

Small self-contained HTML files for testing publish, review, and revision flows.

```bash
npm run cli -- publish examples/artifacts/minimal.html --host http://localhost:3000
```

Each file must include a full `<html>` document because docscn renders artifacts
inside a sandboxed iframe.
