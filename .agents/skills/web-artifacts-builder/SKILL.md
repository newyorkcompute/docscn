---
name: web-artifacts-builder
description: Suite of tools for creating elaborate, multi-component claude.ai HTML artifacts using modern frontend web technologies (React, Tailwind CSS, shadcn/ui). Use for complex artifacts requiring state management, routing, or shadcn/ui components - not for simple single-file HTML/JSX artifacts.
license: Complete terms in LICENSE.txt
---

# Web Artifacts Builder

To build powerful frontend claude.ai artifacts, follow these steps:
1. Initialize the frontend repo using `scripts/init-artifact.sh`
2. Develop your artifact by editing the generated code
3. Bundle all code into a single HTML file using `scripts/bundle-artifact.sh`
4. Display artifact to user
5. (Optional) Test the artifact

**Stack**: React 18 + TypeScript + Vite + Parcel (bundling) + Tailwind CSS + shadcn/ui

## Design & Style Guidelines

VERY IMPORTANT: To avoid what is often referred to as "AI slop", avoid using excessive centered layouts, purple gradients, uniform rounded corners, and Inter font.

## Quick Start

### Step 1: Initialize Project

Run the initialization script to create a new React project:
```bash
bash scripts/init-artifact.sh <project-name>
cd <project-name>
```

This creates a fully configured project with:
- ✅ React + TypeScript (via Vite)
- ✅ Tailwind CSS 3.4.1 with shadcn/ui theming system
- ✅ Path aliases (`@/`) configured
- ✅ 40+ shadcn/ui components pre-installed
- ✅ All Radix UI dependencies included
- ✅ Parcel configured for bundling (via .parcelrc)
- ✅ Node 18+ compatibility (auto-detects and pins Vite version)

### Step 2: Develop Your Artifact

To build the artifact, edit the generated files. See **Common Development Tasks** below for guidance.

### Step 3: Bundle to Single HTML File

To bundle the React app into a single HTML artifact:
```bash
bash scripts/bundle-artifact.sh
```

This creates `bundle.html` - a self-contained artifact with all JavaScript, CSS, and dependencies inlined. This file can be directly shared in Claude conversations as an artifact.

**Requirements**: Your project must have an `index.html` in the root directory.

**What the script does**:
- Installs bundling dependencies (parcel, @parcel/config-default, parcel-resolver-tspaths, html-inline)
- Creates `.parcelrc` config with path alias support
- Builds with Parcel (no source maps)
- Inlines all assets into single HTML using html-inline

### Step 4: Share Artifact with User

Finally, share the bundled HTML file in conversation with the user so they can view it as an artifact.

### Step 5: Testing/Visualizing the Artifact (Optional)

Note: This is a completely optional step. Only perform if necessary or requested.

To test/visualize the artifact, use available tools (including other Skills or built-in tools like Playwright or Puppeteer). In general, avoid testing the artifact upfront as it adds latency between the request and when the finished artifact can be seen. Test later, after presenting the artifact, if requested or if issues arise.

## Reference

- **shadcn/ui components**: https://ui.shadcn.com/docs/components

## docscn integration (this repository)

Use this skill when an artifact needs **React + shadcn/ui complexity**; use plain HTML (see `examples/artifacts/` and [frontend-design](../frontend-design/SKILL.md)) for simpler publish-and-review demos.

### Workflow with docscn

1. From this skill directory, run init/bundle (paths are relative to the skill folder):

   ```bash
   cd .agents/skills/web-artifacts-builder
   bash scripts/init-artifact.sh my-artifact
   cd my-artifact
   # …edit src…
   bash ../scripts/bundle-artifact.sh
   ```

2. Publish the bundled file to docscn:

   ```bash
   docscn publish my-artifact/bundle.html --host http://localhost:3000
   ```

   Or use MCP `publish_artifact` with the `html` field set to the contents of `bundle.html`.

3. Host the artifact for review at the returned URL; use `get_feedback` / `submit_revision` for the revision loop (see `/skills.md` on a running instance).

### Theme and iframe constraints

docscn renders artifacts in a **sandboxed iframe** and syncs light/dark via `html.light`, `html.dark`, and `data-docscn-theme` on the document root. After bundling:

- Ensure the inlined HTML still has a single `<html>` root the host can class.
- Wire Tailwind/shadcn dark mode to those classes (or CSS variables toggled by `.dark` on `html`), not only `prefers-color-scheme`.
- See `/skills.md` **Light and dark mode** and `examples/artifacts/*.html` for the token pattern.

### When not to use this skill

- Smoke tests and CLI onboarding → `examples/artifacts/minimal.html`
- Fast static reports without a build step → inline HTML + [frontend-design](../frontend-design/SKILL.md)
- Co-authoring process for specs/RFCs → [doc-coauthoring](../doc-coauthoring/SKILL.md)

Scripts in this directory are vendored from [Anthropic skills](https://github.com/anthropics/skills/tree/main/skills/web-artifacts-builder); license in [LICENSE.txt](./LICENSE.txt).