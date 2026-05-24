# Project agent skills

Agent skills for this repository live under `.agents/skills/`. Each skill is a
directory with a `SKILL.md` file. Cursor and compatible agents can use these for
repo-specific workflows.

## Included skills

| Skill | Source | Use when |
| --- | --- | --- |
| [emil-design-eng](./emil-design-eng/SKILL.md) | [Emil Kowalski skill](https://github.com/emilkowalski/skill/tree/main/skills/emil-design-eng) | UI polish, motion decisions, press/hover states, and invisible interaction details |
| [web-artifacts-builder](./web-artifacts-builder/SKILL.md) | [Anthropic skills](https://github.com/anthropics/skills/tree/main/skills/web-artifacts-builder) | Complex React + Tailwind + shadcn/ui artifacts bundled to a single HTML file |
| [mcp-builder](./mcp-builder/SKILL.md) | [Anthropic skills](https://github.com/anthropics/skills/tree/main/skills/mcp-builder) | Building or extending MCP servers (tools, evals, TypeScript/Python patterns) |
| [doc-coauthoring](./doc-coauthoring/SKILL.md) | [Anthropic skills](https://github.com/anthropics/skills/tree/main/skills/doc-coauthoring) | Writing specs, RFCs, decision docs, proposals — structured 3-stage co-authoring workflow |
| [frontend-design](./frontend-design/SKILL.md) | [Anthropic claude-code](https://github.com/anthropics/claude-code/tree/main/plugins/frontend-design/skills/frontend-design) | Building distinctive UI, HTML artifacts, or frontend surfaces |

For publishing hosted HTML artifacts to docscn, also read `/skills.md` on a
running instance (agent API guidance for publish → review → revise).

## Adding skills

Add a new directory:

```text
.agents/skills/<skill-name>/SKILL.md
```

Follow the [Cursor skill format](https://cursor.com/docs/agent/skills): YAML
frontmatter with `name` and `description`, then markdown instructions.

If vendoring from another project, include attribution and license terms in the
skill directory.
