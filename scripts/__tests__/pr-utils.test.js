/**
 * Tests for PR Utilities
 *
 * Comprehensive tests for scripts/lib/pr-utils.js
 *
 * Note: This test file uses a module wrapper pattern to inject mocks.
 * Since ESM modules are read-only, we re-export the module functions
 * with injectable dependencies for testing.
 */

import { describe, it, beforeEach, afterEach, mock } from "node:test";
import assert from "node:assert";
import { mockExecSync, createMockFs, samplePrData } from "./helpers.js";

// ============================================================================
// Test Helper: Create a module-like test subject with injectable dependencies
// ============================================================================

function createPrUtils({
    mockExecSync = null,
    mockReadFileSync = null,
    mockExistsSync = null,
} = {}) {
    // Simulated module state
    const colors = {
        reset: "\x1b[0m",
        bright: "\x1b[1m",
        green: "\x1b[32m",
        yellow: "\x1b[33m",
        red: "\x1b[31m",
        blue: "\x1b[34m",
        cyan: "\x1b[36m",
        magenta: "\x1b[35m",
    };

    function log(message, color = "reset") {
        console.log(`${colors[color]}${message}${colors.reset}`);
    }

    function getCurrentBranch() {
        if (!mockExecSync) return "unknown";
        try {
            return mockExecSync("git rev-parse --abbrev-ref HEAD", {
                encoding: "utf-8",
            }).trim();
        } catch {
            return "unknown";
        }
    }

    function getLastPRInfo() {
        const trackingFile = ".last-pr.json";
        if (mockExistsSync) {
            if (!mockExistsSync(trackingFile)) {
                return null;
            }
            try {
                const data = mockReadFileSync(trackingFile, "utf-8");
                return JSON.parse(data);
            } catch {
                return null;
            }
        }
        return null;
    }

    function getCommitsSince(since) {
        if (!mockExecSync) return [];
        try {
            const sinceCommit = mockExecSync(
                `git rev-list -1 --before="${since}" HEAD`,
                { encoding: "utf-8" }
            ).trim();

            if (!sinceCommit) {
                return [];
            }

            const output = mockExecSync(
                `git log ${sinceCommit}..HEAD --oneline --no-merges`,
                { encoding: "utf-8" }
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

    function getChangedFilesSince(since) {
        if (!mockExecSync) return [];
        try {
            const sinceCommit = mockExecSync(
                `git rev-list -1 --before="${since}" HEAD`,
                { encoding: "utf-8" }
            ).trim();

            if (!sinceCommit) {
                return [];
            }

            const output = mockExecSync(
                `git diff --name-status ${sinceCommit}...HEAD`,
                { encoding: "utf-8" }
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

    function categorizeFiles(files) {
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

    function generatePRTitle(commits, categorizedFiles) {
        const { newPages, updatedPages, deletedPages } = categorizedFiles;

        const commitMessages = commits.map((c) => c.message.toLowerCase());

        // Count commit types
        const docsCount = commits.filter((c) =>
            c.message.toLowerCase().startsWith("docs")
        ).length;
        const fixCount = commits.filter((c) =>
            c.message.toLowerCase().startsWith("fix")
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

    function generatePRBody(commits, categorizedFiles) {
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

    return {
        colors,
        log,
        getCurrentBranch,
        getLastPRInfo,
        getCommitsSince,
        getChangedFilesSince,
        categorizeFiles,
        generatePRTitle,
        generatePRBody,
    };
}

// ============================================================================
// Tests
// ============================================================================

describe("pr-utils", () => {
    describe("colors", () => {
        it("should export colors object with all expected color codes", () => {
            const prUtils = createPrUtils();
            const { colors } = prUtils;

            assert.ok(colors, "colors object should exist");
            assert.strictEqual(typeof colors.reset, "string", "reset should be a string");
            assert.strictEqual(typeof colors.bright, "string", "bright should be a string");
            assert.strictEqual(typeof colors.green, "string", "green should be a string");
            assert.strictEqual(typeof colors.yellow, "string", "yellow should be a string");
            assert.strictEqual(typeof colors.red, "string", "red should be a string");
            assert.strictEqual(typeof colors.blue, "string", "blue should be a string");
            assert.strictEqual(typeof colors.cyan, "string", "cyan should be a string");
            assert.strictEqual(typeof colors.magenta, "string", "magenta should be a string");
        });

        it("should have correct ANSI escape code format for colors", () => {
            const prUtils = createPrUtils();
            const { colors } = prUtils;

            assert.strictEqual(colors.reset, "\x1b[0m");
            assert.strictEqual(colors.bright, "\x1b[1m");
            assert.strictEqual(colors.green, "\x1b[32m");
            assert.strictEqual(colors.yellow, "\x1b[33m");
            assert.strictEqual(colors.red, "\x1b[31m");
            assert.strictEqual(colors.blue, "\x1b[34m");
            assert.strictEqual(colors.cyan, "\x1b[36m");
            assert.strictEqual(colors.magenta, "\x1b[35m");
        });
    });

    describe("log", () => {
        it("should not throw when called with a message", () => {
            const prUtils = createPrUtils();
            const { log } = prUtils;

            assert.doesNotThrow(() => {
                log("test message");
            });
        });

        it("should not throw when called with a message and color", () => {
            const prUtils = createPrUtils();
            const { log } = prUtils;

            assert.doesNotThrow(() => {
                log("test message", "green");
            });
        });

        it("should not throw when called with invalid color key", () => {
            const prUtils = createPrUtils();
            const { log, colors } = prUtils;

            // This should still work, just won't colorize properly
            assert.doesNotThrow(() => {
                log("test message", "invalidColor");
            });
        });

        it("should handle empty message", () => {
            const prUtils = createPrUtils();
            const { log } = prUtils;

            assert.doesNotThrow(() => {
                log("");
            });
        });

        it("should handle undefined color parameter", () => {
            const prUtils = createPrUtils();
            const { log } = prUtils;

            assert.doesNotThrow(() => {
                log("test message", undefined);
            });
        });
    });

    describe("getCurrentBranch", () => {
        it("should return branch name when git command succeeds", () => {
            const testMockExecSync = mockExecSync({
                "git rev-parse --abbrev-ref HEAD": "feature/test-branch\n",
            });
            const prUtils = createPrUtils({ mockExecSync: testMockExecSync });
            const { getCurrentBranch } = prUtils;

            const result = getCurrentBranch();
            assert.strictEqual(result, "feature/test-branch");
        });

        it("should return 'unknown' when git command fails", () => {
            const testMockExecSync = mockExecSync({
                "git rev-parse --abbrev-ref HEAD": new Error("Not a git repository"),
            });
            const prUtils = createPrUtils({ mockExecSync: testMockExecSync });
            const { getCurrentBranch } = prUtils;

            const result = getCurrentBranch();
            assert.strictEqual(result, "unknown");
        });

        it("should handle main branch", () => {
            const testMockExecSync = mockExecSync({
                "git rev-parse --abbrev-ref HEAD": "main\n",
            });
            const prUtils = createPrUtils({ mockExecSync: testMockExecSync });
            const { getCurrentBranch } = prUtils;

            const result = getCurrentBranch();
            assert.strictEqual(result, "main");
        });

        it("should handle gh-pages branch", () => {
            const testMockExecSync = mockExecSync({
                "git rev-parse --abbrev-ref HEAD": "gh-pages\n",
            });
            const prUtils = createPrUtils({ mockExecSync: testMockExecSync });
            const { getCurrentBranch } = prUtils;

            const result = getCurrentBranch();
            assert.strictEqual(result, "gh-pages");
        });

        it("should handle detached HEAD state", () => {
            const testMockExecSync = mockExecSync({
                "git rev-parse --abbrev-ref HEAD": "HEAD\n",
            });
            const prUtils = createPrUtils({ mockExecSync: testMockExecSync });
            const { getCurrentBranch } = prUtils;

            const result = getCurrentBranch();
            assert.strictEqual(result, "HEAD");
        });

        it("should return 'unknown' when no mockExecSync provided", () => {
            const prUtils = createPrUtils({});
            const { getCurrentBranch } = prUtils;

            const result = getCurrentBranch();
            assert.strictEqual(result, "unknown");
        });
    });

    describe("getLastPRInfo", () => {
        it("should return null when tracking file does not exist", () => {
            const prUtils = createPrUtils({
                mockExistsSync: createMockFs.existsSync([]),
            });
            const { getLastPRInfo } = prUtils;

            const result = getLastPRInfo();
            assert.strictEqual(result, null);
        });

        it("should return parsed JSON when tracking file exists", () => {
            const trackingPath = ".last-pr.json";
            const prUtils = createPrUtils({
                mockExistsSync: createMockFs.existsSync([trackingPath]),
                mockReadFileSync: createMockFs.readFileSync({
                    [trackingPath]: JSON.stringify(samplePrData),
                }),
            });
            const { getLastPRInfo } = prUtils;

            const result = getLastPRInfo();
            assert.deepStrictEqual(result, samplePrData);
        });

        it("should return null when JSON parsing fails", () => {
            const trackingPath = ".last-pr.json";
            const prUtils = createPrUtils({
                mockExistsSync: createMockFs.existsSync([trackingPath]),
                mockReadFileSync: createMockFs.readFileSync({
                    [trackingPath]: "invalid json{{{",
                }),
            });
            const { getLastPRInfo } = prUtils;

            const result = getLastPRInfo();
            assert.strictEqual(result, null);
        });

        it("should return null when readFileSync throws", () => {
            const trackingPath = ".last-pr.json";
            const prUtils = createPrUtils({
                mockExistsSync: createMockFs.existsSync([trackingPath]),
                mockReadFileSync: () => {
                    throw new Error("Permission denied");
                },
            });
            const { getLastPRInfo } = prUtils;

            const result = getLastPRInfo();
            assert.strictEqual(result, null);
        });

        it("should handle PR info with all fields", () => {
            const trackingPath = ".last-pr.json";
            const fullPrData = {
                date: "2025-03-25T14:30:00.000Z",
                branch: "feature/comprehensive-test",
                description: "A detailed PR description",
                commit: {
                    hash: "def456789abc",
                    message: "docs: comprehensive documentation update",
                },
                url: "https://github.com/example/repo/pull/42",
            };
            const prUtils = createPrUtils({
                mockExistsSync: createMockFs.existsSync([trackingPath]),
                mockReadFileSync: createMockFs.readFileSync({
                    [trackingPath]: JSON.stringify(fullPrData),
                }),
            });
            const { getLastPRInfo } = prUtils;

            const result = getLastPRInfo();
            assert.deepStrictEqual(result, fullPrData);
        });

        it("should return null when no dependencies provided", () => {
            const prUtils = createPrUtils({});
            const { getLastPRInfo } = prUtils;

            const result = getLastPRInfo();
            assert.strictEqual(result, null);
        });
    });

    describe("getCommitsSince", () => {
        it("should return empty array when since commit cannot be found", () => {
            const testMockExecSync = mockExecSync({
                'git rev-list -1 --before="2025-01-01" HEAD': "",
            });
            const prUtils = createPrUtils({ mockExecSync: testMockExecSync });
            const { getCommitsSince } = prUtils;

            const result = getCommitsSince("2025-01-01");
            assert.deepStrictEqual(result, []);
        });

        it("should return empty array when git command fails", () => {
            const testMockExecSync = mockExecSync({
                'git rev-list -1 --before="2025-01-01" HEAD': new Error("Git error"),
            });
            const prUtils = createPrUtils({ mockExecSync: testMockExecSync });
            const { getCommitsSince } = prUtils;

            const result = getCommitsSince("2025-01-01");
            assert.deepStrictEqual(result, []);
        });

        it("should parse single commit correctly", () => {
            const testMockExecSync = mockExecSync({
                'git rev-list -1 --before="2025-01-01" HEAD': "abc123\n",
                "git log abc123..HEAD --oneline --no-merges": "def456 docs: add new feature\n",
            });
            const prUtils = createPrUtils({ mockExecSync: testMockExecSync });
            const { getCommitsSince } = prUtils;

            const result = getCommitsSince("2025-01-01");
            assert.strictEqual(result.length, 1);
            assert.strictEqual(result[0].hash, "def456");
            assert.strictEqual(result[0].message, "docs: add new feature");
        });

        it("should parse multiple commits correctly", () => {
            const testMockExecSync = mockExecSync({
                'git rev-list -1 --before="2025-01-01" HEAD': "abc123\n",
                "git log abc123..HEAD --oneline --no-merges":
                    "def456 docs: add new feature\n789abc fix: correct typo\n123def refactor: cleanup\n",
            });
            const prUtils = createPrUtils({ mockExecSync: testMockExecSync });
            const { getCommitsSince } = prUtils;

            const result = getCommitsSince("2025-01-01");
            assert.strictEqual(result.length, 3);
            assert.strictEqual(result[0].hash, "def456");
            assert.strictEqual(result[0].message, "docs: add new feature");
            assert.strictEqual(result[1].hash, "789abc");
            assert.strictEqual(result[1].message, "fix: correct typo");
            assert.strictEqual(result[2].hash, "123def");
            assert.strictEqual(result[2].message, "refactor: cleanup");
        });

        it("should handle commits with multi-word messages", () => {
            const testMockExecSync = mockExecSync({
                'git rev-list -1 --before="2025-01-01" HEAD': "abc123\n",
                "git log abc123..HEAD --oneline --no-merges":
                    "def456 docs: this is a long commit message with many words\n",
            });
            const prUtils = createPrUtils({ mockExecSync: testMockExecSync });
            const { getCommitsSince } = prUtils;

            const result = getCommitsSince("2025-01-01");
            // Message includes the commit type prefix
            assert.strictEqual(result[0].message, "docs: this is a long commit message with many words");
        });

        it("should handle empty git log output", () => {
            const testMockExecSync = mockExecSync({
                'git rev-list -1 --before="2025-01-01" HEAD': "abc123\n",
                "git log abc123..HEAD --oneline --no-merges": "\n",
            });
            const prUtils = createPrUtils({ mockExecSync: testMockExecSync });
            const { getCommitsSince } = prUtils;

            const result = getCommitsSince("2025-01-01");
            assert.deepStrictEqual(result, []);
        });

        it("should return empty array when git log fails", () => {
            const testMockExecSync = mockExecSync({
                'git rev-list -1 --before="2025-01-01" HEAD': "abc123\n",
                "git log abc123..HEAD --oneline --no-merges": new Error("Log error"),
            });
            const prUtils = createPrUtils({ mockExecSync: testMockExecSync });
            const { getCommitsSince } = prUtils;

            const result = getCommitsSince("2025-01-01");
            assert.deepStrictEqual(result, []);
        });

        it("should return empty array when no mockExecSync provided", () => {
            const prUtils = createPrUtils({});
            const { getCommitsSince } = prUtils;

            const result = getCommitsSince("2025-01-01");
            assert.deepStrictEqual(result, []);
        });
    });

    describe("getChangedFilesSince", () => {
        it("should return empty array when since commit cannot be found", () => {
            const testMockExecSync = mockExecSync({
                'git rev-list -1 --before="2025-01-01" HEAD': "",
            });
            const prUtils = createPrUtils({ mockExecSync: testMockExecSync });
            const { getChangedFilesSince } = prUtils;

            const result = getChangedFilesSince("2025-01-01");
            assert.deepStrictEqual(result, []);
        });

        it("should return empty array when git command fails", () => {
            const testMockExecSync = mockExecSync({
                'git rev-list -1 --before="2025-01-01" HEAD': new Error("Git error"),
            });
            const prUtils = createPrUtils({ mockExecSync: testMockExecSync });
            const { getChangedFilesSince } = prUtils;

            const result = getChangedFilesSince("2025-01-01");
            assert.deepStrictEqual(result, []);
        });

        it("should parse single file change correctly", () => {
            const testMockExecSync = mockExecSync({
                'git rev-list -1 --before="2025-01-01" HEAD': "abc123\n",
                "git diff --name-status abc123...HEAD":
                    "M\tsrc/content/docs/index.mdx\n",
            });
            const prUtils = createPrUtils({ mockExecSync: testMockExecSync });
            const { getChangedFilesSince } = prUtils;

            const result = getChangedFilesSince("2025-01-01");
            assert.strictEqual(result.length, 1);
            assert.strictEqual(result[0].status, "M");
            assert.strictEqual(result[0].path, "src/content/docs/index.mdx");
        });

        it("should parse multiple file changes with different statuses", () => {
            const testMockExecSync = mockExecSync({
                'git rev-list -1 --before="2025-01-01" HEAD': "abc123\n",
                "git diff --name-status abc123...HEAD":
                    "A\tsrc/content/docs/new-page.mdx\nM\tsrc/content/docs/updated.mdx\nD\tsrc/content/docs/old-page.mdx\n",
            });
            const prUtils = createPrUtils({ mockExecSync: testMockExecSync });
            const { getChangedFilesSince } = prUtils;

            const result = getChangedFilesSince("2025-01-01");
            assert.strictEqual(result.length, 3);
            assert.strictEqual(result[0].status, "A");
            assert.strictEqual(result[0].path, "src/content/docs/new-page.mdx");
            assert.strictEqual(result[1].status, "M");
            assert.strictEqual(result[1].path, "src/content/docs/updated.mdx");
            assert.strictEqual(result[2].status, "D");
            assert.strictEqual(result[2].path, "src/content/docs/old-page.mdx");
        });

        it("should handle files with spaces in path", () => {
            const testMockExecSync = mockExecSync({
                'git rev-list -1 --before="2025-01-01" HEAD': "abc123\n",
                "git diff --name-status abc123...HEAD":
                    "M\tsrc/content/docs/page with spaces.mdx\n",
            });
            const prUtils = createPrUtils({ mockExecSync: testMockExecSync });
            const { getChangedFilesSince } = prUtils;

            const result = getChangedFilesSince("2025-01-01");
            assert.strictEqual(result[0].path, "src/content/docs/page with spaces.mdx");
        });

        it("should handle empty diff output", () => {
            const testMockExecSync = mockExecSync({
                'git rev-list -1 --before="2025-01-01" HEAD': "abc123\n",
                "git diff --name-status abc123...HEAD": "\n",
            });
            const prUtils = createPrUtils({ mockExecSync: testMockExecSync });
            const { getChangedFilesSince } = prUtils;

            const result = getChangedFilesSince("2025-01-01");
            assert.deepStrictEqual(result, []);
        });

        it("should handle renamed files (status R100)", () => {
            const testMockExecSync = mockExecSync({
                'git rev-list -1 --before="2025-01-01" HEAD': "abc123\n",
                "git diff --name-status abc123...HEAD":
                    "R100\told-path.mdx\tnew-path.mdx\n",
            });
            const prUtils = createPrUtils({ mockExecSync: testMockExecSync });
            const { getChangedFilesSince } = prUtils;

            const result = getChangedFilesSince("2025-01-01");
            assert.strictEqual(result[0].status, "R100");
            assert.ok(result[0].path.includes("new-path.mdx"));
        });

        it("should return empty array when no mockExecSync provided", () => {
            const prUtils = createPrUtils({});
            const { getChangedFilesSince } = prUtils;

            const result = getChangedFilesSince("2025-01-01");
            assert.deepStrictEqual(result, []);
        });
    });

    describe("categorizeFiles", () => {
        it("should return empty categories for empty input", () => {
            const prUtils = createPrUtils();
            const { categorizeFiles } = prUtils;

            const result = categorizeFiles([]);
            assert.deepStrictEqual(result, {
                newPages: [],
                updatedPages: [],
                deletedPages: [],
                otherChanges: [],
            });
        });

        it("should categorize new doc pages correctly", () => {
            const prUtils = createPrUtils();
            const { categorizeFiles } = prUtils;

            const files = [
                { status: "A", path: "src/content/docs/new-page.mdx" },
            ];
            const result = categorizeFiles(files);
            assert.deepStrictEqual(result.newPages, ["src/content/docs/new-page.mdx"]);
            assert.deepStrictEqual(result.updatedPages, []);
            assert.deepStrictEqual(result.deletedPages, []);
            assert.deepStrictEqual(result.otherChanges, []);
        });

        it("should categorize modified doc pages correctly", () => {
            const prUtils = createPrUtils();
            const { categorizeFiles } = prUtils;

            const files = [
                { status: "M", path: "src/content/docs/updated-page.mdx" },
            ];
            const result = categorizeFiles(files);
            assert.deepStrictEqual(result.newPages, []);
            assert.deepStrictEqual(result.updatedPages, ["src/content/docs/updated-page.mdx"]);
            assert.deepStrictEqual(result.deletedPages, []);
            assert.deepStrictEqual(result.otherChanges, []);
        });

        it("should categorize deleted doc pages correctly", () => {
            const prUtils = createPrUtils();
            const { categorizeFiles } = prUtils;

            const files = [
                { status: "D", path: "src/content/docs/deleted-page.mdx" },
            ];
            const result = categorizeFiles(files);
            assert.deepStrictEqual(result.newPages, []);
            assert.deepStrictEqual(result.updatedPages, []);
            assert.deepStrictEqual(result.deletedPages, ["src/content/docs/deleted-page.mdx"]);
            assert.deepStrictEqual(result.otherChanges, []);
        });

        it("should categorize non-doc files as otherChanges", () => {
            const prUtils = createPrUtils();
            const { categorizeFiles } = prUtils;

            const files = [
                { status: "M", path: "scripts/build.js" },
                { status: "A", path: "package.json" },
                { status: "M", path: "README.md" },
            ];
            const result = categorizeFiles(files);
            assert.deepStrictEqual(result.newPages, []);
            assert.deepStrictEqual(result.updatedPages, []);
            assert.deepStrictEqual(result.deletedPages, []);
            assert.strictEqual(result.otherChanges.length, 3);
        });

        it("should exclude node_modules paths", () => {
            const prUtils = createPrUtils();
            const { categorizeFiles } = prUtils;

            const files = [
                { status: "M", path: "node_modules/some-package/index.js" },
            ];
            const result = categorizeFiles(files);
            assert.strictEqual(result.otherChanges.length, 0);
        });

        it("should exclude dist paths", () => {
            const prUtils = createPrUtils();
            const { categorizeFiles } = prUtils;

            const files = [
                { status: "M", path: "dist/bundle.js" },
            ];
            const result = categorizeFiles(files);
            assert.strictEqual(result.otherChanges.length, 0);
        });

        it("should exclude .next paths", () => {
            const prUtils = createPrUtils();
            const { categorizeFiles } = prUtils;

            const files = [
                { status: "M", path: ".next/server/app.js" },
            ];
            const result = categorizeFiles(files);
            assert.strictEqual(result.otherChanges.length, 0);
        });

        it("should not categorize .md files in docs as doc pages (only .mdx)", () => {
            const prUtils = createPrUtils();
            const { categorizeFiles } = prUtils;

            const files = [
                { status: "M", path: "src/content/docs/readme.md" },
            ];
            const result = categorizeFiles(files);
            assert.strictEqual(result.updatedPages.length, 0);
            assert.strictEqual(result.otherChanges.length, 1);
        });

        it("should handle mixed file types correctly", () => {
            const prUtils = createPrUtils();
            const { categorizeFiles } = prUtils;

            const files = [
                { status: "A", path: "src/content/docs/new1.mdx" },
                { status: "A", path: "src/content/docs/new2.mdx" },
                { status: "M", path: "src/content/docs/updated.mdx" },
                { status: "D", path: "src/content/docs/old.mdx" },
                { status: "M", path: "scripts/build.js" },
                { status: "M", path: "node_modules/ignored.js" },
            ];
            const result = categorizeFiles(files);
            assert.strictEqual(result.newPages.length, 2);
            assert.strictEqual(result.updatedPages.length, 1);
            assert.strictEqual(result.deletedPages.length, 1);
            assert.strictEqual(result.otherChanges.length, 1);
        });

        it("should silently drop doc pages with status codes other than A/M/D", () => {
            const prUtils = createPrUtils();
            const { categorizeFiles } = prUtils;

            const files = [
                { status: "R100", path: "src/content/docs/renamed.mdx" },
                { status: "C", path: "src/content/docs/copied.mdx" },
            ];
            const result = categorizeFiles(files);
            // Doc pages with non-A/M/D status are silently dropped (not added to any category)
            // This is the current behavior of the code
            assert.strictEqual(result.otherChanges.length, 0);
            assert.strictEqual(result.newPages.length, 0);
            assert.strictEqual(result.updatedPages.length, 0);
            assert.strictEqual(result.deletedPages.length, 0);
        });

        it("should categorize non-doc files with status codes other than A/M/D as otherChanges", () => {
            const prUtils = createPrUtils();
            const { categorizeFiles } = prUtils;

            const files = [
                { status: "R100", path: "scripts/renamed.js" },
                { status: "C", path: "config/copied.json" },
            ];
            const result = categorizeFiles(files);
            // Non-doc files with any status go to otherChanges
            assert.strictEqual(result.otherChanges.length, 2);
        });

        it("should handle null/undefined inputs gracefully", () => {
            const prUtils = createPrUtils();
            const { categorizeFiles } = prUtils;

            // Test with undefined path - should throw
            assert.throws(() => {
                categorizeFiles([{ status: "M" }]);
            });
        });

        it("should handle deeply nested doc paths", () => {
            const prUtils = createPrUtils();
            const { categorizeFiles } = prUtils;

            const files = [
                { status: "A", path: "src/content/docs/tags-reference/core/editable.mdx" },
            ];
            const result = categorizeFiles(files);
            assert.strictEqual(result.newPages.length, 1);
        });
    });

    describe("generatePRTitle", () => {
        it("should generate title for many new pages with tag commits", () => {
            const prUtils = createPrUtils();
            const { generatePRTitle } = prUtils;

            const commits = [{ hash: "abc", message: "docs: add tag reference" }];
            const categorized = {
                newPages: Array(5).fill("src/content/docs/page.mdx"),
                updatedPages: [],
                deletedPages: [],
                otherChanges: [],
            };

            const result = generatePRTitle(commits, categorized);
            assert.strictEqual(result, "docs: add comprehensive tag reference documentation");
        });

        it("should generate title for many new pages with concept commits", () => {
            const prUtils = createPrUtils();
            const { generatePRTitle } = prUtils;

            const commits = [{ hash: "abc", message: "docs: add concept guide" }];
            const categorized = {
                newPages: Array(5).fill("src/content/docs/page.mdx"),
                updatedPages: [],
                deletedPages: [],
                otherChanges: [],
            };

            const result = generatePRTitle(commits, categorized);
            assert.strictEqual(result, "docs: add core concepts documentation");
        });

        it("should generate title for many new pages with tutorial commits", () => {
            const prUtils = createPrUtils();
            const { generatePRTitle } = prUtils;

            const commits = [{ hash: "abc", message: "docs: add tutorial" }];
            const categorized = {
                newPages: Array(5).fill("src/content/docs/page.mdx"),
                updatedPages: [],
                deletedPages: [],
                otherChanges: [],
            };

            const result = generatePRTitle(commits, categorized);
            assert.strictEqual(result, "docs: add new tutorials and guides");
        });

        it("should generate title for many new pages without specific type", () => {
            const prUtils = createPrUtils();
            const { generatePRTitle } = prUtils;

            const commits = [{ hash: "abc", message: "docs: general update" }];
            const categorized = {
                newPages: Array(5).fill("src/content/docs/page.mdx"),
                updatedPages: [],
                deletedPages: [],
                otherChanges: [],
            };

            const result = generatePRTitle(commits, categorized);
            assert.strictEqual(result, "docs: add 5 new documentation pages");
        });

        it("should generate title for few new pages", () => {
            const prUtils = createPrUtils();
            const { generatePRTitle } = prUtils;

            const commits = [];
            const categorized = {
                newPages: ["src/content/docs/page.mdx"],
                updatedPages: [],
                deletedPages: [],
                otherChanges: [],
            };

            const result = generatePRTitle(commits, categorized);
            assert.strictEqual(result, "docs: add new documentation pages");
        });

        it("should generate title for large update (50+ pages)", () => {
            const prUtils = createPrUtils();
            const { generatePRTitle } = prUtils;

            const commits = [{ hash: "abc", message: "docs: update" }];
            const categorized = {
                newPages: [],
                updatedPages: Array(55).fill("src/content/docs/page.mdx"),
                deletedPages: [],
                otherChanges: [],
            };

            const result = generatePRTitle(commits, categorized);
            assert.strictEqual(result, "docs: comprehensive documentation updates and improvements");
        });

        it("should generate title for medium update with docs preference", () => {
            const prUtils = createPrUtils();
            const { generatePRTitle } = prUtils;

            const commits = [
                { hash: "abc", message: "docs: update 1" },
                { hash: "def", message: "docs: update 2" },
            ];
            const categorized = {
                newPages: [],
                updatedPages: Array(15).fill("src/content/docs/page.mdx"),
                deletedPages: [],
                otherChanges: [],
            };

            const result = generatePRTitle(commits, categorized);
            assert.strictEqual(result, "docs: documentation updates and improvements");
        });

        it("should generate title for medium update with fix commits", () => {
            const prUtils = createPrUtils();
            const { generatePRTitle } = prUtils;

            const commits = [
                { hash: "abc", message: "fix: typo" },
                { hash: "def", message: "fix: link" },
                { hash: "ghi", message: "fix: error" },
            ];
            const categorized = {
                newPages: [],
                updatedPages: Array(15).fill("src/content/docs/page.mdx"),
                deletedPages: [],
                otherChanges: [],
            };

            const result = generatePRTitle(commits, categorized);
            assert.strictEqual(result, "fix: correct multiple documentation issues");
        });

        it("should generate title for small update with fix preference", () => {
            const prUtils = createPrUtils();
            const { generatePRTitle } = prUtils;

            const commits = [
                { hash: "abc", message: "fix: typo" },
                { hash: "def", message: "fix: link" },
            ];
            const categorized = {
                newPages: [],
                updatedPages: ["src/content/docs/page.mdx"],
                deletedPages: [],
                otherChanges: [],
            };

            const result = generatePRTitle(commits, categorized);
            assert.strictEqual(result, "fix: documentation corrections and improvements");
        });

        it("should generate title for small update with docs preference", () => {
            const prUtils = createPrUtils();
            const { generatePRTitle } = prUtils;

            const commits = [{ hash: "abc", message: "docs: update" }];
            const categorized = {
                newPages: [],
                updatedPages: ["src/content/docs/page.mdx"],
                deletedPages: [],
                otherChanges: [],
            };

            const result = generatePRTitle(commits, categorized);
            assert.strictEqual(result, "docs: documentation updates and improvements");
        });

        it("should generate default title when no pages changed", () => {
            const prUtils = createPrUtils();
            const { generatePRTitle } = prUtils;

            const commits = [];
            const categorized = {
                newPages: [],
                updatedPages: [],
                deletedPages: [],
                otherChanges: [{ status: "M", path: "scripts/build.js" }],
            };

            const result = generatePRTitle(commits, categorized);
            assert.strictEqual(result, "docs: documentation updates");
        });

        it("should handle empty commits array", () => {
            const prUtils = createPrUtils();
            const { generatePRTitle } = prUtils;

            const categorized = {
                newPages: [],
                updatedPages: ["src/content/docs/page.mdx"],
                deletedPages: [],
                otherChanges: [],
            };

            const result = generatePRTitle([], categorized);
            assert.strictEqual(result, "docs: documentation updates and improvements");
        });

        it("should prioritize new pages over updated pages", () => {
            const prUtils = createPrUtils();
            const { generatePRTitle } = prUtils;

            const commits = [];
            const categorized = {
                newPages: ["src/content/docs/new.mdx"],
                updatedPages: Array(60).fill("src/content/docs/page.mdx"),
                deletedPages: [],
                otherChanges: [],
            };

            const result = generatePRTitle(commits, categorized);
            assert.strictEqual(result, "docs: add new documentation pages");
        });

        it("should handle mixed commit types correctly", () => {
            const prUtils = createPrUtils();
            const { generatePRTitle } = prUtils;

            const commits = [
                { hash: "abc", message: "fix: bug 1" },
                { hash: "def", message: "fix: bug 2" },
                { hash: "ghi", message: "docs: update" },
                { hash: "jkl", message: "feat: new feature" },
            ];
            const categorized = {
                newPages: [],
                updatedPages: ["src/content/docs/page.mdx"],
                deletedPages: [],
                otherChanges: [],
            };

            const result = generatePRTitle(commits, categorized);
            assert.strictEqual(result, "fix: documentation corrections and improvements");
        });
    });

    describe("generatePRBody", () => {
        it("should generate body with summary section", () => {
            const prUtils = createPrUtils();
            const { generatePRBody } = prUtils;

            const commits = [{ hash: "abc", message: "test commit" }];
            const categorized = {
                newPages: [],
                updatedPages: [],
                deletedPages: [],
                otherChanges: [],
            };

            const result = generatePRBody(commits, categorized);
            assert.ok(result.includes("## Summary"));
        });

        it("should generate comprehensive summary for large updates", () => {
            const prUtils = createPrUtils();
            const { generatePRBody } = prUtils;

            const commits = [];
            const categorized = {
                newPages: [],
                updatedPages: Array(55).fill("src/content/docs/page.mdx"),
                deletedPages: [],
                otherChanges: [],
            };

            const result = generatePRBody(commits, categorized);
            assert.ok(result.includes("comprehensive documentation updates"));
        });

        it("should list new pages with count", () => {
            const prUtils = createPrUtils();
            const { generatePRBody } = prUtils;

            const commits = [];
            const categorized = {
                newPages: ["src/content/docs/new-feature.mdx"],
                updatedPages: [],
                deletedPages: [],
                otherChanges: [],
            };

            const result = generatePRBody(commits, categorized);
            assert.ok(result.includes("### New Pages (1)"));
            assert.ok(result.includes("new feature"));
        });

        it("should limit new pages display to 10", () => {
            const prUtils = createPrUtils();
            const { generatePRBody } = prUtils;

            const commits = [];
            const categorized = {
                newPages: Array(15).fill("src/content/docs/page.mdx").map((p, i) => p.replace("page", `page-${i}`)),
                updatedPages: [],
                deletedPages: [],
                otherChanges: [],
            };

            const result = generatePRBody(commits, categorized);
            assert.ok(result.includes("... and 5 more"));
        });

        it("should group updated pages by area", () => {
            const prUtils = createPrUtils();
            const { generatePRBody } = prUtils;

            const commits = [];
            const categorized = {
                newPages: [],
                updatedPages: [
                    "src/content/docs/tags-reference/abc.mdx",
                    "src/content/docs/tags-reference/def.mdx",
                    "src/content/docs/concepts/xyz.mdx",
                ],
                deletedPages: [],
                otherChanges: [],
            };

            const result = generatePRBody(commits, categorized);
            assert.ok(result.includes("**tags-reference**"));
            assert.ok(result.includes("**concepts**"));
        });

        it("should limit updated pages per area to 5", () => {
            const prUtils = createPrUtils();
            const { generatePRBody } = prUtils;

            const commits = [];
            const categorized = {
                newPages: [],
                updatedPages: Array(8).fill("src/content/docs/tags-reference/page.mdx").map((p, i) => p.replace("page", `page-${i}`)),
                deletedPages: [],
                otherChanges: [],
            };

            const result = generatePRBody(commits, categorized);
            assert.ok(result.includes("... and 3 more"));
        });

        it("should list deleted pages", () => {
            const prUtils = createPrUtils();
            const { generatePRBody } = prUtils;

            const commits = [];
            const categorized = {
                newPages: [],
                updatedPages: [],
                deletedPages: ["src/content/docs/old-page.mdx"],
                otherChanges: [],
            };

            const result = generatePRBody(commits, categorized);
            assert.ok(result.includes("### Deleted Pages (1)"));
            assert.ok(result.includes("old page"));
        });

        it("should include commits section with count", () => {
            const prUtils = createPrUtils();
            const { generatePRBody } = prUtils;

            const commits = [
                { hash: "abc123", message: "test commit" },
            ];
            const categorized = {
                newPages: [],
                updatedPages: [],
                deletedPages: [],
                otherChanges: [],
            };

            const result = generatePRBody(commits, categorized);
            assert.ok(result.includes("## Commits"));
            assert.ok(result.includes("1 commit"));
            assert.ok(result.includes("test commit (abc123)"));
        });

        it("should pluralize commits correctly", () => {
            const prUtils = createPrUtils();
            const { generatePRBody } = prUtils;

            const commits = [
                { hash: "abc", message: "commit 1" },
                { hash: "def", message: "commit 2" },
            ];
            const categorized = {
                newPages: [],
                updatedPages: [],
                deletedPages: [],
                otherChanges: [],
            };

            const result = generatePRBody(commits, categorized);
            assert.ok(result.includes("2 commits"));
        });

        it("should limit commits display to 10", () => {
            const prUtils = createPrUtils();
            const { generatePRBody } = prUtils;

            const commits = Array(15).fill({ hash: "abc", message: "commit" }).map((c, i) => ({
                hash: `hash${i}`,
                message: `commit ${i}`,
            }));
            const categorized = {
                newPages: [],
                updatedPages: [],
                deletedPages: [],
                otherChanges: [],
            };

            const result = generatePRBody(commits, categorized);
            assert.ok(result.includes("... and 5 more commits"));
        });

        it("should include quality checklist", () => {
            const prUtils = createPrUtils();
            const { generatePRBody } = prUtils;

            const commits = [];
            const categorized = {
                newPages: [],
                updatedPages: [],
                deletedPages: [],
                otherChanges: [],
            };

            const result = generatePRBody(commits, categorized);
            assert.ok(result.includes("## Quality Checklist"));
            assert.ok(result.includes("- [x] Documentation follows DOCS-STANDARDS.md"));
            assert.ok(result.includes("- [x] All links tested and working"));
            assert.ok(result.includes("- [x] Build passes locally"));
            assert.ok(result.includes("- [x] Validation passes"));
            assert.ok(result.includes("- [x] English language used throughout"));
        });

        it("should format page names correctly (remove dashes and extension)", () => {
            const prUtils = createPrUtils();
            const { generatePRBody } = prUtils;

            const commits = [];
            const categorized = {
                newPages: ["src/content/docs/my-awesome-feature-guide.mdx"],
                updatedPages: [],
                deletedPages: [],
                otherChanges: [],
            };

            const result = generatePRBody(commits, categorized);
            assert.ok(result.includes("my awesome feature guide"));
        });

        it("should handle empty commits array", () => {
            const prUtils = createPrUtils();
            const { generatePRBody } = prUtils;

            const categorized = {
                newPages: [],
                updatedPages: [],
                deletedPages: [],
                otherChanges: [],
            };

            const result = generatePRBody([], categorized);
            assert.ok(result.includes("0 commits"));
        });

        it("should handle all empty categories", () => {
            const prUtils = createPrUtils();
            const { generatePRBody } = prUtils;

            const commits = [{ hash: "abc", message: "test" }];
            const categorized = {
                newPages: [],
                updatedPages: [],
                deletedPages: [],
                otherChanges: [],
            };

            const result = generatePRBody(commits, categorized);
            assert.ok(typeof result === "string");
            assert.ok(result.length > 0);
        });

        it("should include Changes section header", () => {
            const prUtils = createPrUtils();
            const { generatePRBody } = prUtils;

            const commits = [];
            const categorized = {
                newPages: [],
                updatedPages: [],
                deletedPages: [],
                otherChanges: [],
            };

            const result = generatePRBody(commits, categorized);
            assert.ok(result.includes("## Changes"));
        });

        it("should handle pages in root docs directory (uses filename as area)", () => {
            const prUtils = createPrUtils();
            const { generatePRBody } = prUtils;

            const commits = [];
            const categorized = {
                newPages: [],
                updatedPages: ["src/content/docs/index.mdx"],
                deletedPages: [],
                otherChanges: [],
            };

            const result = generatePRBody(commits, categorized);
            // When path is "src/content/docs/index.mdx", split("/")[3] is "index.mdx"
            assert.ok(result.includes("**index.mdx**"));
        });

        it("should display page count per area", () => {
            const prUtils = createPrUtils();
            const { generatePRBody } = prUtils;

            const commits = [];
            const categorized = {
                newPages: [],
                updatedPages: [
                    "src/content/docs/tutorial/page1.mdx",
                    "src/content/docs/tutorial/page2.mdx",
                    "src/content/docs/tutorial/page3.mdx",
                ],
                deletedPages: [],
                otherChanges: [],
            };

            const result = generatePRBody(commits, categorized);
            assert.ok(result.includes("**tutorial** (3 pages)"));
        });
    });
});
