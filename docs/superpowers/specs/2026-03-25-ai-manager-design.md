# AI Manager — Design Spec

**Date:** 2026-03-25
**Status:** Approved
**Author:** Claude Code (brainstorming session)

---

## Goal

Replace the current collection of loosely connected `bun run ai:*` scripts with a single interactive CLI entry point (`bun run ai:manage`) that lets users:

1. Remove unused AI agent directories (e.g. `.codewhisperer`, `.tabnine`) and automatically exclude them from future syncs.
2. Manage skills (install/remove) across all agents supported by the `vercel-labs/skills` CLI.
3. Access all documentation, git, and PR tooling from one place.

---

## Approach

**New unified menu script** (`scripts/ai-manage.js`) that acts as a central hub. Existing scripts are kept as internal building blocks — the menu orchestrates them via `execFileSync`. No new runtime dependencies are introduced; `@inquirer/prompts` is already installed.

This approach was chosen over:
- Enhancing `ai-tooling-inventory.js` alone (too narrow — no unified entry point)
- Full consolidation into one monolith (too risky — breaks existing scripts)

---

## Script Reorganisation

### Remove (2 scripts — pure passthroughs replaced by the menu)

| File | Reason |
| :--- | :----- |
| `scripts/skills-agent-prune.js` | 5-line wrapper around `bun x skills remove` |
| `scripts/agents-prune.js` | 5-line wrapper around `bun x skills remove --skill '*'` |

### Rename (consistent `domain-action` convention)

| Current | New | Domain |
| :------ | :-- | :----- |
| `ai-tooling.js` | `ai-check.js` | AI |
| `ai-tooling-inventory.js` | `ai-inventory.js` | AI |
| `sync-ai-configs.js` | `ai-sync.js` | AI |
| `ai-sync-shared.js` | `ai-sync-shared.js` | AI — unchanged (shared module) |
| `validate-docs.js` | `docs-validate.js` | Docs |
| `analyze-validation-issues.js` | `docs-analyze.js` | Docs |
| `fix-links.js` | `docs-fix-links.js` | Docs |
| `resolve-conflicts.js` | `git-conflicts.js` | Git |
| `pr-create-test.js` | `pr-test.js` | PR |

### Unchanged

`pr-create.js`, `pr-guided.js`, `pr-since-last.js`, `pr-mark-merged.js`

### Final scripts directory (14 files, down from 15)

```
scripts/
├── ai-manage.js          ← NEW: central hub
├── ai-check.js           ← was: ai-tooling.js
├── ai-inventory.js       ← was: ai-tooling-inventory.js
├── ai-sync.js            ← was: sync-ai-configs.js
├── ai-sync-shared.js     ← unchanged (shared module)
├── docs-validate.js      ← was: validate-docs.js
├── docs-analyze.js       ← was: analyze-validation-issues.js
├── docs-fix-links.js     ← was: fix-links.js
├── git-conflicts.js      ← was: resolve-conflicts.js
├── pr-create.js
├── pr-test.js            ← was: pr-create-test.js
├── pr-guided.js
├── pr-since-last.js
└── pr-mark-merged.js
```

---

## Menu Structure

```
bun run ai:manage
────────────────────────────────────
  CouchCMS AI Manager
────────────────────────────────────
  > Clean up agent directories
    Manage skills
    Documentation
    Git / PR
    ─────────────
    Exit
```

### Clean up agent directories

Checkbox list of all AI tool directories detected at the repo root. Each item shows the directory name, tool name, and whether it is sync-generated or a local install.

On confirm:
1. Selected directories are deleted from disk (`rmSync`).
2. Each deleted directory is added to `ai-sync.exclude.json` via `addSkipWrites()` (imported from `ai-sync-shared.js`).
3. A summary is printed: `✅ Removed: .tabnine, .codewhisperer`.

This prevents `bun run sync` from recreating the removed directories.

### Manage skills

Wraps the `vercel-labs/skills` CLI:
- Install skill into agent → `bun x skills add`
- Remove skill from agent → `bun x skills remove`
- Show installed skills → reads `skills-lock.json`

### Documentation

| Menu item | Script |
| :-------- | :----- |
| Validate docs | `docs-validate.js` |
| Analyze issues | `docs-analyze.js` |
| Fix links | `docs-fix-links.js` |
| Sync AI configs | `ai-sync.js` |
| Full AI check | `ai-check.js` |

### Git / PR

| Menu item | Script |
| :-------- | :----- |
| Show changes since last PR | `pr-since-last.js` |
| Create PR | `pr-create.js` |
| Create PR (guided mode) | `pr-guided.js` |
| Dry-run PR | `pr-test.js` |
| Mark as merged | `pr-mark-merged.js` |
| Resolve merge conflicts | `git-conflicts.js` |

---

## Data Flow — "Clean up agent directories"

```
User selects dirs in checkbox UI
        ↓
ai-manage.js reads ENTRIES from ai-inventory.js logic
        ↓
Removes selected dirs from disk (rmSync)
        ↓
Calls addSkipWrites() → updates ai-sync.exclude.json
        ↓
Prints summary: "✅ Removed: .tabnine, .codewhisperer"
```

---

## package.json changes

**Add:**
```json
"ai:manage": "node scripts/ai-manage.js"
```

**Update references** (renamed scripts):
```json
"ai":              "node scripts/ai-check.js",
"ai:update":       "node scripts/ai-check.js",
"ai:list":         "node scripts/ai-inventory.js",
"ai:pick":         "node scripts/ai-inventory.js --interactive",
"sync":            "node scripts/ai-sync.js",
"validate":        "node scripts/docs-validate.js",
"validate:analyze":"node scripts/docs-analyze.js",
"fix:links":       "node scripts/docs-fix-links.js",
"pr:test":         "node scripts/pr-test.js",
"conflicts:resolve":"node scripts/git-conflicts.js",
"postinstall":     "node scripts/ai-sync.js"
```

**Remove** (scripts deleted):
`skills:prune`, `skills-prune`, `agents:prune`, `agents-prune`

---

## Out of scope

- Web dashboard or GUI
- Changes to `src/content/docs/` or Astro config
- Modifications to DOCS-STANDARDS.md or the sync output format
- Any changes to `.cursor/rules/`, STYLEGUIDE.md, or CLAUDE.md content

---

## Success criteria

- `bun run ai:manage` launches the interactive menu
- Selecting and confirming agent directories removes them from disk and updates `ai-sync.exclude.json`
- `bun run sync` does not recreate excluded directories
- All existing `bun run ai:*`, `bun run pr:*`, and `bun run validate` commands still work (updated paths in `package.json`)
- No regressions in `bun run ai` (full AI check pipeline)
