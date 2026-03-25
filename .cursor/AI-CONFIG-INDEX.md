# AI Configuration Index
# Auto-generated from DOCS-STANDARDS.md

All AI editor configurations are automatically generated from **DOCS-STANDARDS.md**.

## Optional: skip writes

If `ai-sync.exclude.json` exists at the project root, `bun run sync` skips generating the entries listed in `skipWrites`. Copy `ai-sync.exclude.example.json` to `ai-sync.exclude.json` and edit, or use `bun run ai:list -- --remove .tabnine --yes --sync-exclude` to remove a folder and record the skip in one step.

## Generated Files

### AI Assistants
- ✅ `.cursorrules` - Cursor AI configuration
- ✅ `CLAUDE.md` - Claude AI instructions
- ✅ `.windsurfrules` - Windsurf AI configuration
- ✅ `.github/copilot-instructions.md` - GitHub Copilot
- ✅ `.tabnine/settings.json` - Tabnine configuration
- ✅ `.codewhisperer/settings.json` - Amazon CodeWhisperer

### Editors
- ✅ `.vscode/settings.json` - VS Code settings
- ✅ `.editorconfig` - Universal editor config

## Single Source of Truth

**DOCS-STANDARDS.md** → All configurations above

To update all AI configurations:
```bash
bun run sync
```

**Full pipeline** (sync + verify Agent Skill + validate docs):
```bash
bun run ai
```

## Manual Tools

These files are maintained manually:
- `.cursor/rules/*.mdc` - Auto-applied formatting rules
- `.cursor/prompts/*.md` - AI assistance prompts
- `skills/couchcms-documentation/SKILL.md` - Agent Skill for [vercel-labs/skills](https://github.com/vercel-labs/skills) (checked by `bun run ai`)
- `STYLEGUIDE.md` - Complete style guide

## Last Sync

Generated: 2026-03-25T17:20:24.530Z

---

**Never edit generated files directly. Edit DOCS-STANDARDS.md and run `bun run sync`.**
