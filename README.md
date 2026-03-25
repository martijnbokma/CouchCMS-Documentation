# CouchCMS Documentation

This repository contains the official documentation for CouchCMS, a user-friendly and flexible Content Management System.

The documentation is built with [Astro](https://astro.build/) + [Starlight](https://starlight.astro.build/), providing a modern, fast, and user-friendly documentation experience.

## Project Structure

```
.
├── public/                    # Static files (favicons, robots.txt, etc.)
├── src/
│   ├── content/
│   │   └── docs/              # Main documentation (MDX)
│   ├── content.config.ts      # Content collection configuration
│   ├── assets/
│   │   └── img/               # Images used by MDX (organized by type)
│   ├── astro.config.mjs
│   └── ...
├── astro.config.mjs           # Root Astro + Starlight config
├── package.json
└── tsconfig.json
```

- Documentation lives in `src/content/docs/` as `.mdx` files (Markdown + JSX).
- Images and media go in `src/assets/img/` and its subfolders.
- Static assets (not processed by Astro) go in `public/`.

---

## Prerequisites

- **[Bun](https://bun.sh)** (install the latest stable release; the repo uses a `bun.lock` file).

## Getting Started

1. **Fork** this repository.
2. **Clone** your fork:
    ```sh
    git clone https://github.com/YOUR_USERNAME/CouchCMS-Documentation.git
    ```
3. **Install dependencies:**
    ```sh
    bun install
    ```
4. **Start the dev server:**
    ```sh
    bun dev
    ```
5. **Preview:**
   Visit [http://localhost:4321](http://localhost:4321) in your browser.

---

## Working with Documentation

- All docs are written in MDX (`.mdx` files in `src/content/docs/`).
- Raw drafts may start in **`inbox/`**; use **[INBOX-WORKFLOW.md](./INBOX-WORKFLOW.md)** to convert them with minimal edits to the author’s originals.
- **Optional:** Install the [Agent Skill](https://docs.couchcms.com/miscellaneous/agent-skills/) for your coding agent (Cursor, Claude Code, Codex, and others); see **[AI-TOOLKIT.md](./AI-TOOLKIT.md)**. To **remove** skill installs, run **`bun run skills:prune`** (wrapper around **`skills remove`**). To **clear every skill from one agent** (for example before switching editors), run **`bun run agents:prune -- -a cursor -y`**. To **see which AI/editor folders** (for example **`.tabnine`**, **`.giga`**, **`.agents`**) exist in the clone and optionally delete unused ones, run **`bun run ai:list`**. For an **interactive checklist** (arrow keys, space, enter) to remove several folders at once, run **`bun run ai:pick`** or **`bun run ai:list -- --interactive`**. To **stop `bun run sync`** from regenerating a removed folder (for example Tabnine), use **`ai-sync.exclude.json`** (see **`ai-sync.exclude.example.json`** and **[scripts/README.md](scripts/README.md)**). Do **not** use `bunx skills:prune` or `bunx agents:prune` — those resolve npm packages, not these repo scripts.
- **Follow the [CouchCMS Documentation Style Guide](./STYLEGUIDE.md) for all formatting, code, and content rules.**
- Use clear, concise language and proper heading hierarchy.
- Add code examples and screenshots where relevant.
- Always include descriptive alt text for images and a caption if relevant.

---

## Image Usage in MDX

- **Never use classic Markdown image syntax in `.mdx` files.**
- Always use the Astro `<Image />` component.
- Place images in the correct subfolder under `src/assets/img/` (see style guide).
- The import path for images depends on the location of your MDX file relative to the asset. Adjust the path as needed.
- Captions must always be placed directly below the image using a `>` blockquote, as specified in the style guide.
- Example:

    ```js
    import { Image } from "astro:assets";
    import loginImg from "../assets/img/contents/login.png";
    // Adjust the path above depending on your MDX file location
    ```

    ```mdx
    <Image src={loginImg} alt="Login screen" />
    > Login screen of the application
    ```

---

## Making Changes

1. Create a new feature branch:
    ```sh
    git checkout -b my-feature
    ```
2. Make your changes and test locally (`bun dev`).
3. Commit your changes:
    ```sh
    git commit -m "Describe your changes"
    ```
4. Push your branch:
    ```sh
    git push origin my-feature
    ```
5. Open a Pull Request to the `gh-pages` branch.

---

## Useful Commands

| Command                     | Action                                                |
| :-------------------------- | :---------------------------------------------------- |
| `bun install`               | Install dependencies                                  |
| `bun dev`                   | Start local dev server at `localhost:4321`          |
| `bun run ai`                | Unified AI pipeline: sync + Agent Skill check + validate (`scripts/ai-tooling.js`) |
| `bun run validate`          | Run documentation checks (`scripts/validate-docs.js`) |
| `bun run build`             | Build production site to `./dist/`                    |
| `bun run preview`           | Preview build locally before deploying                |
| `bun run astro ...`         | Run Astro CLI commands                                |
| `bun run astro -- --help`   | Get help using the Astro CLI                          |

Pull requests run the same **validate** and **build** steps in [`.github/workflows/ci.yml`](.github/workflows/ci.yml). See [AGENTS.md](./AGENTS.md) if validation reports an SEO title aggregate notice.

---

## 🤖 AI-Assisted Documentation

This project includes a complete AI toolkit for documentation development.

**For AI coding agents**, start with **[AGENTS.md](./AGENTS.md)** (repo map, commands, generated files).

**Quick Start:**
```markdown
@.cursor/prompts/convert-to-markdown.md
Convert this content to documentation format: [your content]
```

**Documentation:**
- **[AI-TOOLKIT.md](./AI-TOOLKIT.md)** - Main entry point and overview
- **[archive/cursor-ai-toolkit-legacy/README.md](./archive/cursor-ai-toolkit-legacy/README.md)** - Archived legacy `.cursor` navigation (QUICKSTART, INDEX, long README)
- **[.cursor/README.md](.cursor/README.md)** - Short hub for rules and prompts only
- **[STYLEGUIDE.md](./STYLEGUIDE.md)** - Complete formatting rules

The AI toolkit provides:
- ✅ Automated formatting rules (applied automatically in Cursor)
- ✅ Content conversion prompts (HTML → Markdown)
- ✅ Quick reference guides for common patterns
- ✅ Quality assurance checklists
- ✅ Consistent documentation standards

See [AI-TOOLKIT.md](./AI-TOOLKIT.md) for complete details.

---

## Resources

- [CouchCMS Website](https://www.couchcms.com)
- [CouchCMS Forum](https://www.couchcms.com/forum/)
- [CouchCMS GitHub](https://github.com/CouchCMS/Couch)
- [Astro Documentation](https://docs.astro.build)
- [Starlight Documentation](https://starlight.astro.build)

---

## Need Help?

### Documentation & AI Toolkit
- 🤖 **[AGENTS.md](./AGENTS.md)** - Instructions for AI agents (start here)
- 🎯 **[SYSTEM-OVERVIEW.md](./SYSTEM-OVERVIEW.md)** - Complete system architecture
- 🤖 **[AI-TOOLKIT.md](./AI-TOOLKIT.md)** - Main AI toolkit guide
- 📖 **[STYLEGUIDE.md](./STYLEGUIDE.md)** - Complete style guide
- 📦 **[archive/cursor-ai-toolkit-legacy/](./archive/cursor-ai-toolkit-legacy/README.md)** - Archived legacy Cursor-only navigation docs
- 🔧 **[Scripts Documentation](./scripts/README.md)** - Sync & validation tools

### CouchCMS Resources
- [CouchCMS Website](https://www.couchcms.com)
- [CouchCMS Forum](https://www.couchcms.com/forum/)
- [Starlight Authoring Guide](https://starlight.astro.build/guides/authoring-content/)

### Get Started
```bash
# All AI tools are configured automatically!
bun install

# Start writing documentation
bun dev

# Full AI tooling check before a PR (optional)
bun run ai
```
