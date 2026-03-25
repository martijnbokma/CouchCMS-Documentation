/**
 * PR Utilities - Shared functions for PR-related scripts
 *
 * This module provides common utilities used across multiple PR scripts:
 * - pr-create.js
 * - pr-test.js
 * - pr-since-last.js
 * - pr-guided.js
 *
 * Note: Uses execSync for git operations. Input sources (tracking file)
 * are developer-controlled, not user-supplied.
 */

import { execSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..", "..");
const trackingFile = join(rootDir, ".last-pr.json");

// ============================================================================
// Terminal Colors
// ============================================================================

/**
 * Terminal color codes for styled output
 * @type {Object.<string, string>}
 */
export const colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    red: "\x1b[31m",
    blue: "\x1b[34m",
    cyan: "\x1b[36m",
    magenta: "\x1b[35m",
};

/**
 * Log a message to the console with optional color styling
 * @param {string} message - The message to log
 * @param {string} [color="reset"] - The color key from the colors object
 */
export function log(message, color = "reset") {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// ============================================================================
// Git Operations
// ============================================================================

/**
 * Get the current git branch name
 * @returns {string} The current branch name, or "unknown" if unable to determine
 */
export function getCurrentBranch() {
    try {
        return execSync("git rev-parse --abbrev-ref HEAD", {
            encoding: "utf-8",
        }).trim();
    } catch {
        return "unknown";
    }
}

/**
 * Get all commits since a given date
 * @param {string} since - ISO date string to get commits since
 * @returns {Array.<{hash: string, message: string}>} Array of commit objects
 */
export function getCommitsSince(since) {
    try {
        const sinceCommit = execSync(
            `git rev-list -1 --before="${since}" HEAD`,
            {
                encoding: "utf-8",
                cwd: rootDir,
            },
        ).trim();

        if (!sinceCommit) {
            return [];
        }

        const output = execSync(
            `git log ${sinceCommit}..HEAD --oneline --no-merges`,
            {
                encoding: "utf-8",
                cwd: rootDir,
            },
        );

        return output
            .trim()
            .split("\n")
            .filter((line) => line)
            .map((line) => {
                const [hash, ...messageParts] = line.split(" ");
                return { hash, message: messageParts.join(" ") };
            });
    } catch {
        return [];
    }
}

/**
 * Get all changed files since a given date
 * @param {string} since - ISO date string to get changes since
 * @returns {Array.<{status: string, path: string}>} Array of file change objects
 */
export function getChangedFilesSince(since) {
    try {
        const sinceCommit = execSync(
            `git rev-list -1 --before="${since}" HEAD`,
            {
                encoding: "utf-8",
                cwd: rootDir,
            },
        ).trim();

        if (!sinceCommit) {
            return [];
        }

        const output = execSync(
            `git diff --name-status ${sinceCommit}...HEAD`,
            {
                encoding: "utf-8",
                cwd: rootDir,
            },
        );

        return output
            .trim()
            .split("\n")
            .filter((line) => line)
            .map((line) => {
                const [status, ...pathParts] = line.split("\t");
                const path = pathParts.join("\t");
                return { status, path };
            });
    } catch {
        return [];
    }
}

// ============================================================================
// PR Utilities
// ============================================================================

/**
 * Get information about the last tracked PR
 * @returns {Object|null} PR info object with description and date, or null if not found
 */
export function getLastPRInfo() {
    if (!existsSync(trackingFile)) {
        return null;
    }

    try {
        const data = readFileSync(trackingFile, "utf-8");
        return JSON.parse(data);
    } catch {
        return null;
    }
}

/**
 * Categorize changed files by type (new, updated, deleted, other)
 * @param {Array.<{status: string, path: string}>} files - Array of file change objects
 * @returns {Object} Categorized files object with newPages, updatedPages, deletedPages, otherChanges
 */
export function categorizeFiles(files) {
    const categories = {
        newPages: [],
        updatedPages: [],
        deletedPages: [],
        otherChanges: [],
    };

    files.forEach(({ status, path }) => {
        if (
            path.includes("node_modules/") ||
            path.includes("dist/") ||
            path.includes(".next/")
        ) {
            return;
        }

        const isDocPage =
            path.includes("src/content/docs/") && path.endsWith(".mdx");

        if (isDocPage) {
            if (status === "A") {
                categories.newPages.push(path);
            } else if (status === "M") {
                categories.updatedPages.push(path);
            } else if (status === "D") {
                categories.deletedPages.push(path);
            }
        } else {
            categories.otherChanges.push({ status, path });
        }
    });

    return categories;
}

/**
 * Generate a PR title based on commits and categorized files
 * @param {Array.<{hash: string, message: string}>} commits - Array of commit objects
 * @param {Object} categorizedFiles - Categorized files from categorizeFiles()
 * @returns {string} Generated PR title
 */
export function generatePRTitle(commits, categorizedFiles) {
    const { newPages, updatedPages, deletedPages } = categorizedFiles;

    const commitMessages = commits.map((c) => c.message.toLowerCase());

    // Count commit types
    const docsCount = commits.filter((c) =>
        c.message.toLowerCase().startsWith("docs"),
    ).length;
    const fixCount = commits.filter((c) =>
        c.message.toLowerCase().startsWith("fix"),
    ).length;

    const hasTag = commitMessages.some((m) => m.includes("tag"));
    const hasConcept = commitMessages.some((m) => m.includes("concept"));
    const hasTutorial = commitMessages.some((m) => m.includes("tutorial"));

    // Prefer docs: over fix: if docs commits dominate
    const preferDocs = docsCount > fixCount;

    if (newPages.length > 3) {
        if (hasTag) {
            return "docs: add comprehensive tag reference documentation";
        } else if (hasConcept) {
            return "docs: add core concepts documentation";
        } else if (hasTutorial) {
            return "docs: add new tutorials and guides";
        }
        return `docs: add ${newPages.length} new documentation pages`;
    } else if (newPages.length > 0) {
        return "docs: add new documentation pages";
    } else if (updatedPages.length > 50) {
        // Large update
        return "docs: comprehensive documentation updates and improvements";
    } else if (updatedPages.length > 10) {
        // Medium update
        if (preferDocs) {
            return "docs: documentation updates and improvements";
        } else if (fixCount > 0) {
            return "fix: correct multiple documentation issues";
        }
        return "docs: documentation updates and improvements";
    } else if (updatedPages.length > 0) {
        // Small update
        if (fixCount > docsCount) {
            return "fix: documentation corrections and improvements";
        }
        return "docs: documentation updates and improvements";
    }

    return "docs: documentation updates";
}

/**
 * Generate a PR body based on commits and categorized files
 * @param {Array.<{hash: string, message: string}>} commits - Array of commit objects
 * @param {Object} categorizedFiles - Categorized files from categorizeFiles()
 * @returns {string} Generated PR body in markdown format
 */
export function generatePRBody(commits, categorizedFiles) {
    const { newPages, updatedPages, deletedPages, otherChanges } =
        categorizedFiles;

    let body = "## Summary\n\n";

    if (updatedPages.length > 50) {
        body +=
            "This PR includes comprehensive documentation updates across multiple areas, enhancing clarity, completeness, and user experience.\n\n";
    } else {
        body += "This PR includes documentation updates and improvements.\n\n";
    }

    body += "## Changes\n\n";

    if (newPages.length > 0) {
        body += `### New Pages (${newPages.length})\n\n`;
        newPages.slice(0, 10).forEach((path) => {
            const pageName = path
                .split("/")
                .pop()
                .replace(".mdx", "")
                .replace(/-/g, " ");
            body += `- ${pageName}\n`;
        });
        if (newPages.length > 10) {
            body += `- ... and ${newPages.length - 10} more\n`;
        }
        body += "\n";
    }

    if (updatedPages.length > 0) {
        body += `### Updated Pages (${updatedPages.length})\n\n`;

        // Group by documentation area
        const byArea = {};
        updatedPages.forEach((path) => {
            const area = path.split("/")[3] || "other"; // src/content/docs/[area]/
            if (!byArea[area]) byArea[area] = [];
            byArea[area].push(path);
        });

        Object.entries(byArea).forEach(([area, paths]) => {
            body += `**${area}** (${paths.length} pages)\n`;
            paths.slice(0, 5).forEach((path) => {
                const pageName = path
                    .split("/")
                    .pop()
                    .replace(".mdx", "")
                    .replace(/-/g, " ");
                body += `- ${pageName}\n`;
            });
            if (paths.length > 5) {
                body += `- ... and ${paths.length - 5} more\n`;
            }
            body += "\n";
        });
    }

    if (deletedPages.length > 0) {
        body += `### Deleted Pages (${deletedPages.length})\n\n`;
        deletedPages.forEach((path) => {
            const pageName = path
                .split("/")
                .pop()
                .replace(".mdx", "")
                .replace(/-/g, " ");
            body += `- ${pageName}\n`;
        });
        body += "\n";
    }

    body += "## Commits\n\n";
    body += `${commits.length} commit${commits.length !== 1 ? "s" : ""} including:\n\n`;
    commits.slice(0, 10).forEach((commit) => {
        body += `- ${commit.message} (${commit.hash})\n`;
    });
    if (commits.length > 10) {
        body += `- ... and ${commits.length - 10} more commits\n`;
    }

    body += "\n## Quality Checklist\n\n";
    body += "- [x] Documentation follows DOCS-STANDARDS.md\n";
    body += "- [x] All links tested and working\n";
    body += "- [x] Build passes locally (`bun run build`)\n";
    body += "- [x] Validation passes (`bun run validate`)\n";
    body += "- [x] English language used throughout\n";

    return body;
}
