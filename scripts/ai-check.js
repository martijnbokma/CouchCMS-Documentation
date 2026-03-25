#!/usr/bin/env node
/**
 * Unified AI tooling: sync generated editor configs, verify Agent Skill, validate docs.
 * Single entry point — use: bun run ai
 */

import { execFileSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");

function runNode(scriptRelative, label) {
    const scriptPath = join(rootDir, scriptRelative);
    console.log(`\n${label}\n`);
    execFileSync(process.execPath, [scriptPath], {
        cwd: rootDir,
        stdio: "inherit",
        env: process.env,
    });
}

function assertAgentSkill() {
    const skillPath = join(rootDir, "skills", "couchcms-documentation", "SKILL.md");
    if (!existsSync(skillPath)) {
        console.error("\n❌ Missing skills/couchcms-documentation/SKILL.md\n");
        process.exit(1);
    }
    const raw = readFileSync(skillPath, "utf8");
    const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!m) {
        console.error("\n❌ SKILL.md must start with YAML frontmatter (--- ... ---)\n");
        process.exit(1);
    }
    const fm = m[1];
    if (!/\bname:\s*\S+/.test(fm) || !/\bdescription:\s*\S+/.test(fm)) {
        console.error(
            "\n❌ SKILL.md frontmatter must include `name:` and `description:` (see agentskills.io)\n",
        );
        process.exit(1);
    }
    console.log("✅ Agent Skill OK: skills/couchcms-documentation/SKILL.md\n");
}

console.log("🧰 CouchCMS Documentation — unified AI tooling\n");
console.log("   (DOCS-STANDARDS → generated configs + SKILL check + validate)\n");

runNode("scripts/sync-ai-configs.js", "━━ Step 1/3 · Sync generated editor configs ━━");
assertAgentSkill();
console.log("━━ Step 2/3 · Agent Skill (manual SKILL.md) verified ━━\n");
runNode("scripts/validate-docs.js", "━━ Step 3/3 · Validate documentation ━━");

console.log("\n✨ Done.\n");
console.log("   Optional — install the skill for your coding agent:");
console.log("   bunx skills add . --skill couchcms-documentation -a <agent> -y\n");
console.log("   CLI: https://github.com/vercel-labs/skills\n");
