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
| `scripts/sync-ai-configs.js` | Generates editor/agent rule files from `DOCS-STANDARDS.md` |
| `scripts/validate-docs.js` | Frontmatter, headings, and quality checks |
| `.cursor/rules/` | Cursor rules (`markdown.mdc`, `content-structure.mdc`, `component-architecture.mdc`) |
| `.cursor/prompts/` | Reusable prompts (conversion, quick reference) |
| `STYLEGUIDE.md` | Full author-facing style guide (also updated on `pnpm build` from rules) |
| `.inbox/` | **Unpublished** raw drafts only; promotion pipeline in [INBOX-WORKFLOW.md](./INBOX-WORKFLOW.md) |

## Generated or synced files (do not hand-edit without process)

Running `pnpm run sync` (or `node scripts/sync-ai-configs.js`) overwrites:

- `.cursorrules`
- `CLAUDE.md`
- `.windsurfrules`
- `.github/copilot-instructions.md`

**If standards change**, edit `DOCS-STANDARDS.md` first, then run sync. Do not duplicate long rule blocks in random markdown files.

## Commands agents should use

```bash
pnpm install          # installs deps; runs postinstall sync
pnpm dev              # local site — http://localhost:4321
pnpm run validate     # documentation validation (exit 0 unless ❌; may show SEO aggregate notice)
pnpm run sync         # regenerate AI config files from DOCS-STANDARDS.md
pnpm run lint:md      # markdownlint on docs + rules
pnpm run build        # production build
```

Prefer **`pnpm`** as documented in [README.md](./README.md). Scripts use **Node** for sync and validate (no Bun required).

## Editing documentation (MDX)

1. Follow [STYLEGUIDE.md](./STYLEGUIDE.md) and auto-applied `.cursor/rules/markdown.mdc`.
2. Preserve **code blocks** exactly unless the task explicitly asks to change examples (project policy).
3. Internal links: **trailing slashes** on paths in Markdown.
4. Images in `.mdx`: Astro `<Image />` from `astro:assets`, not bare `![alt](url)` (see README).
5. Starlight sidebar is largely defined in `astro.config.mjs` (some sections use `autogenerate`).

### Validation and SEO titles

`pnpm run validate` checks frontmatter, headings, links, and language. It may print **one aggregate notice** when many pages have `title` values shorter than 50 characters (STYLEGUIDE SEO target). That does **not** fail the run (exit code **0**); only lines starting with `❌` do.

## What not to do

- Do not add non-English body copy to `src/content/docs/`.
- Do not “fix” or reformat tutorial/CMS code for style unless requested; diffs must stay reviewable.
- Do not commit Dropbox-style conflict copies (e.g. `*conflicted copy*` files); resolve and remove locally.

## Related entry points

- [AI-TOOLKIT.md](./AI-TOOLKIT.md) — prompts, rules index, workflows.
- [SYSTEM-OVERVIEW.md](./SYSTEM-OVERVIEW.md) — diagram-oriented architecture.
- [scripts/README.md](./scripts/README.md) — sync and validation scripts.
