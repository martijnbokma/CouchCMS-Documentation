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
