# CouchCMS Documentation — `.cursor` directory

This folder holds **auto-applied rules** and **reusable prompts** for editors that use Cursor-style context. It is **not** the main documentation index anymore.

## Use these first

| Document | Purpose |
| :--- | :--- |
| [AI-TOOLKIT.md](../AI-TOOLKIT.md) | Full AI-assisted authoring workflow (Bun, sync, validate) |
| [AGENTS.md](../AGENTS.md) | Repository map and commands for coding agents |
| [skills/couchcms-documentation/SKILL.md](../skills/couchcms-documentation/SKILL.md) | Agent Skill for Cursor, Claude Code, Codex, and others (`bunx skills add …`) |
| [STYLEGUIDE.md](../STYLEGUIDE.md) | Authoritative formatting rules |

## What lives here

- **`rules/`** — `*.mdc` rules applied when editing docs (Markdown / MDX).
- **`prompts/`** — `@`-reference prompts (for example `convert-to-markdown.md`).

## Legacy copies

The previous long README, `QUICKSTART.md`, and `INDEX.md` were **archived** to avoid duplicating AI-TOOLKIT:

[archive/cursor-ai-toolkit-legacy/README.md](../archive/cursor-ai-toolkit-legacy/README.md)

## Configuration index

Generated on `bun run sync`:

[AI-CONFIG-INDEX.md](./AI-CONFIG-INDEX.md)
