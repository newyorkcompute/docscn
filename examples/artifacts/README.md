# Example artifacts

Self-contained HTML files for testing publish, review, and revision flows.

This directory includes docscn-native starter artifacts and a mirrored copy of
the Apache-2.0 licensed
[`ThariqS/html-effectiveness`](https://github.com/ThariqS/html-effectiveness)
template set. The upstream license and README are preserved in
`html-effectiveness/`.

## docscn starters

| File                     | Kind                   | Description                                                       |
| ------------------------ | ---------------------- | ----------------------------------------------------------------- |
| `minimal.html`           | custom-html            | Smallest possible publish smoke test                              |
| `incident-timeline.html` | incident-timeline      | Incident timeline with metrics sidebar (light/dark)               |
| `migration-plan.html`    | migration-plan         | Four-lane migration board (light/dark)                            |
| `eval-dashboard.html`    | generated-dashboard    | Eval metrics cards and scenario table (light/dark)                |
| `pr-review.html`         | pr-review              | PR review summary with checklist and diff highlights (light/dark) |
| `design-directions.html` | ui-prototype           | Side-by-side visual directions for product review (light/dark)    |
| `module-map.html`        | architecture-explainer | Module map with entry points and flow diagram (light/dark)        |
| `animation-sandbox.html` | animated-report        | Motion tuning sandbox with copyable CSS (light/dark)              |
| `slide-deck.html`        | custom-html            | Arrow-key HTML slide deck (light/dark)                            |
| `prompt-tuner.html`      | ui-prototype           | Prompt template editor with live rendered output (light/dark)     |

## HTML effectiveness templates

| Section                     | Files                                                                                                      |
| --------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Exploration & Planning      | `01-exploration-code-approaches.html`, `02-exploration-visual-designs.html`, `16-implementation-plan.html` |
| Code Review & Understanding | `03-code-review-pr.html`, `04-code-understanding.html`, `17-pr-writeup.html`                               |
| Design                      | `05-design-system.html`, `06-component-variants.html`                                                      |
| Prototyping                 | `07-prototype-animation.html`, `08-prototype-interaction.html`                                             |
| Illustrations & Diagrams    | `10-svg-illustrations.html`, `13-flowchart-diagram.html`                                                   |
| Decks                       | `09-slide-deck.html`                                                                                       |
| Research & Learning         | `14-research-feature-explainer.html`, `15-research-concept-explainer.html`                                 |
| Reports                     | `11-status-report.html`, `12-incident-report.html`                                                         |
| Custom Editing Interfaces   | `18-editor-triage-board.html`, `19-editor-feature-flags.html`, `20-editor-prompt-tuner.html`               |

Browse previews locally in the artifact workspace, for example
`/artifacts/minimal`, `/artifacts/incident-timeline`, or
`/artifacts/html-effectiveness-prompt-tuner`, after starting the web app.

`templates.json` is the shared manifest for the web template library and the
GitHub-backed CLI template commands.

## Publish from the CLI

```bash
docscn login --host http://localhost:3000
docscn template list
docscn template get incident-timeline --output incident-timeline.html
docscn publish incident-timeline.html --host http://localhost:3000
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

## Shared template theme

All starter templates include an embedded `data-docscn-template-theme` style
block that maps common template tokens to docscn's warm paper/orange visual
language. Keep templates self-contained, but prefer these shared tokens when
adding new examples so the gallery feels cohesive.
