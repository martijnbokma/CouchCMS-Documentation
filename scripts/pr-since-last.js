#!/usr/bin/env node
/**
 * PR Since Last - Track changes since last PR
 *
 * Shows a high-level summary of changes since the last merged PR
 * Usage: bun run pr:since-last
 */

import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import {
    colors,
    log,
    getCurrentBranch,
    getLastPRInfo,
    getCommitsSince,
    getChangedFilesSince,
    categorizeFiles,
} from "./lib/pr-utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");
const trackingFile = join(rootDir, ".last-pr.json");

function saveLastPRInfo(info) {
    writeFileSync(trackingFile, JSON.stringify(info, null, 2), "utf-8");
}

function categorizeCommits(commits) {
    const categories = {
        docs: [],
        fix: [],
        feat: [],
        chore: [],
        other: [],
    };

    commits.forEach((commit) => {
        const msg = commit.message.toLowerCase();
        if (msg.startsWith("docs")) {
            categories.docs.push(commit);
        } else if (msg.startsWith("fix")) {
            categories.fix.push(commit);
        } else if (msg.startsWith("feat")) {
            categories.feat.push(commit);
        } else if (msg.startsWith("chore")) {
            categories.chore.push(commit);
        } else {
            categories.other.push(commit);
        }
    });

    return categories;
}

function formatDate(date) {
    return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function getDaysSince(date) {
    const now = new Date();
    const then = new Date(date);
    const diffTime = Math.abs(now - then);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

function main() {
    log("\n📊 Changes Since Last PR\n", "bright");

    const currentBranch = getCurrentBranch();
    log(`Current branch: ${currentBranch}\n`, "cyan");

    // Get last PR info
    const lastPR = getLastPRInfo();

    if (!lastPR) {
        log("⚠️  No previous PR tracked.", "yellow");
        log("\nTo start tracking, mark current state as last PR:", "yellow");
        log("  bun run pr:mark-as-merged\n", "cyan");
        return;
    }

    log("📍 Last PR:", "bright");
    log(`  Date: ${formatDate(lastPR.date)}`, "cyan");
    log(`  Branch: ${lastPR.branch}`, "cyan");
    if (lastPR.description) {
        log(`  Description: ${lastPR.description}`, "cyan");
    }

    const daysSince = getDaysSince(lastPR.date);
    log(
        `  Time elapsed: ${daysSince} day${daysSince !== 1 ? "s" : ""}`,
        "magenta",
    );
    log("");

    // Get commits since last PR
    const commits = getCommitsSince(lastPR.date);

    if (commits.length === 0) {
        log("✅ No changes since last PR\n", "green");
        return;
    }

    log(
        `📝 ${commits.length} commit${commits.length !== 1 ? "s" : ""} since last PR\n`,
        "bright",
    );

    // Get changed files
    const files = getChangedFilesSince(lastPR.date);
    const categorizedFiles = categorizeFiles(files);

    // Show high-level summary
    log("📊 Summary:", "bright");
    log(`  ✨ New pages: ${categorizedFiles.newPages.length}`, "green");
    log(`  📝 Updated pages: ${categorizedFiles.updatedPages.length}`, "blue");
    log(`  🗑️  Deleted pages: ${categorizedFiles.deletedPages.length}`, "red");
    log(
        `  🔧 Other changes: ${categorizedFiles.otherChanges.length}`,
        "yellow",
    );
    log("");

    // Show commit breakdown
    const categorizedCommits = categorizeCommits(commits);
    log("💬 Commit breakdown:", "bright");
    if (categorizedCommits.docs.length > 0) {
        log(`  📚 Documentation: ${categorizedCommits.docs.length}`, "cyan");
    }
    if (categorizedCommits.feat.length > 0) {
        log(`  ✨ Features: ${categorizedCommits.feat.length}`, "green");
    }
    if (categorizedCommits.fix.length > 0) {
        log(`  🐛 Fixes: ${categorizedCommits.fix.length}`, "red");
    }
    if (categorizedCommits.chore.length > 0) {
        log(`  🔧 Chores: ${categorizedCommits.chore.length}`, "yellow");
    }
    if (categorizedCommits.other.length > 0) {
        log(`  📦 Other: ${categorizedCommits.other.length}`, "magenta");
    }
    log("");

    // Show recent commits (last 5)
    log("🔄 Recent commits:", "bright");
    commits.slice(0, 5).forEach((commit) => {
        log(`  ${commit.hash} - ${commit.message}`, "cyan");
    });
    if (commits.length > 5) {
        log(`  ... and ${commits.length - 5} more`, "yellow");
    }
    log("");

    // Show affected areas (top level directories)
    const affectedAreas = new Set();
    [...categorizedFiles.newPages, ...categorizedFiles.updatedPages].forEach(
        (path) => {
            const match = path.match(/src\/content\/docs\/([^\/]+)/);
            if (match) {
                affectedAreas.add(match[1]);
            }
        },
    );

    if (affectedAreas.size > 0) {
        log("📂 Affected documentation areas:", "bright");
        Array.from(affectedAreas)
            .sort()
            .forEach((area) => {
                log(`  • ${area}`, "cyan");
            });
        log("");
    }

    // Suggestions
    log("💡 Next steps:", "bright");
    if (commits.length >= 10) {
        log("  📋 Time to create a PR!", "yellow");
        log("     Option 1 (Automated): bun run pr:create", "cyan");
        log("     Option 2 (Manual): Create PR on GitHub UI", "cyan");
    } else if (commits.length >= 5) {
        log("  📋 Consider creating a new PR soon:", "yellow");
        log("     bun run pr:create", "cyan");
    } else {
        log("  ⏳ Continue working. Create PR when ready.", "yellow");
    }
    log("");

    log("📌 To mark a new PR as merged:", "bright");
    log('  bun run pr:mark-as-merged "Description of PR"\n', "cyan");
}

main();
