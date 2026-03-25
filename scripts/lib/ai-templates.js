/**
 * AI Configuration Templates
 *
 * Template strings and config objects extracted from ai-sync.js
 * Factory functions for templates that require date parameters
 */

/**
 * Creates the base rules content with embedded date
 * @param {string} date - ISO date string (YYYY-MM-DD format)
 * @returns {string} Base rules markdown content
 */
export function createBaseRules(date) {
    return `# CouchCMS Documentation Standards
# Auto-generated from DOCS-STANDARDS.md

**Critical: Always follow these documentation standards.**

## Project Context

- **Project**: CouchCMS Documentation
- **Type**: Technical Documentation
- **Platform**: Astro + Starlight
- **Content Format**: MDX (Markdown + JSX)
- **Standards**: English-only, 4-space indentation, WCAG 2.1 AA

## Core Principles

1. **Single Source of Truth**: STYLEGUIDE.md is authoritative
2. **Consistency First**: All documentation follows identical patterns
3. **Accessibility**: WCAG 2.1 AA compliance mandatory
4. **English Only**: All content, code, and comments in English
5. **Semantic Structure**: Proper heading hierarchy and HTML5

## Essential Formatting Rules

### Frontmatter (Required)
Every MDX file must start with:
\`\`\`yaml
---
title: [50-60 chars, include keyword]
description: "[150-160 chars]"
keywords: [keyword1, keyword2, keyword3]
category: [category]
author: [Author Name]
lastUpdated: YYYY-MM-DD
sidebar:
  order: [number]
---
\`\`\`

### Text Formatting

**Product Names:**
- Regular: "Couch"
- Formal: "CouchCMS"
- Never bold (except headers)

**Technical Terms (backticks):**
- Files: \`config.php\`, \`.htaccess\`
- Variables: \`my_variable\`
- Code: \`echo $value\`
- Booleans: \`true\`, \`false\`

**UI Elements (bold):**
- Pages: **About Us**
- Buttons: **Save Changes**
- Use Title Case

**Tag References:**
\`\`\`markdown
[**editable**](../../tags-reference/core/editable/)
\`\`\`

**Documentation Links:**
\`\`\`markdown
[**Working with Templates**](../../concepts/templates/)
\`\`\`

### Code Blocks

Always include descriptive titles:
\`\`\`markdown
\`\`\`php title="config.php"
<?php
// Code here
?>
\`\`\`
\`\`\`

### Components

**Steps:**
\`\`\`markdown
import { Steps } from "@astrojs/starlight/components";

<Steps>

1. First step
2. Second step

</Steps>
\`\`\`

**Card:**
\`\`\`markdown
<Card icon="info" title="Title">

Content

</Card>
\`\`\`

**FileTree (NO backticks!):**
\`\`\`markdown
<FileTree>
- src/
  - content/
</FileTree>
\`\`\`

### Links

- Internal links: ALWAYS use trailing slashes
- Meaningful text (no "click here")
- Relative paths for internal content

### Admonitions

\`\`\`markdown
:::note[Context]
Information
:::

:::tip[Best Practice]
Recommendation
:::

:::caution[Important]
Limitation
:::

:::danger[Warning]
Critical warning
:::
\`\`\`

## Quality Checklist

Before finalizing documentation:
- ✅ Valid frontmatter with SEO metadata
- ✅ Proper heading hierarchy (no skipping)
- ✅ Technical terms in backticks
- ✅ UI elements in bold
- ✅ Links with trailing slashes
- ✅ Code blocks with titles
- ✅ Complete examples
- ✅ Image alt text
- ✅ WCAG 2.1 AA compliance

## AI Tools Available

### Automated (Auto-Applied)
- \`.cursor/rules/markdown.mdc\` - Formatting rules
- \`.cursor/rules/content-structure.mdc\` - Content organization
- \`.cursor/rules/component-architecture.mdc\` - Components

### Manual (Explicit Use)
- \`@.cursor/prompts/convert-to-markdown.md\` - Convert content
- \`@.cursor/prompts/markdown-quick-reference.md\` - Quick syntax

### Reference Documentation
- **AI-TOOLKIT.md** - Complete toolkit guide
- **AGENTS.md** - Repository map and commands
- **STYLEGUIDE.md** - Full formatting rules
- **skills/couchcms-documentation/SKILL.md** - Agent Skill (multi-editor); see docs site *Agent Skills*
- **Unified check** - Run \`bun run ai\` (sync + verify SKILL + validate) before commits

## Common Patterns

### Introducing CMS Tags
\`\`\`markdown
The [**editable**](../../tags-reference/core/editable/) tag creates regions.

## Basic Usage

\`\`\`php title="example.php"
<cms:editable name='content' type='text' />
\`\`\`

:::tip[Best Practice]
Use descriptive names.
:::
\`\`\`

### Cross-References
\`\`\`markdown
See [**Working with Templates**](../../concepts/templates/).
\`\`\`

### Version Info
\`\`\`markdown
:::version[v2.0+]
Requires CouchCMS v2.0 or higher.
:::
\`\`\`

## Error Prevention

**Never:**
- ❌ Use non-English language
- ❌ Skip frontmatter
- ❌ Incorrect heading hierarchy
- ❌ Omit code block titles
- ❌ Forget trailing slashes

**Always:**
- ✅ Complete frontmatter
- ✅ Proper heading hierarchy
- ✅ Descriptive code titles
- ✅ Trailing slashes in links
- ✅ Correct tag formatting

---

**For complete rules, see STYLEGUIDE.md**
**For conversion help, use @.cursor/prompts/convert-to-markdown.md**
**Generated from DOCS-STANDARDS.md - Last updated: ${date}**
`;
}

/**
 * Returns the editorconfig content
 * @returns {string} Editorconfig content
 */
export function getEditorConfig() {
    return `# CouchCMS Documentation Editor Config
# Auto-generated from DOCS-STANDARDS.md

root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true
indent_style = space
indent_size = 4

[*.{md,mdx}]
max_line_length = 80
trim_trailing_whitespace = true

[*.{json,yml,yaml}]
indent_size = 2

[*.{ts,js,mjs}]
indent_size = 2

[package.json]
indent_size = 2
`;
}

/**
 * Creates the AI toolkit index content with embedded date
 * @param {string} isoDate - ISO date string (full ISO format)
 * @returns {string} AI toolkit index markdown content
 */
export function createAiToolkitIndex(isoDate) {
    return `# AI Configuration Index
# Auto-generated from DOCS-STANDARDS.md

All AI editor configurations are automatically generated from **DOCS-STANDARDS.md**.

## Optional: skip writes

If \`ai-sync.exclude.json\` exists at the project root, \`bun run sync\` skips generating the entries listed in \`skipWrites\`. Copy \`ai-sync.exclude.example.json\` to \`ai-sync.exclude.json\` and edit, or use \`bun run ai:list -- --remove .tabnine --yes --sync-exclude\` to remove a folder and record the skip in one step.

## Generated Files

### AI Assistants
- ✅ \`.cursorrules\` - Cursor AI configuration
- ✅ \`CLAUDE.md\` - Claude AI instructions
- ✅ \`.windsurfrules\` - Windsurf AI configuration
- ✅ \`.github/copilot-instructions.md\` - GitHub Copilot
- ✅ \`.tabnine/settings.json\` - Tabnine configuration
- ✅ \`.codewhisperer/settings.json\` - Amazon CodeWhisperer

### Editors
- ✅ \`.vscode/settings.json\` - VS Code settings
- ✅ \`.editorconfig\` - Universal editor config

## Single Source of Truth

**DOCS-STANDARDS.md** → All configurations above

To update all AI configurations:
\`\`\`bash
bun run sync
\`\`\`

**Full pipeline** (sync + verify Agent Skill + validate docs):
\`\`\`bash
bun run ai
\`\`\`

## Manual Tools

These files are maintained manually:
- \`.cursor/rules/*.mdc\` - Auto-applied formatting rules
- \`.cursor/prompts/*.md\` - AI assistance prompts
- \`skills/couchcms-documentation/SKILL.md\` - Agent Skill for [vercel-labs/skills](https://github.com/vercel-labs/skills) (checked by \`bun run ai\`)
- \`STYLEGUIDE.md\` - Complete style guide

## Last Sync

Generated: ${isoDate}

---

**Never edit generated files directly. Edit DOCS-STANDARDS.md and run \`bun run sync\`.**
`;
}

/**
 * Returns the VS Code settings object
 * @returns {object} VS Code settings configuration
 */
export function getVscodeSettings() {
    return {
        "files.associations": {
            "*.mdx": "mdx",
            "*.mdc": "markdown",
        },
        "editor.formatOnSave": true,
        "editor.defaultFormatter": "esbenp.prettier-vscode",
        "[markdown]": {
            "editor.defaultFormatter": "esbenp.prettier-vscode",
            "editor.wordWrap": "on",
            "editor.quickSuggestions": {
                comments: "on",
                strings: "on",
                other: "on",
            },
        },
        "[mdx]": {
            "editor.defaultFormatter": "esbenp.prettier-vscode",
            "editor.wordWrap": "on",
        },
        "markdown.validate.enabled": true,
        "markdown.updateLinksOnFileMove.enabled": "always",
        "cSpell.enabled": true,
        "cSpell.language": "en",
        "cSpell.words": [
            "CouchCMS",
            "editable",
            "Starlight",
            "Astro",
            "mdx",
            "frontmatter",
        ],
    };
}

/**
 * Creates the Tabnine configuration object
 * @param {string} baseRules - The base rules content string
 * @returns {object} Tabnine configuration object
 */
export function createTabnineConfig(baseRules) {
    return {
        team_learning: false,
        local_mode: true,
        instructions: baseRules,
    };
}

/**
 * Creates the CodeWhisperer configuration object
 * @param {string} baseRules - The base rules content string
 * @returns {object} CodeWhisperer configuration object
 */
export function createCodewhispererConfig(baseRules) {
    return {
        customizations: [
            {
                name: "CouchCMS Documentation Standards",
                description: "Documentation writing standards for CouchCMS",
                instructions: baseRules,
            },
        ],
    };
}
