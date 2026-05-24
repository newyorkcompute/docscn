# Example artifacts

Self-contained HTML files for testing publish, review, and revision flows.

| File | Kind | Description |
| --- | --- | --- |
| `minimal.html` | custom-html | Smallest possible publish smoke test |
| `incident-timeline.html` | incident-timeline | Incident timeline with metrics sidebar (light/dark) |
| `migration-plan.html` | migration-plan | Four-lane migration board (light/dark) |
| `eval-dashboard.html` | generated-dashboard | Eval metrics cards and scenario table (light/dark) |
| `pr-review.html` | pr-review | PR review summary with checklist and diff highlights (light/dark) |

Browse previews locally at `/examples` after starting the web app.

## Publish from the CLI

```bash
docscn login --host http://localhost:3000
docscn publish examples/artifacts/incident-timeline.html --host http://localhost:3000
```

Or publish from the browser at `/publish`.

Each file must include a full `<html>` document because docscn renders artifacts
inside a sandboxed iframe.

## Light and dark mode

docscn syncs the app theme into each artifact iframe by setting `light` or `dark`
on `<html>` (and `data-docscn-theme`). Example files use CSS variables with:

- default (`:root`) — light palette
- `html.dark` / `html[data-docscn-theme='dark']` — dark palette
- `html.light` / `html[data-docscn-theme='light']` — explicit light palette

Toggle the theme in the artifact workspace toolbar to verify both modes.
