# docscn MCP server

The docscn MCP server exposes the publish → review → revise loop to MCP clients
(Cursor, Claude Desktop, and other Model Context Protocol hosts).

## Tools

| Tool | Purpose |
| --- | --- |
| `publish_artifact` | Publish self-contained HTML to a stable docscn URL |
| `get_feedback` | Fetch structured review threads plus a revision prompt |
| `submit_revision` | Submit replacement HTML and optionally resolve threads |

These tools call the same REST API documented in `/skills.md` and
`/openapi.json`.

## Prerequisites

1. A running docscn instance (local or hosted)
2. A docscn API key

Create an API key from **Settings** in the web UI, or run:

```bash
docscn login --host http://localhost:3000
```

## Run locally

Build and start the stdio MCP server:

```bash
npm run mcp
```

Set credentials with environment variables:

```bash
export DOCSCN_URL=http://localhost:3000
export DOCSCN_API_KEY=docscn_sk_...
npm run mcp
```

The server also reads `~/.docscn/config.json` from `docscn login`.

## Cursor configuration

Add this to `.cursor/mcp.json` (or Cursor MCP settings):

```json
{
  "mcpServers": {
    "docscn": {
      "command": "node",
      "args": ["/absolute/path/to/docscn/dist/packages/mcp/src/index.js"],
      "env": {
        "DOCSCN_URL": "http://localhost:3000",
        "DOCSCN_API_KEY": "docscn_sk_..."
      }
    }
  }
}
```

Replace the path with your local clone after `npm run build` or `nx build mcp`.

## Claude Desktop configuration

```json
{
  "mcpServers": {
    "docscn": {
      "command": "node",
      "args": ["/absolute/path/to/docscn/dist/packages/mcp/src/index.js"],
      "env": {
        "DOCSCN_URL": "http://localhost:3000",
        "DOCSCN_API_KEY": "docscn_sk_..."
      }
    }
  }
}
```

## Typical agent loop

1. `publish_artifact` with complete HTML
2. Share the returned URL for human review
3. `get_feedback` when reviewers leave threads
4. `submit_revision` with updated HTML and `resolvedThreadIds` from open threads

## Related docs

- Agent skill reference: `/skills.md`
- OpenAPI spec: `/openapi.json`
- CLI equivalent: `docscn publish`, `docscn artifact feedback`, `docscn revise`
