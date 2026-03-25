#!/usr/bin/env node
/**
 * CouchCMS Documentation AI Configuration Sync
 *
 * Generates all AI editor configurations from DOCS-STANDARDS.md
 * Single source of truth for Cursor, Claude, Windsurf, VS Code, and more
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

import { loadSkipWrites, SYNC_EXCLUDE_FILENAME } from "./ai-sync-shared.js";
import {
    createBaseRules,
    getEditorConfig,
    createAiToolkitIndex,
    getVscodeSettings,
    createTabnineConfig,
    createCodewhispererConfig,
} from "./lib/ai-templates.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");

// Read the single source of truth
const STANDARDS_FILE = join(rootDir, "DOCS-STANDARDS.md");
const STYLEGUIDE_FILE = join(rootDir, "STYLEGUIDE.md");

console.log("🔄 Syncing AI configurations from DOCS-STANDARDS.md...\n");

const skip = loadSkipWrites(rootDir);
let writeCount = 0;
if (skip.size > 0) {
    console.log(`📋 ${SYNC_EXCLUDE_FILENAME}: skipWrites = ${[...skip].sort().join(", ")}\n`);
}

// Helper to ensure directory exists
function ensureDir(filePath) {
    const dir = dirname(filePath);
    mkdirSync(dir, { recursive: true });
}

// Helper to write file with success message
function writeConfig(path, content, description) {
    try {
        ensureDir(path);
        writeFileSync(path, content, "utf8");
        console.log(`✅ Generated ${description}`);
        return true;
    } catch (error) {
        console.log(`⚠️  Skipped ${description} (${error.code || "error"})`);
        return false;
    }
}

/**
 * @param {string} id
 * @param {string} path
 * @param {string} content
 * @param {string} description
 */
function writeConfigSynced(id, path, content, description) {
    if (skip.has(id)) {
        console.log(`⏭️  Skipped ${description} (${SYNC_EXCLUDE_FILENAME})`);
        return false;
    }
    const ok = writeConfig(path, content, description);
    if (ok) {
        writeCount++;
    }
    return ok;
}

// Read standards
let standards;
try {
    standards = readFileSync(STANDARDS_FILE, "utf8");
} catch (error) {
    console.error("❌ Error: DOCS-STANDARDS.md not found!");
    console.error("   This file is required as the single source of truth.");
    process.exit(1);
}

// Read styleguide reference (kept for potential future use)
readFileSync(STYLEGUIDE_FILE, "utf8");

// Generate base rules content
const now = new Date();
const dateStr = now.toISOString().split("T")[0];
const baseRules = createBaseRules(dateStr);

// 1. Generate .cursorrules (Cursor AI)
writeConfigSynced(
    "cursorrules",
    join(rootDir, ".cursorrules"),
    baseRules,
    ".cursorrules (Cursor AI)",
);

// 2. Generate CLAUDE.md (Claude AI)
writeConfigSynced("claude", join(rootDir, "CLAUDE.md"), baseRules, "CLAUDE.md (Claude AI)");

// 3. Generate .windsurfrules (Windsurf AI)
writeConfigSynced(
    "windsurf",
    join(rootDir, ".windsurfrules"),
    baseRules,
    ".windsurfrules (Windsurf AI)",
);

// 4. Generate GitHub Copilot instructions
writeConfigSynced(
    "copilot",
    join(rootDir, ".github", "copilot-instructions.md"),
    baseRules,
    ".github/copilot-instructions.md (GitHub Copilot)",
);

// 5. Generate VS Code settings
const vscodeSettings = getVscodeSettings();

writeConfigSynced(
    "vscode",
    join(rootDir, ".vscode", "settings.json"),
    JSON.stringify(vscodeSettings, null, 4),
    ".vscode/settings.json (VS Code)",
);

// 6. Generate Tabnine configuration
const tabnineConfig = createTabnineConfig(baseRules);

writeConfigSynced(
    "tabnine",
    join(rootDir, ".tabnine", "settings.json"),
    JSON.stringify(tabnineConfig, null, 4),
    ".tabnine/settings.json (Tabnine)",
);

// 7. Generate CodeWhisperer configuration
const codewhispererConfig = createCodewhispererConfig(baseRules);

writeConfigSynced(
    "codewhisperer",
    join(rootDir, ".codewhisperer", "settings.json"),
    JSON.stringify(codewhispererConfig, null, 4),
    ".codewhisperer/settings.json (Amazon CodeWhisperer)",
);

// 8. Generate .editorconfig
const editorconfig = getEditorConfig();

writeConfigSynced(
    "editorconfig",
    join(rootDir, ".editorconfig"),
    editorconfig,
    ".editorconfig (Universal Editor Config)",
);

// 9. Generate AI toolkit index
const aiToolkitIndex = createAiToolkitIndex(now.toISOString());

writeConfigSynced(
    "cursorIndex",
    join(rootDir, ".cursor", "AI-CONFIG-INDEX.md"),
    aiToolkitIndex,
    ".cursor/AI-CONFIG-INDEX.md (Configuration Index)",
);

console.log("\n✨ Sync finished.\n");
console.log("📝 Generated from: DOCS-STANDARDS.md");
console.log(`📁 Wrote ${writeCount} configuration file(s)`);
if (skip.size > 0) {
    console.log(`⏭️  Skipped ${skip.size} target(s) listed in ${SYNC_EXCLUDE_FILENAME}`);
}
console.log("🔄 Next steps:");
console.log("   - Review generated files");
console.log("   - Commit changes to version control");
console.log("   - After editing DOCS-STANDARDS.md: `bun run sync` (or full check: `bun run ai`)\n");
