#!/usr/bin/env node
/**
 * PR Create - Automatically create GitHub PR
 *
 * Creates a PR based on your tracked changes since last PR
 * Requires: GitHub CLI (gh) to be installed and authenticated
 * Usage: bun run pr:create
 */

import { execSync } from "child_process";
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
    generatePRTitle,
    generatePRBody,
} from "./lib/pr-utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");

function checkGitHubCLI() {
    try {
        execSync("gh --version", { encoding: "utf-8", stdio: "pipe" });
        return true;
    } catch {
        return false;
    }
}

function checkAuthentication() {
    try {
        execSync("gh auth status", { encoding: "utf-8", stdio: "pipe" });
        return true;
    } catch {
        return false;
    }
}

function syncWithUpstream() {
    try {
        log("\n🔄 Syncing with upstream...", "blue");
        execSync("git fetch upstream", { stdio: "inherit" });
        execSync("git merge upstream/docs-v2", { stdio: "inherit" });
        log("✅ Synced with upstream", "green");
        return true;
    } catch (error) {
        log(`⚠️  Sync failed: ${error.message}`, "yellow");
        log(
            "   Please resolve conflicts manually and run this command again",
            "yellow",
        );
        return false;
    }
}

function pushToOrigin(branch) {
    try {
        log("\n📤 Pushing to your fork...", "blue");
        execSync(`git push origin ${branch}`, { stdio: "inherit" });
        log("✅ Pushed to origin", "green");
        return true;
    } catch (error) {
        log(`❌ Push failed: ${error.message}`, "red");
        return false;
    }
}

function createPR(title, body, branch) {
    try {
        log("\n🚀 Creating pull request...", "blue");

        // Create PR using GitHub CLI
        const result = execSync(
            `gh pr create --base docs-v2 --head ${branch} --title "${title}" --body "${body}" --repo CouchCMS/Documentation`,
            { encoding: "utf-8", stdio: "pipe" },
        );

        log("✅ Pull request created!", "green");
        log(`\n${result.trim()}`, "cyan");
        return true;
    } catch (error) {
        log(`❌ PR creation failed: ${error.message}`, "red");
        return false;
    }
}

function main() {
    log("\n🚀 Automated PR Creation\n", "bright");

    // Check prerequisites
    if (!checkGitHubCLI()) {
        log("❌ GitHub CLI (gh) is not installed", "red");
        log("\nInstall it first:", "yellow");
        log("  macOS: brew install gh", "cyan");
        log("  Linux: See https://cli.github.com/", "cyan");
        log("  Windows: See https://cli.github.com/\n", "cyan");
        process.exit(1);
    }

    if (!checkAuthentication()) {
        log("❌ GitHub CLI is not authenticated", "red");
        log("\nAuthenticate first:", "yellow");
        log("  gh auth login\n", "cyan");
        process.exit(1);
    }

    const currentBranch = getCurrentBranch();
    log(`Current branch: ${currentBranch}`, "cyan");

    if (currentBranch !== "docs-v2") {
        log("\n⚠️  Warning: You're not on docs-v2 branch", "yellow");
        log("   This script works best on docs-v2 branch\n", "yellow");
    }

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
        process.exit(1);
    }

    const files = getChangedFilesSince(lastPR.date);
    const categorizedFiles = categorizeFiles(files);

    log(`\n📊 Summary:`, "bright");
    log(`   ${commits.length} commits`, "cyan");
    log(`   ${categorizedFiles.newPages.length} new pages`, "green");
    log(`   ${categorizedFiles.updatedPages.length} updated pages`, "blue");
    log(`   ${categorizedFiles.deletedPages.length} deleted pages`, "red");

    // Generate PR content
    const title = generatePRTitle(commits, categorizedFiles);
    const body = generatePRBody(commits, categorizedFiles);

    log(`\n📝 PR Title:`, "bright");
    log(`   ${title}`, "cyan");

    log(`\n📄 PR Body Preview:`, "bright");
    const bodyPreview = body.split("\n").slice(0, 10).join("\n");
    log(bodyPreview, "cyan");
    log("   ...\n", "cyan");

    // Sync with upstream
    if (!syncWithUpstream()) {
        process.exit(1);
    }

    // Push to origin
    if (!pushToOrigin(currentBranch)) {
        process.exit(1);
    }

    // Create PR
    if (!createPR(title, body, currentBranch)) {
        process.exit(1);
    }

    log("\n🎉 Done! Your PR is ready for review.", "green");
    log("\n💡 Next steps:", "bright");
    log("   1. Review the PR on GitHub", "yellow");
    log("   2. Add any additional context if needed", "yellow");
    log("   3. Wait for review from maintainers\n", "yellow");
}

main();
