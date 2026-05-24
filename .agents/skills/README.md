# Project agent skills

Agent skills for this repository live under `.agents/skills/`. Each skill is a
directory with a `SKILL.md` file. Cursor and compatible agents can use these for
repo-specific workflows.

## Included skills

| Skill | Source | Use when |
| --- | --- | --- |
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
