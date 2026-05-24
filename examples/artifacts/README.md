# Example artifacts

Self-contained HTML files for testing publish, review, and revision flows.

| File | Kind | Description |
| --- | --- | --- |
| `minimal.html` | custom-html | Smallest possible publish smoke test |
| `incident-timeline.html` | incident-timeline | Dark incident timeline with metrics sidebar |
| `migration-plan.html` | migration-plan | Four-lane migration board |
| `eval-dashboard.html` | generated-dashboard | Eval metrics cards and scenario table |
| `pr-review.html` | pr-review | PR review summary with checklist and diff highlights |

Browse previews locally at `/examples` after starting the web app.

## Publish from the CLI

```bash
docscn login --host http://localhost:3000
docscn publish examples/artifacts/incident-timeline.html --host http://localhost:3000
```

Or publish from the browser at `/publish`.

Each file must include a full `<html>` document because docscn renders artifacts
inside a sandboxed iframe.
