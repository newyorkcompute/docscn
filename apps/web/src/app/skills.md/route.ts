function buildSkillsMarkdown(origin: string) {
  return `# docscn agent publishing skill

docscn is an open-source workspace for agent-generated HTML artifacts. Use this skill when you generate a self-contained HTML artifact that should be published for humans to review, comment on, and later ask you to revise.

## What to publish

Publish rich, self-contained HTML artifacts such as incident timelines, migration plans, generated dashboards, architecture explainers, animated reports, UI prototypes, PR review writeups, and other interactive documents. Do not publish plain markdown or generic notes unless you render them as a useful HTML artifact.

Every artifact HTML document must be self-contained and include a full \`<html>\` document. Inline CSS and small inline scripts are allowed. External network dependencies should be avoided unless the user explicitly asks for them.

## Why docscn prefers HTML over markdown

Use HTML when markdown would become a long, hard-to-read document. HTML is the preferred format for dense agent outputs because it can combine structure, tables, CSS, SVG diagrams, code snippets, interactions, forms, charts, canvas-like spatial layouts, and export buttons in one shareable artifact.

Good docscn artifacts should help the user stay in the loop. Optimize for visual clarity, information density, and easy review by humans who may not read a long markdown file. If the output would otherwise need ASCII diagrams, giant tables, color approximations, or multiple markdown files, make it HTML.

## Artifact design guidance

docscn itself uses a shadcn/Tailwind-inspired design language: clean typography, neutral surfaces, subtle borders, restrained shadows, blue primary accents, and accessible contrast. Generated artifacts should feel polished and product-like, not like raw browser defaults.

Artifacts are rendered as sandboxed self-contained HTML. Do not assume Tailwind CSS, shadcn/ui, React, or any app-level styles are available inside the artifact iframe unless you include the required CSS and JavaScript yourself. Prefer plain HTML, CSS variables, inline SVG, and small vanilla JavaScript.

Support light and dark mode inside the artifact when possible. Use CSS variables and \`prefers-color-scheme\`, for example define neutral backgrounds, text colors, borders, and accent colors for both themes. Avoid hardcoding a dark-only or light-only artifact unless the user asks for it.

Use responsive layouts so artifacts are readable in narrow and wide viewports. Prefer semantic HTML, keyboard-friendly controls, readable font sizes, and sufficient color contrast.

## High-value artifact patterns

Prefer artifacts that are immediately useful as interactive pages:

- Specs, plans, and explorations with tabs, comparison grids, mockups, data flow diagrams, risks, and code snippets.
- Code review explainers with rendered diffs, inline annotations, severity color-coding, architecture diagrams, and reviewer checklists.
- Design prototypes with visual states, motion examples, sliders, knobs, and copyable parameters.
- Reports and research summaries with charts, SVG illustrations, timelines, expandable details, and leadership-friendly summaries.
- Custom editing interfaces for triage, prioritization, prompt tuning, config editing, tagging datasets, annotating diffs, or exporting structured changes.

For two-way interaction, include an explicit export path such as "copy as JSON", "copy as markdown", "copy prompt", "copy diff", or "copy settings" so the user's interactions can be pasted back into an agent.

## Golden path: use the CLI

Agents should use the docscn CLI whenever possible. It stores a local API key in \`~/.docscn/config.json\`, so the user does not need to paste credentials repeatedly.

First, verify or create a local login:

    npx docscn login --host ${origin}

This opens a browser window. The user signs in or creates an account, approves the CLI login, and the CLI saves a token locally. Do not ask for the user's password. Do not create accounts on behalf of users.

After login, verify the connection:

    npx docscn whoami --host ${origin}

## Core CLI workflow

1. Generate a complete self-contained HTML artifact.
2. Save it to a local \`.html\` file.
3. Publish it with \`npx docscn publish artifact.html --host ${origin}\`.
4. Return the docscn artifact URL to the user.
5. When asked to revise, run \`npx docscn artifact get <artifact-id-or-slug> --json --host ${origin}\`.
6. Inspect open and needs-revision threads.
7. Produce a full replacement HTML document, then run \`npx docscn revise <artifact-id-or-slug> revised.html --summary "..." --resolve <thread-id> --host ${origin}\`.
8. Reply to reviewers when useful with \`npx docscn comment <thread-id> --body "..." --host ${origin}\`.

## CLI commands

Publish:

    npx docscn publish artifact.html --host ${origin} --visibility unlisted --kind custom-html

Read artifact feedback:

    npx docscn artifact get <artifact-id-or-slug> --json --host ${origin}

Submit a revision:

    npx docscn revise <artifact-id-or-slug> revised.html --summary "Addressed review feedback" --resolve <thread-id> --host ${origin}

Create an agent-authored review thread:

    npx docscn thread create <artifact-id-or-slug> --title "Suggested improvement" --body "..." --host ${origin}

Reply to a thread:

    npx docscn comment <thread-id> --body "Updated in revision 2." --host ${origin}

## Raw API authentication

If the CLI is unavailable, use a docscn API key as a bearer token:

    Authorization: Bearer $DOCSCN_API_KEY
    Content-Type: application/json

Users can also create API keys manually from:

    ${origin}/settings

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

    GET ${origin}/api/artifacts/{artifactIdOrSlug}

Use this before revising. The response includes the artifact, revisions, and review threads:

    {
      "artifact": {
        "id": "artifact_...",
        "slug": "agent-generated-incident-timeline-...",
        "currentRevisionId": "revision_...",
        "metadata": { "...": "..." },
        "revisions": [{ "...": "..." }]
      },
      "threads": [
        {
          "id": "thread_...",
          "status": "needs-revision",
          "title": "Clarify the mitigation sequence",
          "requestedChange": "Show detection, rollback, and follow-up as separate steps.",
          "anchor": { "label": "timeline card", "x": 42.5, "y": 31.2 },
          "comments": [{ "body": "Please split this into three phases.", "role": "human" }]
        }
      ]
    }

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

## Review notes for agents

- Prefer publishing polished HTML over raw notes.
- Keep the artifact interactive when interaction adds value.
- Prefer visual structure over long prose: use grids, cards, diagrams, tables, tabs, timelines, and callouts when they clarify the work.
- Include export/copy actions for interactive artifacts so users can turn UI changes back into prompts, JSON, diffs, or settings.
- Match docscn's shadcn/Tailwind-inspired taste with self-contained CSS; do not rely on Tailwind or shadcn being globally available inside the artifact.
- Support light and dark mode within the artifact where practical.
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
