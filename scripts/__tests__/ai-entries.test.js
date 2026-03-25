/**
 * Tests for scripts/lib/ai-entries.js
 *
 * Validates the structure and integrity of ENTRIES and SYNC_FILES arrays.
 */
import { describe, it } from "node:test";
import assert from "node:assert";
import { ENTRIES, SYNC_FILES } from "../lib/ai-entries.js";

// Valid kind values for ENTRIES
const VALID_KINDS = ["sync", "skills", "local", "mixed", "vscode-ext"];

describe("ai-entries.js", () => {
    describe("ENTRIES array", () => {
        it("should be an array", () => {
            assert.ok(Array.isArray(ENTRIES), "ENTRIES should be an array");
        });

        it("should have expected length (15 entries)", () => {
            assert.strictEqual(ENTRIES.length, 15, "ENTRIES should have 15 entries");
        });

        it("should have required fields on each entry", () => {
            const requiredFields = ["path", "label", "kind", "note", "allowDelete"];

            ENTRIES.forEach((entry, index) => {
                requiredFields.forEach((field) => {
                    assert.ok(
                        Object.prototype.hasOwnProperty.call(entry, field),
                        `Entry at index ${index} (${entry.path || "unknown"}) is missing required field: ${field}`
                    );
                });
            });
        });

        it("should have no duplicate paths", () => {
            const paths = ENTRIES.map((entry) => entry.path);
            const uniquePaths = new Set(paths);

            assert.strictEqual(
                paths.length,
                uniquePaths.size,
                "ENTRIES should not contain duplicate paths"
            );
        });

        it("should have all paths starting with a dot (.)", () => {
            ENTRIES.forEach((entry, index) => {
                assert.ok(
                    entry.path.startsWith("."),
                    `Entry at index ${index} has path "${entry.path}" which does not start with "."`
                );
            });
        });

        it("should have valid kind values", () => {
            ENTRIES.forEach((entry, index) => {
                assert.ok(
                    VALID_KINDS.includes(entry.kind),
                    `Entry at index ${index} (${entry.path}) has invalid kind: "${entry.kind}". Valid kinds are: ${VALID_KINDS.join(", ")}`
                );
            });
        });

        it("should have allowDelete as boolean", () => {
            ENTRIES.forEach((entry, index) => {
                assert.strictEqual(
                    typeof entry.allowDelete,
                    "boolean",
                    `Entry at index ${index} (${entry.path}) has allowDelete that is not a boolean`
                );
            });
        });

        it("should have non-empty strings for path, label, and note", () => {
            ENTRIES.forEach((entry, index) => {
                assert.ok(
                    typeof entry.path === "string" && entry.path.length > 0,
                    `Entry at index ${index} has empty or non-string path`
                );
                assert.ok(
                    typeof entry.label === "string" && entry.label.length > 0,
                    `Entry at index ${index} has empty or non-string label`
                );
                assert.ok(
                    typeof entry.note === "string" && entry.note.length > 0,
                    `Entry at index ${index} has empty or non-string note`
                );
            });
        });

        it("should have unique labels", () => {
            const labels = ENTRIES.map((entry) => entry.label);
            const uniqueLabels = new Set(labels);

            assert.strictEqual(
                labels.length,
                uniqueLabels.size,
                "ENTRIES should not contain duplicate labels"
            );
        });

        it("should have exactly 3 entries with allowDelete: false", () => {
            const nonDeletable = ENTRIES.filter((entry) => !entry.allowDelete);
            assert.strictEqual(
                nonDeletable.length,
                3,
                "Expected exactly 3 entries with allowDelete: false"
            );
        });

        it("should have entries with kind 'sync' that are properly marked", () => {
            const syncEntries = ENTRIES.filter((entry) => entry.kind === "sync");
            assert.ok(syncEntries.length > 0, "Should have at least one 'sync' kind entry");

            syncEntries.forEach((entry) => {
                assert.ok(
                    entry.note.toLowerCase().includes("sync"),
                    `Sync entry "${entry.path}" should mention sync in its note`
                );
            });
        });

        it("should have entries with kind 'skills' that reference skills CLI", () => {
            const skillsEntries = ENTRIES.filter((entry) => entry.kind === "skills");
            assert.ok(skillsEntries.length > 0, "Should have at least one 'skills' kind entry");

            skillsEntries.forEach((entry) => {
                const noteLower = entry.note.toLowerCase();
                assert.ok(
                    noteLower.includes("skills") || noteLower.includes("cli"),
                    `Skills entry "${entry.path}" should mention skills or CLI in its note`
                );
            });
        });
    });

    describe("SYNC_FILES array", () => {
        it("should be an array", () => {
            assert.ok(Array.isArray(SYNC_FILES), "SYNC_FILES should be an array");
        });

        it("should have expected length (4 files)", () => {
            assert.strictEqual(SYNC_FILES.length, 4, "SYNC_FILES should have 4 entries");
        });

        it("should have required fields on each entry", () => {
            const requiredFields = ["path", "label"];

            SYNC_FILES.forEach((entry, index) => {
                requiredFields.forEach((field) => {
                    assert.ok(
                        Object.prototype.hasOwnProperty.call(entry, field),
                        `SYNC_FILES entry at index ${index} is missing required field: ${field}`
                    );
                });
            });
        });

        it("should have no duplicate paths", () => {
            const paths = SYNC_FILES.map((entry) => entry.path);
            const uniquePaths = new Set(paths);

            assert.strictEqual(
                paths.length,
                uniquePaths.size,
                "SYNC_FILES should not contain duplicate paths"
            );
        });

        it("should have paths as relative paths (not absolute)", () => {
            SYNC_FILES.forEach((entry, index) => {
                assert.ok(
                    !entry.path.startsWith("/"),
                    `SYNC_FILES entry at index ${index} has absolute path: "${entry.path}"`
                );
            });
        });

        it("should have non-empty strings for path and label", () => {
            SYNC_FILES.forEach((entry, index) => {
                assert.ok(
                    typeof entry.path === "string" && entry.path.length > 0,
                    `SYNC_FILES entry at index ${index} has empty or non-string path`
                );
                assert.ok(
                    typeof entry.label === "string" && entry.label.length > 0,
                    `SYNC_FILES entry at index ${index} has empty or non-string label`
                );
            });
        });

        it("should have unique labels", () => {
            const labels = SYNC_FILES.map((entry) => entry.label);
            const uniqueLabels = new Set(labels);

            assert.strictEqual(
                labels.length,
                uniqueLabels.size,
                "SYNC_FILES should not contain duplicate labels"
            );
        });

        it("should contain expected sync files", () => {
            const expectedPaths = [".cursorrules", "CLAUDE.md", ".windsurfrules", ".editorconfig"];
            const actualPaths = SYNC_FILES.map((entry) => entry.path);

            expectedPaths.forEach((expectedPath) => {
                assert.ok(
                    actualPaths.includes(expectedPath),
                    `SYNC_FILES should contain "${expectedPath}"`
                );
            });
        });

        it("should have paths that are file paths (contain extension or start with dot)", () => {
            SYNC_FILES.forEach((entry, index) => {
                const hasExtension = entry.path.includes(".");
                const isDotfile = entry.path.startsWith(".");
                assert.ok(
                    hasExtension || isDotfile,
                    `SYNC_FILES entry at index ${index} "${entry.path}" should be a file path`
                );
            });
        });
    });
});
