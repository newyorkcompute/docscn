function buildSkillsMarkdown(origin: string) {
  return `# docscn agent skill

Host, share, and revise **self-contained HTML artifacts** at stable URLs. Use this when the deliverable should be an interactive page humans open in a browser—not a markdown dump.

**Loop:** publish → get feedback → revise (optionally resolving threads).

**References:** [OpenAPI](${origin}/openapi.json) · [Templates](${origin}/templates) · [Template manifest](https://github.com/newyorkcompute/docscn/blob/main/examples/artifacts/templates.json)

**Inspiration (HTML over markdown):** [Anthropic](https://claude.com/blog/using-claude-code-the-unreasonable-effectiveness-of-html) · [Thariq Shihipar — examples](https://thariqs.github.io/html-effectiveness/)

## Quick start (CLI)

    curl ${origin}/install -fsS | bash
    docscn template list
    docscn template get html-effectiveness-code-approaches --output artifact.html
    docscn publish artifact.html --host ${origin}
    docscn login --host ${origin}    # optional: ownership, comments, revisions, private sharing

First publish without login → **unlisted, view-only** URL + local recovery receipt (90 days). Login recovers anonymous artifacts and stores \`~/.docscn/config.json\`. Never ask for passwords; the user approves in the browser.

## Integrations

| Path | Use when |
| --- | --- |
| **CLI** (\`docscn\`) | Shell access; handles install, login, templates, publish, feedback, revise, share. |
| **MCP** | Cursor / Claude Desktop — same API as tools (see table below). |
| **REST** | CI or custom clients — \`Authorization: Bearer\` + OpenAPI. |

**Env:** \`DOCSCN_URL=${origin}\` · \`DOCSCN_API_KEY=docscn_sk_...\` (from ${origin}/settings or \`docscn login\`)

**Template overrides (forks):** \`DOCSCN_TEMPLATE_REPOSITORY\`, \`DOCSCN_TEMPLATE_REF\`, \`DOCSCN_TEMPLATE_RAW_BASE\`

## Templates

- Browse: \`${origin}/templates\`
- CLI: \`docscn template list [--json]\` · \`docscn template get <id> --output file.html\`
- Source: \`examples/artifacts/html-effectiveness/\` (Apache-2.0); manifest lists all ids
- Preview on host: \`${origin}/artifacts/html-effectiveness-code-approaches\` (and other \`html-effectiveness-*\` slugs)

Copy or adapt a template, then publish the resulting **complete** \`<!doctype html>\` document.

## What to publish

Incident timelines, plans, dashboards, architecture explainers, prototypes, PR reviews, slide decks, custom editors—anything that benefits from layout, SVG, tables, tabs, or light interaction. Prefer HTML when markdown would be a wall of text.

**Rules:** self-contained HTML; inline CSS/small scripts OK; avoid external deps unless asked; semantic HTML; responsive; full-viewport layouts (no wasted hero margins). **Theme:** docscn sets \`html.light\` / \`html.dark\` and \`data-docscn-theme\` on the iframe—use CSS variables for both modes; do not rely on \`prefers-color-scheme\` alone. See templates under \`examples/artifacts/html-effectiveness/\` for patterns.

**Taste:** clean typography, neutral surfaces, restrained color—polished product UI, not raw browser defaults. Tailwind/shadcn are **not** global inside the iframe unless you bundle them.

Interactive artifacts should include export/copy (JSON, markdown, diff, settings) when users need to paste changes back into an agent.

## Auth and access

- **Anonymous publish:** unlisted only; omit Bearer. Invalid Bearer → \`401\`.
- **Owner features** (revise, threads, comment, private, share, visibility): session or API key required.
- **Private artifacts:** owner (+ invited emails) only. **Shares do not send email**—access applies immediately.
- **Read:** public/unlisted readable without auth; private needs owner or invite.
- **Limits:** HTML over 1 MB → \`413\`; anonymous publish rate limit → \`429\`. Report status + JSON \`error\`; do not retry blindly.

## CLI commands

    docscn whoami --host ${origin}
    docscn update --check
    docscn update
    docscn publish artifact.html --host ${origin} [--visibility unlisted|public|private] [--kind custom-html]
    docscn artifact feedback <id-or-slug> [--json] [--revision <id>] --host ${origin}
    docscn artifact get <id-or-slug> --json --host ${origin}
    docscn revise <id-or-slug> revised.html --summary "..." [--resolve <thread-id>]... --host ${origin}
    docscn thread create <id-or-slug> --title "..." --body "..." [--status open|needs-revision|resolved] [--anchor-label ... --anchor-x N --anchor-y N] --host ${origin}
    docscn comment <thread-id> --body "..." --host ${origin}
    docscn share <id-or-slug> --email a@b.com --role viewer|commenter [--remove] --host ${origin}

\`artifact feedback\` prints a revision **prompt** by default; use \`--json\` for \`{ bundle, prompt }\`.

## REST (summary)

| Method | Path | Auth |
| --- | --- | --- |
| GET | \`/api/me\` | Bearer |
| GET | \`/api/artifacts\` | Optional |
| POST | \`/api/artifacts\` | Optional (anonymous → unlisted) |
| GET | \`/api/artifacts/{id}\` | Optional |
| PATCH | \`/api/artifacts/{id}\` body \`{ visibility }\` | Owner |
| GET/POST/DELETE | \`/api/artifacts/{id}/shares\` body \`{ email, role }\` or \`{ email }\` | Owner |
| GET | \`/api/artifacts/{id}/feedback\` ?\`revisionId=\` | Optional |
| POST | \`/api/artifacts/{id}/revisions\` | Owner |
| POST | \`/api/artifacts/{id}/threads\` | Owner |
| POST | \`/api/review-threads/{id}/comments\` | Owner |
| PATCH | \`/api/review-threads/{id}\` body \`{ status }\` | Owner |
| POST | \`/api/artifacts/claims\` | Bearer |

**Publish body:** \`title\`, \`description\`, \`html\`, \`visibility\`, \`authorName\`, \`source\` (web|cli|cursor|claude|opencode|mcp|…), \`kind\` (incident-timeline|migration-plan|…|custom-html). Return \`${origin}{result.url}\` to the user.

**Feedback:** \`GET …/feedback\` → \`{ bundle, prompt }\` — use \`prompt\` for LLMs, \`bundle.openThreads\` for \`resolvedThreadIds\` on revise.

Full schemas: \`${origin}/openapi.json\`

## MCP tools

| Tool | Auth |
| --- | --- |
| \`publish_artifact\`, \`list_artifacts\`, \`get_artifact\`, \`get_feedback\` | Optional |
| \`submit_revision\`, \`create_thread\`, \`add_comment\`, \`update_thread_status\` | Required |
| \`share_artifact\`, \`remove_artifact_share\`, \`list_artifact_shares\`, \`update_artifact_visibility\` | Owner |
| \`claim_artifacts\`, \`get_me\` | Required |

Run: \`npm run mcp\` from a repo checkout. Configure \`DOCSCN_URL\` + \`DOCSCN_API_KEY\` in the host. Details: [docs/mcp.md](https://github.com/newyorkcompute/docscn/blob/main/docs/mcp.md)

## Agent checklist

- Default \`unlisted\` unless the user wants public or private.
- Return the artifact URL and a short summary after publish/revise.
- Use templates or \`html-effectiveness\` examples when the artifact type matches.
- Prefer visual structure (cards, timelines, diagrams) over long prose.
- On failure, show HTTP status and response body once.
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
