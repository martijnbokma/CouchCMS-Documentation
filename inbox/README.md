# Inbox — documentation drafts (not published)

This folder is a **staging area** for **raw** material that is **not** part of the live CouchCMS documentation site.

## What belongs here

- Forum exports, copy-pasted HTML, or messy Markdown that still needs cleanup.
- Notes and partial drafts before they are converted to proper MDX.
- Anything you are **not** ready to place under `src/content/docs/` yet.

## What does *not* belong here

- Finished documentation: add or edit **`src/content/docs/**/*.mdx`** directly instead.
- Generated build output, secrets, or large binaries unrelated to docs.

## Why this folder exists

Starlight only **builds** pages inside [`src/content/docs/`](../src/content/docs/). Keeping drafts in **`inbox/`** (at the repo root) ensures they never appear on the site, never get a URL, and never show up in the sidebar by accident.

## How to turn an inbox file into real documentation

1. Read **[INBOX-WORKFLOW.md](../INBOX-WORKFLOW.md)** — full checklist, Kamran/original-author preservation rules, and PR expectations.
2. Use the converter prompt **[`.cursor/prompts/convert-to-markdown.md`](../.cursor/prompts/convert-to-markdown.md)** with Cursor (or follow the same rules by hand).
3. Run **`bun run validate`** and **`bun run build`** before opening a PR.
4. For repo layout and commands, see **[AGENTS.md](../AGENTS.md)**.

## Rules of thumb (non-negotiable)

- **Minimal edits** — Mechanical conversion (frontmatter, headings, links, images), not rewriting the author’s explanations.
- **Do not change Couch code examples** unless required for correctness or valid MDX.
- **Published content is English-only**; translate faithfully if the source is not English.

## Questions?

- **Style and formatting:** [STYLEGUIDE.md](../STYLEGUIDE.md)  
- **AI tooling and prompts:** [AI-TOOLKIT.md](../AI-TOOLKIT.md)
