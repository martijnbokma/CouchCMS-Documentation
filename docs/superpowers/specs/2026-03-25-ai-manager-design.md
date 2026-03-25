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

### Final scripts directory (14 files — 15 existing, minus 2 removed, plus 1 added)

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
2. **Only** directories that have a corresponding entry in `DIR_TO_SYNC_SKIP_ID` (currently `.tabnine` and `.codewhisperer`) are passed to `addSkipWrites()`. All other directories are silently skipped for the exclude step — `addSkipWrites()` validates against an allow-list and would no-op for unknown ids.
3. A summary is printed: `✅ Removed: .tabnine, .codewhisperer`.

This prevents `bun run sync` from recreating the removed sync-generated directories.

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
For each removed dir, look up id in DIR_TO_SYNC_SKIP_ID
        ↓
Pass matched ids to addSkipWrites() → updates ai-sync.exclude.json
(dirs with no DIR_TO_SYNC_SKIP_ID entry are skipped for this step)
        ↓
Prints summary: "✅ Removed: .tabnine, .codewhisperer"
```

---

## package.json changes

**Add:**
```json
"ai:manage": "node scripts/ai-manage.js"
```

Note: `pr:help` contains an inline `echo` string that describes `pr:test` — update its text to match the renamed script description if needed (cosmetic only, no path reference).

**Internal path references to update inside renamed scripts:**
- `ai-check.js` (was `ai-tooling.js`) calls `scripts/sync-ai-configs.js` and `scripts/validate-docs.js` internally via `execFileSync` → update to `scripts/ai-sync.js` and `scripts/docs-validate.js`.
- `ai-inventory.js` (was `ai-tooling-inventory.js`) prints its own filename in help text → update to `ai-inventory.js` and `bun run ai:list`.

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

## Non-interactive / CI behaviour

`ai-manage.js` must guard against non-TTY contexts (e.g. CI). If `process.stdin.isTTY` is falsy, print a brief usage summary and exit 0 without launching the interactive menu. All other scripts (`ai-check.js`, `docs-validate.js`, etc.) remain usable non-interactively as before.

## Error handling

When `ai-manage.js` calls a child script via `execFileSync` and that script exits non-zero, catch the error, print the child's exit code and stderr, then return to the main menu rather than propagating the failure and exiting. This keeps the session alive for follow-up actions.

## Success criteria

- `bun run ai:manage` launches the interactive menu in a TTY context
- Selecting and confirming sync-generated agent directories removes them from disk and updates `ai-sync.exclude.json`; non-sync directories are removed from disk only
- `bun run sync` does not recreate excluded directories
- All existing `bun run ai:*`, `bun run pr:*`, and `bun run validate` commands still work (updated paths in `package.json`)
- No regressions in `bun run ai` (full AI check pipeline, including internal path references inside `ai-check.js`)
- "Install skill" in the Manage skills menu invokes `bun x skills add`; "Remove skill" invokes `bun x skills remove`
- Running `bun run ai:manage` in a non-TTY context exits 0 with a usage summary
