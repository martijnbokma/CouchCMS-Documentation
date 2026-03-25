# AI Manager Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace loosely connected `bun run ai:*` scripts with a single interactive CLI entry point (`bun run ai:manage`) and reorganise the scripts directory using a consistent `domain-action` naming convention.

**Architecture:** One new file (`scripts/ai-manage.js`) acts as an orchestration hub using `@inquirer/prompts`. Eight scripts are renamed in-place (git mv), two pure-passthrough scripts are deleted, and `package.json` is updated to match. Internal path references and one help text string inside renamed scripts are patched in the same step.

**Tech Stack:** Node.js/Bun, `@inquirer/prompts` (already installed), `vercel-labs/skills` CLI (`bun x skills …`), `node:child_process` execFileSync.

---

## File Map

| Action | File | Responsibility |
| :----- | :--- | :------------- |
| Create | `scripts/ai-manage.js` | Interactive main menu hub |
| Rename | `scripts/ai-tooling.js` → `ai-check.js` | Sync + SKILL check + validate pipeline |
| Rename | `scripts/ai-tooling-inventory.js` → `ai-inventory.js` | List/remove AI tooling dirs (exports `ENTRIES`) |
| Rename | `scripts/sync-ai-configs.js` → `ai-sync.js` | Generate editor config files from DOCS-STANDARDS.md |
| Rename | `scripts/validate-docs.js` → `docs-validate.js` | Frontmatter/heading/link validation |
| Rename | `scripts/analyze-validation-issues.js` → `docs-analyze.js` | Grouped validation issue report |
| Rename | `scripts/fix-links.js` → `docs-fix-links.js` | Auto-fix trailing slashes in internal links |
| Rename | `scripts/resolve-conflicts.js` → `git-conflicts.js` | Merge conflict helper |
| Rename | `scripts/pr-create-test.js` → `pr-test.js` | Dry-run PR creation |
| Delete | `scripts/skills-agent-prune.js` | Replaced by Manage skills menu |
| Delete | `scripts/agents-prune.js` | Replaced by Manage skills menu |
| Modify | `package.json` | Update all script paths + add `ai:manage` |
| Modify | `scripts/ai-check.js` (post-rename) | Patch two internal `execFileSync` paths |
| Modify | `scripts/ai-inventory.js` (post-rename) | Export `ENTRIES`; patch two help text strings |

---

## Task 1 — Rename and delete scripts

**Files:**
- Rename: `scripts/ai-tooling.js` → `scripts/ai-check.js`
- Rename: `scripts/ai-tooling-inventory.js` → `scripts/ai-inventory.js`
- Rename: `scripts/sync-ai-configs.js` → `scripts/ai-sync.js`
- Rename: `scripts/validate-docs.js` → `scripts/docs-validate.js`
- Rename: `scripts/analyze-validation-issues.js` → `scripts/docs-analyze.js`
- Rename: `scripts/fix-links.js` → `scripts/docs-fix-links.js`
- Rename: `scripts/resolve-conflicts.js` → `scripts/git-conflicts.js`
- Rename: `scripts/pr-create-test.js` → `scripts/pr-test.js`
- Delete: `scripts/skills-agent-prune.js`
- Delete: `scripts/agents-prune.js`

- [ ] **Step 1: Rename all eight scripts with git mv**

```bash
cd /path/to/repo
git mv scripts/ai-tooling.js          scripts/ai-check.js
git mv scripts/ai-tooling-inventory.js scripts/ai-inventory.js
git mv scripts/sync-ai-configs.js      scripts/ai-sync.js
git mv scripts/validate-docs.js        scripts/docs-validate.js
git mv scripts/analyze-validation-issues.js scripts/docs-analyze.js
git mv scripts/fix-links.js            scripts/docs-fix-links.js
git mv scripts/resolve-conflicts.js    scripts/git-conflicts.js
git mv scripts/pr-create-test.js       scripts/pr-test.js
```

- [ ] **Step 2: Delete the two passthrough scripts**

```bash
git rm scripts/skills-agent-prune.js
git rm scripts/agents-prune.js
```

- [ ] **Step 3: Verify file list**

```bash
ls scripts/*.js
```

Expected output (14 files, alphabetically):
```
scripts/ai-check.js
scripts/ai-inventory.js
scripts/ai-manage.js      ← not yet (created in Task 4)
scripts/ai-sync.js
scripts/ai-sync-shared.js
scripts/docs-analyze.js
scripts/docs-fix-links.js
scripts/docs-validate.js
scripts/git-conflicts.js
scripts/pr-create.js
scripts/pr-guided.js
scripts/pr-mark-merged.js
scripts/pr-since-last.js
scripts/pr-test.js
```

- [ ] **Step 4: Commit renames and deletions**

```bash
git commit -m "refactor: rename scripts to domain-action convention, remove passthroughs"
```

---

## Task 2 — Update package.json

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Open `package.json` and replace the entire `"scripts"` block**

Replace the existing `"scripts"` section with:

```json
"scripts": {
    "dev": "astro dev",
    "start": "astro dev",
    "build": "astro build && cp .cursor/rules/markdown.mdc STYLEGUIDE.md",
    "preview": "astro preview",
    "astro": "astro",
    "clean": "rm -rf dist node_modules/.cache",
    "clean:all": "rm -rf dist node_modules",
    "lint:md": "markdownlint-cli2 \"src/content/docs/**/*.mdx\" \".cursor/rules/**/*.mdc\"",
    "lint:md:fix": "markdownlint-cli2 --fix \"src/content/docs/**/*.mdx\" \".cursor/rules/**/*.mdc\"",
    "sync": "node scripts/ai-sync.js",
    "ai": "node scripts/ai-check.js",
    "ai:manage": "node scripts/ai-manage.js",
    "ai:list": "node scripts/ai-inventory.js",
    "ai:pick": "node scripts/ai-inventory.js --interactive",
    "ai:update": "node scripts/ai-check.js",
    "validate": "node scripts/docs-validate.js",
    "validate:analyze": "node scripts/docs-analyze.js",
    "fix:links": "node scripts/docs-fix-links.js",
    "pr:since-last": "node scripts/pr-since-last.js",
    "pr:mark-as-merged": "node scripts/pr-mark-merged.js",
    "pr:create": "node scripts/pr-create.js",
    "pr:test": "node scripts/pr-test.js",
    "pr:guided": "node scripts/pr-guided.js",
    "conflicts:resolve": "node scripts/git-conflicts.js",
    "pr:help": "echo '\n📊 PR Tracker:\n  pr:since-last      - Show changes since last upstream PR\n  pr:mark-as-merged  - Mark current upstream state\n  pr:test            - Dry-run PR creation\n  pr:create          - Actually create GitHub PR\n  pr:guided          - Step-by-step guided PR creation\n  conflicts:resolve  - Help resolve merge conflicts\n  pr:help            - Show this help\n'",
    "postinstall": "node scripts/ai-sync.js"
},
```

Note: `skills:prune`, `skills-prune`, `agents:prune`, `agents-prune` are removed (scripts deleted). `pr:test` description updated from "Test PR creation" to "Dry-run PR creation".

- [ ] **Step 2: Verify JSON is valid**

```bash
node -e "JSON.parse(require('fs').readFileSync('package.json','utf8')); console.log('valid')"
```

Expected: `valid`

- [ ] **Step 3: Smoke-test a renamed command**

```bash
bun run validate
```

Expected: validation output (or `❌` lines if doc issues exist — that is fine). Must not error with "Cannot find module".

- [ ] **Step 4: Commit**

```bash
git add package.json
git commit -m "chore: update package.json for renamed scripts, add ai:manage entry"
```

---

## Task 3 — Patch internal references in renamed scripts

Two renamed scripts have internal paths that now point to non-existent filenames.

**Files:**
- Modify: `scripts/ai-check.js` (two `runNode` calls referencing old script names)
- Modify: `scripts/ai-inventory.js` (one help text string; add `export` to `ENTRIES`)

### Part A — ai-check.js

- [ ] **Step 1: Locate the two stale `runNode` calls**

```bash
grep -n "runNode" scripts/ai-check.js
```

Expected output (line numbers may vary):
```
51:runNode("scripts/sync-ai-configs.js", "━━ Step 1/3 · Sync generated editor configs ━━");
54:runNode("scripts/validate-docs.js", "━━ Step 3/3 · Validate documentation ━━");
```

- [ ] **Step 2: Update both paths in `scripts/ai-check.js`**

Replace:
```js
runNode("scripts/sync-ai-configs.js", "━━ Step 1/3 · Sync generated editor configs ━━");
```
With:
```js
runNode("scripts/ai-sync.js", "━━ Step 1/3 · Sync generated editor configs ━━");
```

Replace:
```js
runNode("scripts/validate-docs.js", "━━ Step 3/3 · Validate documentation ━━");
```
With:
```js
runNode("scripts/docs-validate.js", "━━ Step 3/3 · Validate documentation ━━");
```

- [ ] **Step 3: Verify the pipeline runs end-to-end**

```bash
bun run ai
```

Expected: three steps complete, `✨ Done.` printed, exit code 0.

### Part B — ai-inventory.js

- [ ] **Step 4: Open `scripts/ai-inventory.js` and export ENTRIES**

Find:

```js
const ENTRIES = [
```

Change to:

```js
export const ENTRIES = [
```

- [ ] **Step 5: Patch the two stale self-references in `printText()`**

Find (around line 291):

```js
"Add a pattern to scripts/ai-tooling-inventory.js if this should be documented.",
```

Replace with:

```js
"Add a pattern to scripts/ai-inventory.js if this should be documented.",
```

Find (around line 296-299):

```js
console.log(
    "\nInteractive (arrow keys, space to toggle, enter): bun run ai:list -- --interactive\n",
);
console.log(
    "\nRemove optional dirs: bun run ai:list -- --remove .giga --dry-run  then  --yes\n",
);
```

This text is already correct (`ai:list`). No change needed here.

- [ ] **Step 6: Patch the `printHelp()` usage header**

Find (around lines 307-309):

```js
Usage:
  bun run ai:list
  bun run ai:list -- --interactive
```

This is already correct. Verify no remaining references to `ai-tooling-inventory.js`:

```bash
grep -n "ai-tooling-inventory" scripts/ai-inventory.js
```

Expected: no output.

- [ ] **Step 7: Verify ai-inventory works**

```bash
bun run ai:list
```

Expected: inventory table printed, exit 0.

- [ ] **Step 8: Commit**

```bash
git add scripts/ai-check.js scripts/ai-inventory.js
git commit -m "fix: patch internal paths and stale refs in renamed scripts, export ENTRIES"
```

---

## Task 4 — Create scripts/ai-manage.js

**Files:**
- Create: `scripts/ai-manage.js`

- [ ] **Step 1: Create `scripts/ai-manage.js` with this content**

```js
#!/usr/bin/env node
/**
 * Unified AI Manager — interactive CLI hub for CouchCMS Documentation.
 *
 * Usage: bun run ai:manage
 *
 * Menus:
 *   Clean up agent directories — remove unused AI tool dirs + auto-exclude from sync
 *   Manage skills             — install / remove via vercel-labs/skills CLI
 *   Documentation             — validate, analyze, fix links, sync, full check
 *   Git / PR                  — PR creation, conflict resolution
 */

import { select, checkbox, confirm, Separator } from "@inquirer/prompts";
import { execFileSync } from "node:child_process";
import { rmSync, existsSync, readFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { addSkipWrites, DIR_TO_SYNC_SKIP_ID } from "./ai-sync-shared.js";
import { ENTRIES } from "./ai-inventory.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const rootDir = resolve(join(__dirname, ".."));

// ── TTY guard ────────────────────────────────────────────────────────────────

if (!process.stdin.isTTY) {
    console.log("CouchCMS AI Manager — run in a terminal: bun run ai:manage\n");
    console.log("Non-interactive commands:");
    console.log("  bun run ai           Full AI check (sync + validate)");
    console.log("  bun run ai:list      List AI tooling inventory");
    console.log("  bun run ai:pick      Interactive inventory (ai-inventory)");
    console.log("  bun run validate     Validate documentation");
    console.log("  bun run sync         Sync AI config files");
    process.exit(0);
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Run a script by filename (relative to scripts/). Returns to menu on failure. */
function runScript(filename, extraArgs = []) {
    const scriptPath = join(rootDir, "scripts", filename);
    try {
        execFileSync(process.execPath, [scriptPath, ...extraArgs], {
            cwd: rootDir,
            stdio: "inherit",
        });
    } catch (err) {
        console.error(`\n❌ Exited with code ${err.status ?? 1}\n`);
    }
}

/** Run a bun command (e.g. bun x skills add). Returns to menu on failure. */
function runBun(args) {
    try {
        execFileSync("bun", args, { cwd: rootDir, stdio: "inherit" });
    } catch (err) {
        console.error(`\n❌ Exited with code ${err.status ?? 1}\n`);
    }
}

function separator() {
    console.log("─".repeat(44));
}

// ── Submenu: Clean up agent directories ──────────────────────────────────────

async function menuCleanup() {
    const deletable = ENTRIES.filter(
        (e) => e.allowDelete && existsSync(join(rootDir, e.path)),
    );

    if (deletable.length === 0) {
        console.log("\nNo removable directories found on disk.\n");
        return;
    }

    const selected = await checkbox({
        message: "Select directories to remove  [space = toggle, enter = confirm]",
        choices: deletable.map((e) => ({
            name: `${e.path.padEnd(22)} ${e.label}  [${e.kind}]`,
            value: e.path,
        })),
    });

    if (selected.length === 0) {
        console.log("\nNothing selected.\n");
        return;
    }

    const ok = await confirm({
        message: `Remove ${selected.length} director${selected.length === 1 ? "y" : "ies"}? This cannot be undone.`,
        default: false,
    });

    if (!ok) {
        console.log("\nCancelled.\n");
        return;
    }

    for (const p of selected) {
        rmSync(join(rootDir, p), { recursive: true, force: true });
    }

    const syncIds = selected.map((p) => DIR_TO_SYNC_SKIP_ID[p]).filter(Boolean);
    if (syncIds.length > 0) {
        addSkipWrites(rootDir, syncIds);
        console.log(`\n✅ Removed: ${selected.join(", ")}`);
        console.log(`   Added to ai-sync.exclude.json: ${syncIds.join(", ")}\n`);
    } else {
        console.log(`\n✅ Removed: ${selected.join(", ")}\n`);
    }
}

// ── Submenu: Manage skills ────────────────────────────────────────────────────

async function menuSkills() {
    const action = await select({
        message: "Manage skills",
        choices: [
            { name: "Install skill into agent", value: "add" },
            { name: "Remove skill from agent", value: "remove" },
            { name: "Show installed skills", value: "list" },
            { name: "Back", value: "back" },
        ],
    });

    if (action === "back") return;

    if (action === "add") {
        runBun(["x", "skills", "add", "."]);
    } else if (action === "remove") {
        runBun(["x", "skills", "remove"]);
    } else if (action === "list") {
        const lockPath = join(rootDir, "skills-lock.json");
        if (!existsSync(lockPath)) {
            console.log("\nNo skills-lock.json found — no skills installed yet.\n");
            return;
        }
        const lock = JSON.parse(readFileSync(lockPath, "utf8"));
        const skills = Object.keys(lock.skills ?? {});
        if (skills.length === 0) {
            console.log("\nNo skills installed.\n");
        } else {
            console.log("\nInstalled skills:");
            for (const s of skills) {
                const meta = lock.skills[s];
                console.log(`  • ${s}  (${meta.sourceType}: ${meta.source})`);
            }
            console.log();
        }
    }
}

// ── Submenu: Documentation ────────────────────────────────────────────────────

async function menuDocs() {
    const action = await select({
        message: "Documentation",
        choices: [
            { name: "Validate docs", value: "validate" },
            { name: "Analyze issues", value: "analyze" },
            { name: "Fix links", value: "fix-links" },
            { name: "Sync AI configs", value: "sync" },
            { name: "Full AI check  (sync + validate)", value: "check" },
            { name: "Back", value: "back" },
        ],
    });

    if (action === "back") return;

    const map = {
        validate: "docs-validate.js",
        analyze: "docs-analyze.js",
        "fix-links": "docs-fix-links.js",
        sync: "ai-sync.js",
        check: "ai-check.js",
    };
    runScript(map[action]);
}

// ── Submenu: Git / PR ─────────────────────────────────────────────────────────

async function menuGit() {
    const action = await select({
        message: "Git / PR",
        choices: [
            { name: "Show changes since last PR", value: "since-last" },
            { name: "Create PR", value: "create" },
            { name: "Create PR  (guided mode)", value: "guided" },
            { name: "Dry-run PR", value: "test" },
            { name: "Mark as merged", value: "mark-merged" },
            { name: "Resolve merge conflicts", value: "conflicts" },
            { name: "Back", value: "back" },
        ],
    });

    if (action === "back") return;

    const map = {
        "since-last": "pr-since-last.js",
        create: "pr-create.js",
        guided: "pr-guided.js",
        test: "pr-test.js",
        "mark-merged": "pr-mark-merged.js",
        conflicts: "git-conflicts.js",
    };
    runScript(map[action]);
}

// ── Main menu loop ────────────────────────────────────────────────────────────

async function main() {
    while (true) {
        separator();
        console.log("  CouchCMS AI Manager");
        separator();

        const choice = await select({
            message: "What would you like to do?",
            choices: [
                { name: "Clean up agent directories", value: "cleanup" },
                { name: "Manage skills", value: "skills" },
                { name: "Documentation", value: "docs" },
                { name: "Git / PR", value: "git" },
                new Separator(),
                { name: "Exit", value: "exit" },
            ],
        });

        if (choice === "exit") break;
        if (choice === "cleanup") await menuCleanup();
        if (choice === "skills") await menuSkills();
        if (choice === "docs") await menuDocs();
        if (choice === "git") await menuGit();
    }
}

main().catch((err) => {
    // ExitPromptError is thrown when user hits Ctrl-C in @inquirer/prompts
    if (err.name !== "ExitPromptError") {
        console.error(err);
        process.exit(1);
    }
});
```

- [ ] **Step 2: Verify the file is syntactically valid**

```bash
node --check scripts/ai-manage.js
```

Expected: no output (no syntax errors).

- [ ] **Step 3: Verify TTY guard works in non-interactive mode**

```bash
node scripts/ai-manage.js < /dev/null
```

Expected: usage summary printed, process exits 0.

```bash
echo $?
```

Expected: `0`

- [ ] **Step 4: Commit**

```bash
git add scripts/ai-manage.js
git commit -m "feat: add ai-manage.js — unified interactive CLI hub"
```

---

## Task 5 — End-to-end verification

No test framework exists for these scripts; verification is manual smoke-testing of every affected command.

- [ ] **Step 1: Verify all renamed commands work**

Run each of the following and confirm exit code 0 and no "Cannot find module" errors:

```bash
bun run ai           # Full AI check pipeline
bun run ai:list      # Inventory table
bun run sync         # Sync AI configs
bun run validate     # Doc validation
```

- [ ] **Step 2: Verify the interactive menu launches**

```bash
bun run ai:manage
```

Expected: separator line + "CouchCMS AI Manager" header + menu with 4 options + Exit.

- [ ] **Step 3: Negative test — unregistered directories must not appear in the cleanup menu**

```bash
mkdir .test-cleanup-dir
bun run ai:manage
```

Navigate to "Clean up agent directories". **Verify `.test-cleanup-dir` does NOT appear** — this is intentional. The menu only shows directories that are registered in the `ENTRIES` list inside `ai-inventory.js`. The absence of the unregistered directory confirms the guard is working correctly.

Exit the menu (Ctrl-C or "Exit"), then clean up:

```bash
rmdir .test-cleanup-dir
```

- [ ] **Step 4: Verify "Show installed skills" in Manage skills**

Navigate to "Manage skills" → "Show installed skills". Expected: lists `couchcms-documentation` and `find-skills` from `skills-lock.json`.

- [ ] **Step 5: Verify pr:help echo text is updated**

```bash
bun run pr:help
```

Expected: shows "pr:test - Dry-run PR creation" (not the old "Test PR creation").

- [ ] **Step 6: Verify postinstall still works**

```bash
bun install
```

Expected: runs `ai-sync.js` as postinstall, no "Cannot find module" error.

- [ ] **Step 7: Verify removed commands are gone**

```bash
bun run skills:prune
```

Expected: `Missing script: skills:prune` (or equivalent "not found" message from Bun). This confirms the deleted passthroughs are cleaned up.

- [ ] **Step 8: Final commit if any fixes were applied during verification**

```bash
git add -p
git commit -m "fix: verification corrections to ai-manage and renamed scripts"
```

---

## Completion Checklist

- [ ] 14 scripts in `scripts/` (verify with `ls scripts/*.js | wc -l`)
- [ ] `bun run ai:manage` launches interactive menu
- [ ] `bun run ai` exits 0 (no regressions)
- [ ] `bun run validate` exits 0
- [ ] `bun run ai:list` prints inventory table
- [ ] `bun run sync` regenerates config files
- [ ] `bun run skills:prune` returns "Missing script" error
- [ ] No remaining references to old script names in `package.json` or the renamed scripts themselves
