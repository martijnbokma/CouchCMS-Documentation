#!/usr/bin/env node
/**
 * PR Create Test - Dry run of PR creation
 *
 * Shows what would be created without actually creating the PR
 * Usage: bun run pr:test
 */

import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import {
    log,
    getCurrentBranch,
    getLastPRInfo,
    getCommitsSince,
    getChangedFilesSince,
    categorizeFiles,
    generatePRTitle,
    generatePRBody,
} from "./lib/pr-utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");

function main() {
    log("\n🧪 PR Creation Test (Dry Run)\n", "bright");
    log(
        "This will show what would be created WITHOUT actually creating the PR\n",
        "yellow",
    );

    const currentBranch = getCurrentBranch();
    log(`Current branch: ${currentBranch}`, "cyan");

    // Get last PR info
    const lastPR = getLastPRInfo();
    if (!lastPR) {
        log("❌ No previous PR tracked", "red");
        log("\nMark your last PR first:", "yellow");
        log('  bun run pr:mark-as-merged "Last PR description"\n', "cyan");
        process.exit(1);
    }

    log(`\n📍 Last PR: ${lastPR.description}`, "cyan");
    log(
        `   Date: ${new Date(lastPR.date).toLocaleDateString("en-US")}`,
        "cyan",
    );

    // Get changes
    const commits = getCommitsSince(lastPR.date);
    if (commits.length === 0) {
        log("\n⚠️  No new commits since last PR", "yellow");
        log("Nothing to create PR for.\n", "yellow");
        process.exit(1);
    }

    const files = getChangedFilesSince(lastPR.date);
    const categorizedFiles = categorizeFiles(files);

    log(`\n📊 Summary:`, "bright");
    log(`   ${commits.length} commits`, "cyan");
    log(`   ${categorizedFiles.newPages.length} new pages`, "green");
    log(`   ${categorizedFiles.updatedPages.length} updated pages`, "blue");
    log(`   ${categorizedFiles.deletedPages.length} deleted pages`, "red");
    log(`   ${categorizedFiles.otherChanges.length} other changes`, "yellow");

    // Generate PR content
    const title = generatePRTitle(commits, categorizedFiles);
    const body = generatePRBody(commits, categorizedFiles);

    log(`\n═══════════════════════════════════════════════════`, "bright");
    log(`📝 GENERATED PR TITLE:`, "bright");
    log(`═══════════════════════════════════════════════════\n`, "bright");
    log(title, "green");

    log(`\n═══════════════════════════════════════════════════`, "bright");
    log(`📄 GENERATED PR BODY:`, "bright");
    log(`═══════════════════════════════════════════════════\n`, "bright");
    log(body, "cyan");

    log(`\n═══════════════════════════════════════════════════`, "bright");
    log(`🔍 AFFECTED FILES (First 20):`, "bright");
    log(`═══════════════════════════════════════════════════\n`, "bright");

    if (categorizedFiles.newPages.length > 0) {
        log(`✨ New Pages:`, "green");
        categorizedFiles.newPages.slice(0, 20).forEach((path) => {
            log(`   ${path}`, "cyan");
        });
        if (categorizedFiles.newPages.length > 20) {
            log(
                `   ... and ${categorizedFiles.newPages.length - 20} more`,
                "yellow",
            );
        }
        log("");
    }

    if (categorizedFiles.updatedPages.length > 0) {
        log(`📝 Updated Pages (showing first 20):`, "blue");
        categorizedFiles.updatedPages.slice(0, 20).forEach((path) => {
            log(`   ${path}`, "cyan");
        });
        if (categorizedFiles.updatedPages.length > 20) {
            log(
                `   ... and ${categorizedFiles.updatedPages.length - 20} more`,
                "yellow",
            );
        }
        log("");
    }

    log(`\n═══════════════════════════════════════════════════`, "bright");
    log(`🎯 WHAT WOULD HAPPEN:`, "bright");
    log(`═══════════════════════════════════════════════════\n`, "bright");

    log(`1. Sync with upstream:`, "yellow");
    log(`   git fetch upstream`, "cyan");
    log(`   git merge upstream/docs-v2`, "cyan");
    log("");

    log(`2. Push to your fork:`, "yellow");
    log(`   git push origin ${currentBranch}`, "cyan");
    log("");

    log(`3. Create PR via GitHub CLI:`, "yellow");
    log(`   gh pr create \\`, "cyan");
    log(`     --base docs-v2 \\`, "cyan");
    log(`     --head ${currentBranch} \\`, "cyan");
    log(`     --title "${title}" \\`, "cyan");
    log(`     --body "..." \\`, "cyan");
    log(`     --repo CouchCMS/Documentation`, "cyan");
    log("");

    log(`4. Result:`, "yellow");
    log(`   PR would be created at:`, "cyan");
    log(`   https://github.com/CouchCMS/Documentation/pull/NEW`, "green");
    log("");

    // Save to file for review
    const outputFile = join(rootDir, "PR-TEST-OUTPUT.md");
    const fullOutput = `# PR Creation Test - Dry Run

**Date:** ${new Date().toLocaleString("en-US")}
**Branch:** ${currentBranch}
**Last PR:** ${lastPR.description} (${new Date(lastPR.date).toLocaleDateString("en-US")})

## Statistics

- Commits: ${commits.length}
- New pages: ${categorizedFiles.newPages.length}
- Updated pages: ${categorizedFiles.updatedPages.length}
- Deleted pages: ${categorizedFiles.deletedPages.length}
- Other changes: ${categorizedFiles.otherChanges.length}

## Generated PR Title

\`\`\`
${title}
\`\`\`

## Generated PR Body

\`\`\`markdown
${body}
\`\`\`

## All Affected Files

### New Pages (${categorizedFiles.newPages.length})

${categorizedFiles.newPages.map((p) => `- ${p}`).join("\n")}

### Updated Pages (${categorizedFiles.updatedPages.length})

${categorizedFiles.updatedPages.map((p) => `- ${p}`).join("\n")}

${categorizedFiles.deletedPages.length > 0 ? `### Deleted Pages (${categorizedFiles.deletedPages.length})\n\n${categorizedFiles.deletedPages.map((p) => `- ${p}`).join("\n")}` : ""}

## All Commits

${commits.map((c) => `- ${c.hash} - ${c.message}`).join("\n")}

## What Would Happen

1. **Sync:** \`git fetch upstream && git merge upstream/docs-v2\`
2. **Push:** \`git push origin ${currentBranch}\`
3. **Create PR:** Via GitHub CLI to CouchCMS/Documentation
4. **Result:** New PR at https://github.com/CouchCMS/Documentation/pull/NEW

---

**This was a test run. No PR was actually created.**

To create the actual PR:
\`\`\`bash
bun run pr:create
\`\`\`
`;

    writeFileSync(outputFile, fullOutput, "utf-8");

    log(`\n═══════════════════════════════════════════════════`, "bright");
    log(`📄 FULL REPORT SAVED:`, "bright");
    log(`═══════════════════════════════════════════════════\n`, "bright");
    log(`File: PR-TEST-OUTPUT.md`, "green");
    log(`Review this file for complete details\n`, "yellow");

    log(`✅ Test complete! No PR was created.`, "green");
    log(`\n💡 Next steps:`, "bright");
    log(`   1. Review PR-TEST-OUTPUT.md`, "yellow");
    log(`   2. Check if title and body look good`, "yellow");
    log(`   3. If satisfied, run: bun run pr:create`, "cyan");
    log(`   4. Or create PR manually on GitHub\n`, "cyan");
}

main();
