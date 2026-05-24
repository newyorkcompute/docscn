# docscn MCP server

The docscn MCP server exposes the publish → review → revise loop to MCP clients
(Cursor, Claude Desktop, and other Model Context Protocol hosts).

## Tools

| Tool                   | Purpose                                                      | Auth required                           |
| ---------------------- | ------------------------------------------------------------ | --------------------------------------- |
| `publish_artifact`     | Publish self-contained HTML to a stable docscn URL           | Optional (anonymous unlisted supported) |
| `list_artifacts`       | List artifacts visible to the caller                         | Optional                                |
| `get_artifact`         | Fetch artifact metadata, revisions, and review threads       | Optional                                |
| `get_feedback`         | Fetch structured review threads plus a revision prompt       | Optional                                |
| `submit_revision`      | Submit replacement HTML and optionally resolve threads       | Yes                                     |
| `create_thread`        | Create a review thread with optional canvas anchor metadata  | Yes                                     |
| `add_comment`          | Add a comment to an existing review thread                   | Yes                                     |
| `update_thread_status` | Change thread status (artifact owner only)                   | Yes                                     |
| `claim_artifacts`      | Recover anonymous artifacts using saved local claim receipts | Yes                                     |
| `get_me`               | Return the authenticated caller identity                     | Yes                                     |

These tools call the same REST API documented in `/skills.md` and
`/openapi.json`.

## Prerequisites

1. A running docscn instance (local or hosted)
2. Optional: a docscn API key for private/public ownership, comments, and revisions

`publish_artifact` works without an API key for anonymous unlisted, view-only
artifacts. Anonymous publishes save a local claim receipt in
`~/.docscn/config.json` (the same file used by `docscn login`). When an API key
is configured, the MCP server attempts to recover saved anonymous artifacts on
startup. Claim receipts expire after 90 days; expired artifacts remain viewable
at their unlisted URLs but cannot be claimed.

Create an API key from **Settings** in the web UI, or run this before using
collaboration features:

```bash
docscn login --host http://localhost:3000
```

## Run locally

Build and start the stdio MCP server:

```bash
npm run mcp
```

Set host and optional credentials with environment variables:

```bash
export DOCSCN_URL=http://localhost:3000
export DOCSCN_API_KEY=docscn_sk_...
npm run mcp
```

Omit `DOCSCN_API_KEY` for anonymous unlisted publish-only usage. The server also
reads `~/.docscn/config.json` from `docscn login`.

## Cursor configuration

Add this to `.cursor/mcp.json` (or Cursor MCP settings):

```json
{
  "mcpServers": {
    "docscn": {
      "command": "node",
      "args": ["/absolute/path/to/docscn/dist/packages/mcp/src/index.js"],
      "env": {
        "DOCSCN_URL": "http://localhost:3000"
      }
    }
  }
}
```

Replace the path with your local clone after `npm run build` or `nx build mcp`.
Add `DOCSCN_API_KEY` when the MCP host should create public/private owned
artifacts, review artifacts, or submit revisions.

## Claude Desktop configuration

```json
{
  "mcpServers": {
    "docscn": {
      "command": "node",
      "args": ["/absolute/path/to/docscn/dist/packages/mcp/src/index.js"],
      "env": {
        "DOCSCN_URL": "http://localhost:3000"
      }
    }
  }
}
```

## Typical agent loop

1. `publish_artifact` with complete HTML
2. Share the returned URL for human review
3. Anonymous publishes save a local claim receipt automatically; run `docscn login`
   or configure `DOCSCN_API_KEY` before collaboration features
4. `get_feedback` when reviewers leave threads
5. `submit_revision` with updated HTML and `resolvedThreadIds` from open threads
6. Use `create_thread` and `add_comment` when the agent should leave structured review feedback
7. Use `list_artifacts` and `get_artifact` to find and inspect existing artifacts

## Related docs

- Agent skill reference: `/skills.md`
- OpenAPI spec: `/openapi.json`
- CLI equivalent: `docscn publish`, `docscn artifact get`, `docscn artifact feedback`, `docscn revise`, `docscn thread create`, `docscn comment`
