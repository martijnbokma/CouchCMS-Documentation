---
name: couchcms-documentation
description: Author and maintain official CouchCMS documentation (Astro + Starlight MDX) using project standards, validation, and synced editor configs.
---

# CouchCMS Documentation

Use this skill when editing **this repository**: the official **CouchCMS** documentation site (Astro + Starlight), not the CouchCMS CMS source code.

## Single source of truth

- Standards and synced AI configs originate from **`DOCS-STANDARDS.md`** at the repository root.
- After changing standards, run **`bun run sync`** so `.cursorrules`, `CLAUDE.md`, and related files stay aligned.
- Full author-facing rules: **`STYLEGUIDE.md`**. Agent-oriented map: **`AGENTS.md`**.

## Commands (run from repo root)

1. **`bun install`** — installs dependencies; postinstall runs sync when configured.
2. **`bun run validate`** — frontmatter, headings, links, and quality checks. Treat any line starting with **`❌`** as a failure.
3. **`bun run sync`** — regenerate editor/agent instruction files from `DOCS-STANDARDS.md`.
4. **`bun dev`** — local site at `http://localhost:4321`.
5. **`bun run build`** — production build.

## Editing MDX

- Content lives under **`src/content/docs/`** (English only in published pages).
- Preserve **code blocks** exactly unless the task explicitly asks to change examples.
- Internal Markdown links: use **trailing slashes** on paths.
- Images in **`.mdx`**: use Astro **`<Image />`** from `astro:assets`, not bare `![alt](url)`.
- Unpublished drafts may start in **`inbox/`**; follow **`INBOX-WORKFLOW.md`** before promoting to `src/content/docs/`.

## Multi-editor install

To register this skill in a specific coding agent (Cursor, Claude Code, Codex, etc.), use the open Agent Skills CLI from the repository root or from GitHub:

```bash
bunx skills add . --skill couchcms-documentation -a cursor -y
```

Replace **`-a cursor`** with your editor’s agent id (for example **`-a claude-code`** or **`-a codex`**). Use **`bunx skills add --help`** for options.

## Remove installs you no longer need

Skill installs are local. To use the **official** `skills remove` flow from the repo root (same UX as [vercel-labs/skills](https://github.com/vercel-labs/skills)):

```bash
bun run skills:prune
```

That runs **`bun x skills remove`** with no extra arguments (interactive selection when supported). For a **specific** agent (skill name **last**):

```bash
bunx skills remove -a codex couchcms-documentation -y
```

To **remove every skill** from one agent (not only this repo’s skill), use the repo helper:

```bash
bun run agents:prune -- -a cursor -y
```

To **list** editor/AI/tool directories present in the repo (sync output, skills installs, optional tools like **`.giga`**). Optional **remove** with `--remove`; use **`--sync-exclude`** with **`.tabnine`** / **`.codewhisperer`** so **`bun run sync`** does not recreate them (**`ai-sync.exclude.json`**). See **`bun run ai:list -- --help`**:

```bash
bun run ai:list
bun run ai:pick
```

See the **Agent Skills** page on docs.couchcms.com (Miscellaneous) for **`bunx skills list`**, removing from all agents, and cleaning up.
