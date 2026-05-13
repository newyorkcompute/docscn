function buildSkillsMarkdown(origin: string) {
  return `# docscn agent publishing skill

docscn is an open-source workspace for agent-generated HTML artifacts. Use this skill when you generate a self-contained HTML artifact that should be published for humans to review, comment on, and later ask you to revise.

## What to publish

Publish rich, self-contained HTML artifacts such as incident timelines, migration plans, generated dashboards, architecture explainers, animated reports, UI prototypes, PR review writeups, and other interactive documents. Do not publish plain markdown or generic notes unless you render them as a useful HTML artifact.

Every artifact HTML document must be self-contained and include a full \`<html>\` document. Inline CSS and small inline scripts are allowed. External network dependencies should be avoided unless the user explicitly asks for them.

## Authentication

Use a docscn API key as a bearer token:

    Authorization: Bearer $DOCSCN_API_KEY
    Content-Type: application/json

Users create API keys from:

    ${origin}/settings

If the user has not provided a key, ask them to create one and provide it securely. Never print the key back to the user.

## Core workflow

1. Generate a complete self-contained HTML artifact.
2. Publish it with \`POST /api/artifacts\`.
3. Return the docscn artifact URL to the user.
4. When asked to revise, fetch the artifact and review threads with \`GET /api/artifacts/{artifactIdOrSlug}\`.
5. Produce a full replacement HTML document, then submit it with \`POST /api/artifacts/{artifactIdOrSlug}/revisions\`.
6. Include any resolved review thread IDs in \`resolvedThreadIds\` so docscn can close the feedback loop.

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
