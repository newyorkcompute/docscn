function buildSkillsMarkdown(origin: string) {
  return `# docscn agent publishing skill

docscn is an open-source platform for hosting, sharing, and collaborating on AI-generated HTML artifacts. Use this skill when you generate a self-contained HTML artifact that should be published to a stable URL for humans to open, share, comment on, and later ask you to revise.

## Choose your integration

| Approach | Best for |
| --- | --- |
| **CLI** (\`docscn\`) | Local agents with shell access. Handles login and stores credentials in \`~/.docscn/config.json\`. |
| **MCP server** | Cursor, Claude Desktop, and other MCP hosts. Same REST API via MCP tools such as \`publish_artifact\`, \`list_artifacts\`, \`get_artifact\`, \`get_feedback\`, \`create_thread\`, \`add_comment\`, \`submit_revision\`, \`update_thread_status\`, \`claim_artifacts\`, and \`get_me\`. |
| **Raw REST API** | Headless automation, CI, or custom clients. Use \`Authorization: Bearer\` and see \`/openapi.json\` for the full schema. |

Core loop for all paths:

\`\`\`text
publish -> get feedback -> revise (optionally resolving threads)
\`\`\`

Machine-readable API spec: \`GET ${origin}/openapi.json\`

Template library: \`${origin}/templates\`

Template manifest: \`https://github.com/newyorkcompute/docscn/blob/main/examples/artifacts/templates.json\`

CLI template commands:

    docscn template list
    docscn template get html-effectiveness-code-approaches --output artifact.html

Template source files: \`examples/artifacts/\` in the repo. Agents should inspect these files when they have a repo checkout, or use \`docscn template get\` when they only have an installed CLI. Copy or adapt a template, then publish the resulting self-contained HTML. Starter artifacts can also be opened in the workspace at \`${origin}/artifacts/minimal\`, \`${origin}/artifacts/incident-timeline\`, \`${origin}/artifacts/design-directions\`, \`${origin}/artifacts/module-map\`, \`${origin}/artifacts/html-effectiveness-code-approaches\`, and \`${origin}/artifacts/html-effectiveness-prompt-tuner\`.

## Environment variables

Use these when the CLI or MCP server cannot rely on saved login state:

    DOCSCN_URL=${origin}
    DOCSCN_API_KEY=docscn_sk_...

Create API keys from \`${origin}/settings\` after signing in, or run \`docscn login --host ${origin}\` to save credentials locally.

## What to publish

Publish rich, self-contained HTML artifacts such as incident timelines, migration plans, generated dashboards, architecture explainers, animated reports, UI prototypes, PR review writeups, and other interactive documents. Do not publish plain markdown or generic notes unless you render them as a useful HTML artifact.

Every artifact HTML document must be self-contained and include a full \`<html>\` document. Inline CSS and small inline scripts are allowed. External network dependencies should be avoided unless the user explicitly asks for them.

## Why docscn prefers HTML over markdown

Use HTML when markdown would become a long, hard-to-read document. HTML is the preferred format for dense agent outputs because it can combine structure, tables, CSS, SVG diagrams, code snippets, interactions, forms, charts, canvas-like spatial layouts, and export buttons in one hosted, shareable artifact.

Good docscn artifacts should help the user stay in the loop. Optimize for visual clarity, information density, collaboration, and easy review by humans who may not read a long markdown file. If the output would otherwise need ASCII diagrams, giant tables, color approximations, or multiple markdown files, make it HTML.

## Artifact design guidance

docscn itself uses a shadcn/Tailwind-inspired design language: clean typography, neutral surfaces, subtle borders, restrained shadows, blue primary accents, and accessible contrast. Generated artifacts should feel polished and product-like, not like raw browser defaults.

Artifacts are rendered as sandboxed self-contained HTML. Do not assume Tailwind CSS, shadcn/ui, React, or any app-level styles are available inside the artifact iframe unless you include the required CSS and JavaScript yourself. Prefer plain HTML, CSS variables, inline SVG, and small vanilla JavaScript.

### Light and dark mode

docscn **syncs the app theme into the artifact iframe**. When a reviewer toggles light/dark on the site, docscn sets \`light\` or \`dark\` on the artifact's \`<html>\` element and sets \`data-docscn-theme\` to match. Artifacts should look correct in **both** modes unless the user explicitly asks for a single-theme design.

**Do not rely on \`prefers-color-scheme\` alone** — that only follows the OS and will not track docscn's theme toggle. Use it only as a fallback before classes are applied.

Recommended pattern:

1. Define shared tokens on \`:root\` (default to a light palette).
2. Override tokens for \`html.dark\` and \`html[data-docscn-theme='dark']\`.
3. Optionally pin light tokens on \`html.light\` and \`html[data-docscn-theme='light']\`.
4. Use \`var(--…)\` for backgrounds, text, borders, and accents — avoid hardcoded hex on \`body\` only.

Example (abbreviated):

    :root {
      color-scheme: light;
      --bg: #f8fafc;
      --fg: #0f172a;
      --muted: #64748b;
      --card: #ffffff;
      --border: #e2e8f0;
    }

    html.dark,
    html[data-docscn-theme='dark'] {
      color-scheme: dark;
      --bg: #0b1220;
      --fg: #e2e8f0;
      --muted: #94a3b8;
      --card: #111827;
      --border: #1f2937;
    }

    body {
      background: var(--bg);
      color: var(--fg);
    }

Reference implementations: \`examples/artifacts/*.html\` in the repo (e.g. \`minimal.html\`, \`pr-review.html\`, \`prompt-tuner.html\`) plus the Apache-2.0 licensed HTML effectiveness templates mirrored in \`examples/artifacts/html-effectiveness/\`.

Use responsive layouts so artifacts are readable in narrow and wide viewports. Prefer semantic HTML, keyboard-friendly controls, readable font sizes, and sufficient color contrast.

Design for a full-viewport canvas by default. docscn gets out of the way and gives the artifact the page, so avoid adding large outer margins, narrow centered wrappers, or decorative browser chrome unless the artifact intentionally needs a document/card feel. Set \`html\`, \`body\`, and the main app shell to \`min-height: 100%\` or \`100vh\`, and let the most important content use the available space.

## High-value artifact patterns

Prefer artifacts that are immediately useful as interactive pages:

- Specs, plans, and explorations with tabs, comparison grids, mockups, data flow diagrams, risks, and code snippets.
- Code review explainers with rendered diffs, inline annotations, severity color-coding, architecture diagrams, and reviewer checklists.
- Design prototypes with visual states, motion examples, sliders, knobs, and copyable parameters.
- Reports and research summaries with charts, SVG illustrations, timelines, expandable details, and leadership-friendly summaries.
- Custom editing interfaces for triage, prioritization, prompt tuning, config editing, tagging datasets, annotating diffs, or exporting structured changes.

For two-way interaction, include an explicit export path such as "copy as JSON", "copy as markdown", "copy prompt", "copy diff", or "copy settings" so the user's interactions can be pasted back into an agent.

## Golden path: use the CLI

Agents should use the docscn CLI whenever possible. The first publish can run without login and creates an unlisted, view-only artifact. The CLI saves a local recovery receipt, then login adds an API key to \`~/.docscn/config.json\` and automatically recovers anonymous artifacts for comments, revisions, private artifacts, analytics, and ownership when login happens within 90 days.

First, install the CLI if \`docscn\` is not already available:

    curl ${origin}/install -fsS | bash

Optional, but recommended before review/revision work:

    docscn login --host ${origin}

This opens a browser window. The user signs in or creates an account, approves the CLI login, and the CLI saves a token locally. Do not ask for the user's password. Do not create accounts on behalf of users. If the user only wants a quick share link, skip login and publish unlisted. Anonymous artifacts published from the same CLI install are recovered automatically after login for 90 days.

After login, verify the connection:

    docscn whoami --host ${origin}

## Core CLI workflow

1. Generate a complete self-contained HTML artifact.
2. Save it to a local \`.html\` file.
3. Publish it with \`docscn publish artifact.html --host ${origin}\`. Without login this returns an unlisted view-only URL and saves a local recovery receipt.
4. Return the docscn artifact URL to the user so they can open and share it.
5. For comments, feedback bundles, private artifacts, and revisions, run \`docscn login --host ${origin}\` first.
6. When asked to revise, run \`docscn artifact feedback <artifact-id-or-slug> --host ${origin}\`.
7. Inspect open and needs-revision threads from the bundle or prompt.
8. Produce a full replacement HTML document, then run \`docscn revise <artifact-id-or-slug> revised.html --summary "..." --resolve <thread-id> --host ${origin}\`.
9. Reply to reviewers when useful with \`docscn comment <thread-id> --body "..." --host ${origin}\`.
10. Invite private reviewers when asked with \`docscn share <artifact-id-or-slug> --email reviewer@example.com --role viewer --host ${origin}\`.

## CLI commands

Publish:

    docscn publish artifact.html --host ${origin} --visibility unlisted --kind custom-html

Read artifact feedback (prints a revision **prompt** by default):

    docscn artifact feedback <artifact-id-or-slug> --host ${origin}
    docscn artifact feedback <artifact-id-or-slug> --json --host ${origin}
    docscn artifact feedback <artifact-id-or-slug> --revision <revision-id> --host ${origin}

Use \`--json\` for the structured \`{ bundle, prompt }\` response. Use \`--revision\` to read feedback for a specific revision instead of the current one.

For full artifact metadata and all threads:

    docscn artifact get <artifact-id-or-slug> --json --host ${origin}

Share a private artifact or grant commenter access:

    docscn share <artifact-id-or-slug> --email reviewer@example.com --role viewer --host ${origin}
    docscn share <artifact-id-or-slug> --email reviewer@example.com --role commenter --host ${origin}
    docscn share <artifact-id-or-slug> --email reviewer@example.com --remove --host ${origin}

Submit a revision (repeat \`--resolve\` for multiple threads):

    docscn revise <artifact-id-or-slug> revised.html --summary "Addressed review feedback" --resolve <thread-id> --host ${origin}

Create an agent-authored review thread:

    docscn thread create <artifact-id-or-slug> --title "Suggested improvement" --body "..." --host ${origin}
    docscn thread create <artifact-id-or-slug> --title "..." --body "..." --status needs-revision --requested-change "..." --anchor-label "card" --anchor-x 42 --anchor-y 31 --host ${origin}

Allowed \`--status\` values: \`open\`, \`needs-revision\`, \`resolved\`.

Reply to a thread:

    docscn comment <thread-id> --body "Updated in revision 2." --host ${origin}

Verify credentials:

    docscn whoami --host ${origin}

## Example artifacts

Publish from a checkout of the repo:

    docscn publish examples/artifacts/minimal.html --host ${origin}
    docscn publish examples/artifacts/incident-timeline.html --host ${origin}
    docscn publish examples/artifacts/migration-plan.html --host ${origin}
    docscn publish examples/artifacts/eval-dashboard.html --host ${origin}
    docscn publish examples/artifacts/pr-review.html --host ${origin}
    docscn publish examples/artifacts/design-directions.html --host ${origin}
    docscn publish examples/artifacts/module-map.html --host ${origin}
    docscn publish examples/artifacts/animation-sandbox.html --host ${origin}
    docscn publish examples/artifacts/slide-deck.html --host ${origin}
    docscn publish examples/artifacts/prompt-tuner.html --host ${origin}
    docscn publish examples/artifacts/html-effectiveness/01-exploration-code-approaches.html --host ${origin}
    docscn publish examples/artifacts/html-effectiveness/20-editor-prompt-tuner.html --host ${origin}

These are useful smoke tests for install, login, publish, review, and revise flows. The HTML effectiveness templates are grouped at \`${origin}/templates\` by Exploration & Planning, Code Review & Understanding, Design, Prototyping, Illustrations & Diagrams, Decks, Research & Learning, Reports, and Custom Editing Interfaces.

## Raw API authentication

If the CLI is unavailable, use a docscn API key as a bearer token:

    Authorization: Bearer $DOCSCN_API_KEY
    Content-Type: application/json

Users can also create API keys manually from:

    ${origin}/settings

### Auth and access rules

- **Publish** can be anonymous for unlisted, view-only artifacts. Invalid Bearer tokens still return \`401\`; omit the header to publish anonymously.
- **Anonymous recovery** is automatic for 90 days when a browser or CLI has local claim receipts and the user signs in. Agents should not ask users to manually copy claim tokens. Expired artifacts remain viewable at their unlisted URLs but cannot be claimed.
- **Anonymous limits** are intentionally simple: oversized anonymous HTML returns \`413\`; too many anonymous publishes returns \`429\`. Signing in unlocks owned publishing.
- **Revise, create threads, comment, private artifacts, analytics, and ownership features** require a valid session cookie or Bearer API key.
- **Private artifacts** are visible only to the owner (session or their API key). Public and unlisted artifacts are readable without auth unless you pass an invalid Bearer token (which returns \`401\`).
- **Revise and resolve threads** require the artifact owner. Other callers get \`403\`.
- On failure, report the HTTP status and JSON \`error\` field. Do not retry blindly.

### Verify caller identity

    GET ${origin}/api/me

Response:

    {
      "principal": {
        "userId": "user_...",
        "name": "Agent user",
        "kind": "api-key",
        "apiKeyId": "apikey_..."
      }
    }

### List artifacts

    GET ${origin}/api/artifacts

Returns artifacts visible to the caller (public/unlisted plus the caller's private artifacts when authenticated).

## Publish an artifact

Request:

    POST ${origin}/api/artifacts

Body:

    {
      "title": "Agent-generated incident timeline",
      "description": "Interactive timeline summarizing the production incident and remediation plan.",
      "html": "<!doctype html><html>...</html>",
      "visibility": "unlisted",
      "authorName": "Cursor agent",
      "source": "cursor",
      "kind": "incident-timeline"
    }

Allowed \`visibility\` values:

    public, unlisted, private

Anonymous publish requests are forced to \`unlisted\`. Use a session or Bearer API key for \`public\`, \`private\`, comments, revisions, ownership, and future analytics. Anonymous publish responses may include a one-time \`claimToken\`; store it locally, never print it in chat, and let docscn recover the artifact automatically after login within 90 days.

Allowed \`source\` values:

    web, cli, cursor, claude, opencode, mcp, scheduled-report, automation

Allowed \`kind\` values:

    incident-timeline, migration-plan, generated-dashboard, architecture-explainer, animated-report, ui-prototype, pr-review, custom-html

Response:

    {
      "artifact": { "...": "..." },
      "result": {
        "artifactId": "artifact_...",
        "slug": "agent-generated-incident-timeline-...",
        "url": "/artifacts/agent-generated-incident-timeline-...",
        "revisionId": "revision_..."
      }
    }

Return the absolute URL to the user:

    ${origin}{result.url}

## Fetch artifact feedback

Request:

    GET ${origin}/api/artifacts/{artifactIdOrSlug}/feedback

Optional query parameter:

    ?revisionId={revisionId}

Defaults to the artifact's current revision. Returns a structured bundle plus a ready-to-use revision prompt:

    {
      "bundle": {
        "artifact": {
          "id": "artifact_...",
          "slug": "agent-generated-incident-timeline-...",
          "title": "Incident timeline",
          "description": "...",
          "visibility": "unlisted",
          "kind": "custom-html"
        },
        "revision": {
          "id": "revision_...",
          "version": 1,
          "summary": "Initial publish"
        },
        "instructions": {
          "goal": "Revise the self-contained HTML artifact using the review feedback.",
          "constraints": ["Return a complete self-contained HTML document.", "..."]
        },
        "openThreads": [
          {
            "id": "thread_...",
            "status": "needs-revision",
            "title": "Clarify the mitigation sequence",
            "requestedChange": "Show detection, rollback, and follow-up as separate steps.",
            "anchor": { "label": "timeline card", "x": 42.5, "y": 31.2 },
            "comments": [
              { "author": "Reviewer", "role": "human", "body": "Please split this into three phases." }
            ]
          }
        ]
      },
      "prompt": "Revise \\"Incident timeline\\" from revision v1.\\n\\nAddress these open review threads:\\n..."
    }

Use \`prompt\` when feeding an LLM directly. Use \`bundle\` when you need structured thread IDs for \`resolvedThreadIds\`.

For full artifact metadata, revisions, and all threads, use:

    GET ${origin}/api/artifacts/{artifactIdOrSlug}

Treat open and needs-revision threads as structured instructions from reviewers. Preserve useful parts of the prior artifact, but submit a complete replacement HTML document.

## Submit a revision

Request:

    POST ${origin}/api/artifacts/{artifactIdOrSlug}/revisions

Body:

    {
      "html": "<!doctype html><html>...</html>",
      "summary": "Split the incident timeline into detection, rollback, and follow-up phases.",
      "authorName": "Cursor agent",
      "source": "cursor",
      "resolvedThreadIds": ["thread_..."]
    }

Response:

    {
      "revision": {
        "id": "revision_...",
        "version": 2,
        "summary": "Split the incident timeline into detection, rollback, and follow-up phases."
      }
    }

## Create a review thread

    POST ${origin}/api/artifacts/{artifactIdOrSlug}/threads

Body:

    {
      "title": "Clarify the mitigation sequence",
      "body": "Please split rollback into explicit phases.",
      "authorName": "Cursor agent",
      "role": "agent",
      "status": "needs-revision",
      "requestedChange": "Show detection, rollback, and follow-up separately.",
      "revisionId": "revision_...",
      "anchorLabel": "timeline card",
      "anchorX": 42.5,
      "anchorY": 31.2
    }

\`revisionId\` defaults to the artifact's current revision. \`status\` defaults to \`open\`.

## Add a comment

    POST ${origin}/api/review-threads/{threadId}/comments

Body:

    {
      "body": "Addressed in revision 2.",
      "authorName": "Cursor agent",
      "role": "agent"
    }

## Update thread status

Artifact owners only:

    PATCH ${origin}/api/review-threads/{threadId}

Body:

    { "status": "resolved" }

Allowed values: \`open\`, \`needs-revision\`, \`resolved\`.

## OpenAPI spec

Machine-readable REST documentation:

    GET ${origin}/openapi.json

Use this when wiring custom clients, SDKs, or automation outside the CLI and MCP server.

## MCP server

docscn ships an MCP server that mirrors the REST API. Each tool returns JSON text in the tool result.

| Tool | REST equivalent | Auth |
| --- | --- | --- |
| \`publish_artifact\` | \`POST /api/artifacts\` | Optional |
| \`list_artifacts\` | \`GET /api/artifacts\` | Optional |
| \`get_artifact\` | \`GET /api/artifacts/{id}\` | Optional |
| \`get_feedback\` | \`GET /api/artifacts/{id}/feedback\` | Optional |
| \`submit_revision\` | \`POST /api/artifacts/{id}/revisions\` | Required |
| \`create_thread\` | \`POST /api/artifacts/{id}/threads\` | Required |
| \`add_comment\` | \`POST /api/review-threads/{id}/comments\` | Required |
| \`update_thread_status\` | \`PATCH /api/review-threads/{id}\` | Required |
| \`claim_artifacts\` | \`POST /api/artifacts/claims\` | Required |
| \`get_me\` | \`GET /api/me\` | Required |

### \`publish_artifact\`

Publish self-contained HTML and return \`artifactId\`, \`slug\`, \`url\`, \`revisionId\`, and optionally \`claimReceiptSaved\` for anonymous publishes.

Inputs:

    {
      "title": "Incident timeline",
      "description": "Interactive sev-2 report.",
      "html": "<!doctype html><html>...</html>",
      "visibility": "unlisted",
      "kind": "incident-timeline",
      "authorName": "Cursor agent"
    }

\`visibility\`, \`kind\`, and \`authorName\` are optional. Anonymous publishes save a local claim receipt in \`~/.docscn/config.json\`.

### \`list_artifacts\`

List artifacts visible to the caller. No inputs.

### \`get_artifact\`

Fetch artifact metadata, revisions, and review threads.

Inputs:

    { "artifactIdOrSlug": "agent-generated-incident-timeline-..." }

### \`get_feedback\`

Fetch \`{ bundle, prompt }\` for an artifact. Same shape as \`GET /api/artifacts/{id}/feedback\`.

Inputs:

    {
      "artifactIdOrSlug": "agent-generated-incident-timeline-...",
      "revisionId": "revision_..."
    }

\`revisionId\` is optional and defaults to the current revision.

### \`submit_revision\`

Submit replacement HTML. Returns the new \`revision\` object.

Inputs:

    {
      "artifactIdOrSlug": "agent-generated-incident-timeline-...",
      "html": "<!doctype html><html>...</html>",
      "summary": "Split timeline into detection, rollback, and follow-up.",
      "resolvedThreadIds": ["thread_..."],
      "authorName": "Cursor agent"
    }

\`resolvedThreadIds\` and \`authorName\` are optional.

### \`create_thread\`

Create a review thread on an artifact. Returns the new \`thread\` object.

Inputs:

    {
      "artifactIdOrSlug": "agent-generated-incident-timeline-...",
      "title": "Clarify rollback timing",
      "body": "The rollback step should show exact timestamps.",
      "requestedChange": "Add timestamps to each rollback event.",
      "anchorLabel": "Rollback section",
      "anchorKind": "element",
      "anchorX": 42,
      "anchorY": 68
    }

Only \`artifactIdOrSlug\`, \`title\`, and \`body\` are required.

### \`add_comment\`

Add a comment to an existing review thread. Returns the new \`comment\` object.

Inputs:

    {
      "threadId": "thread_...",
      "body": "Updated in revision 2.",
      "authorName": "Cursor agent"
    }

### \`update_thread_status\`

Update thread status. Only the artifact owner can change status.

Inputs:

    { "threadId": "thread_...", "status": "resolved" }

### \`claim_artifacts\`

Recover anonymous artifacts for the authenticated caller. Uses saved local claim receipts when \`receipts\` is omitted.

Inputs:

    { "receipts": [{ "artifactId": "...", "slug": "...", "title": "...", "claimToken": "...", "createdAt": "..." }] }

\`receipts\` is optional.

### \`get_me\`

Return the authenticated caller identity. No inputs.

### Run and configure

Run locally after building the repo:

    npm run mcp

Configure Cursor, Claude Desktop, or another MCP host with:

    {
      "mcpServers": {
        "docscn": {
          "command": "node",
          "args": ["/absolute/path/to/docscn/dist/packages/mcp/src/index.js"],
          "env": {
            "DOCSCN_URL": "${origin}",
            "DOCSCN_API_KEY": "docscn_sk_..."
          }
        }
      }
    }

See [docs/mcp.md](https://github.com/newyorkcompute/docscn/blob/main/docs/mcp.md) for setup details.

## Review notes for agents

- Prefer publishing polished HTML over raw notes.
- Keep the artifact interactive when interaction adds value.
- Prefer visual structure over long prose: use grids, cards, diagrams, tables, tabs, timelines, and callouts when they clarify the work.
- Use the full viewport by default; avoid wasting the top of the page on empty margins or generic title cards.
- Include export/copy actions for interactive artifacts so users can turn UI changes back into prompts, JSON, diffs, or settings.
- Match docscn's shadcn/Tailwind-inspired taste with self-contained CSS; do not rely on Tailwind or shadcn being globally available inside the artifact.
- Support light and dark mode: sync with \`html.light\` / \`html.dark\` and \`data-docscn-theme\` (see **Light and dark mode** above), not OS \`prefers-color-scheme\` alone.
- Keep HTML portable: no build step, no framework runtime required, no secret values embedded.
- Use \`unlisted\` by default unless the user asks for public or private.
- Use \`private\` for sensitive content. Private artifacts require the owner's session or API key to read.
- When revising, respond with the artifact URL and a short summary of what changed.
- If you cannot reach docscn, report the HTTP status and response body instead of retrying repeatedly.
`;
}

export function GET(request: Request) {
  return new Response(buildSkillsMarkdown(new URL(request.url).origin), {
    headers: {
      'cache-control': 'no-store',
      'content-type': 'text/markdown; charset=utf-8',
    },
  });
}
