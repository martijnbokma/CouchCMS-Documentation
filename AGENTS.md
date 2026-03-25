# Agent instructions — CouchCMS Documentation

Use this file as the **primary orientation** for AI coding agents working in this repository. Human-oriented guides: [README.md](./README.md), [AI-TOOLKIT.md](./AI-TOOLKIT.md).

## What this repo is

- **Product**: Official **CouchCMS** documentation only (not the CMS source code).
- **Stack**: [Astro](https://astro.build/) + [Starlight](https://starlight.astro.build/).
- **Content**: MDX under `src/content/docs/`. English-only for user-facing docs.

## Repository map

| Path | Role |
| :--- | :--- |
| `src/content/docs/` | All documentation pages (`.mdx`) |
| `src/content.config.ts` | Content collection schema |
| `astro.config.mjs` | Starlight theme, sidebar, plugins |
| `DOCS-STANDARDS.md` | **Single source of truth** for standards text used by sync |
| `scripts/sync-ai-configs.js` | Generates editor/agent rule files from `DOCS-STANDARDS.md` (respects optional `ai-sync.exclude.json`) |
| `scripts/ai-sync-shared.js` | Loads `skipWrites` for sync and inventory (`ai-sync.exclude.json`) |
| `ai-sync.exclude.example.json` | Example: copy to `ai-sync.exclude.json` to skip regenerating specific sync outputs |
| `scripts/ai-tooling.js` | Unified pipeline: sync + Agent Skill check + validate (`bun run ai`) |
| `scripts/ai-tooling-inventory.js` | List AI/editor dirs present in the repo (`.tabnine`, `.giga`, skills installs, …); **`bun run ai:list`** · **`bun run ai:pick`** (`--interactive`, checkbox UI) |
| `scripts/skills-agent-prune.js` | Passthrough to **`bun x skills remove`** ([skills CLI](https://github.com/vercel-labs/skills)); `bun run skills:prune` |
| `scripts/agents-prune.js` | Passthrough to **`bun x skills remove --skill '*'`** (strip all skills from agent(s)); `bun run agents:prune` |
| `scripts/validate-docs.js` | Frontmatter, headings, and quality checks |
| `.cursor/rules/` | Cursor rules (`markdown.mdc`, `content-structure.mdc`, `component-architecture.mdc`) |
| `.cursor/prompts/` | Reusable prompts (conversion, quick reference) |
| `STYLEGUIDE.md` | Full author-facing style guide (also updated on `bun run build` from rules) |
| `inbox/` | **Unpublished** raw drafts only; promotion pipeline in [INBOX-WORKFLOW.md](./INBOX-WORKFLOW.md) |
| `skills/couchcms-documentation/` | Optional **[Agent Skill](https://agentskills.io/)** and [Agent Skills](https://docs.couchcms.com/miscellaneous/agent-skills/) install guide. Remove per agent: `bunx skills remove -a <agent> couchcms-documentation -y`. **`.agents/skills/`** is gitignored (local installs). |
| `archive/cursor-ai-toolkit-legacy/` | **Archived** legacy `.cursor` navigation (QUICKSTART, INDEX, long README); superseded by [AI-TOOLKIT.md](./AI-TOOLKIT.md) — see [archive README](./archive/cursor-ai-toolkit-legacy/README.md) |

## Generated or synced files (do not hand-edit without process)

Running `bun run sync` (or `node scripts/sync-ai-configs.js`) overwrites:

- `.cursorrules`
- `CLAUDE.md`
- `.windsurfrules`
- `.github/copilot-instructions.md`

**If standards change**, edit `DOCS-STANDARDS.md` first, then run sync. Do not duplicate long rule blocks in random markdown files.

## Commands agents should use

```bash
bun install          # installs deps; runs postinstall sync
bun dev              # local site — http://localhost:4321
bun run ai           # unified: sync + verify Agent Skill + validate docs (preferred before PRs)
bun run validate     # documentation validation only (exit 0 unless ❌; may show SEO aggregate notice)
bun run sync         # regenerate AI config files from DOCS-STANDARDS.md only
bun run lint:md      # markdownlint on docs + rules
bun run build        # production build
```

`bun run ai` runs [`scripts/ai-tooling.js`](scripts/ai-tooling.js): sync from **DOCS-STANDARDS.md**, checks **skills/couchcms-documentation/SKILL.md**, then **validate**. Same as **`bun run ai:update`**.

Prefer **[Bun](https://bun.sh)** as documented in [README.md](./README.md). Use **`bun install`**, **`bun dev`**, and **`bun run`** for scripts in `package.json` (including `sync` and `validate`, which execute the Node-based files under `scripts/`).

## Editing documentation (MDX)

1. Follow [STYLEGUIDE.md](./STYLEGUIDE.md) and auto-applied `.cursor/rules/markdown.mdc`.
2. Preserve **code blocks** exactly unless the task explicitly asks to change examples (project policy).
3. Internal links: **trailing slashes** on paths in Markdown.
4. Images in `.mdx`: Astro `<Image />` from `astro:assets`, not bare `![alt](url)` (see README).
5. Starlight sidebar is largely defined in `astro.config.mjs` (some sections use `autogenerate`).

### Validation and SEO titles

`bun run validate` checks frontmatter, headings, links, and language. It may print **one aggregate notice** when many pages have `title` values shorter than 50 characters (STYLEGUIDE SEO target). That does **not** fail the run (exit code **0**); only lines starting with `❌` do.

## What not to do

- Do not add non-English body copy to `src/content/docs/`.
- Do not “fix” or reformat tutorial/CMS code for style unless requested; diffs must stay reviewable.
- Do not commit Dropbox-style conflict copies (e.g. `*conflicted copy*` files); resolve and remove locally.

## Learned User Preferences

- When promoting drafts from **`inbox/`** to `src/content/docs/`, preserve original author explanations and code blocks; apply only mechanical changes required for valid MDX and STYLEGUIDE (see [INBOX-WORKFLOW.md](./INBOX-WORKFLOW.md)).

## Learned Workspace Facts

- CI (`.github/workflows/ci.yml`) runs **`bun install --frozen-lockfile`**, then **`bun run validate`** and **`bun run build`**.

## Related entry points

- [AI-TOOLKIT.md](./AI-TOOLKIT.md) — prompts, rules index, workflows.
- [SYSTEM-OVERVIEW.md](./SYSTEM-OVERVIEW.md) — diagram-oriented architecture.
- [scripts/README.md](./scripts/README.md) — sync, **`bun run ai`**, and validation scripts.
