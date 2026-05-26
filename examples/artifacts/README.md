# Example artifacts

Self-contained HTML files for testing publish, review, and revision flows.

The public template library is powered by a mirrored copy of the Apache-2.0 licensed
[`ThariqS/html-effectiveness`](https://github.com/ThariqS/html-effectiveness)
template set. The upstream license and README are preserved in
`html-effectiveness/`.

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
`/artifacts/html-effectiveness-code-approaches`,
`/artifacts/html-effectiveness-code-review-pr`, or
`/artifacts/html-effectiveness-prompt-tuner`, after starting the web app.

`templates.json` is the shared manifest for the web template library and the
GitHub-backed CLI template commands.

## Publish from the CLI

```bash
docscn template list
docscn template get html-effectiveness-code-approaches --output artifact.html
docscn publish artifact.html --host http://localhost:3000
docscn login --host http://localhost:3000 # optional: claim ownership
```

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
