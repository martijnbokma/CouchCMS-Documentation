/**
 * Tests for ai-sync-shared.js
 *
 * Tests all exported functions and constants:
 * - SYNC_EXCLUDE_FILENAME
 * - SYNC_WRITE_IDS
 * - loadSkipWrites(rootDir)
 * - addSkipWrites(rootDir, ids)
 * - DIR_TO_SYNC_SKIP_ID
 */

import { describe, it, beforeEach, afterEach, mock } from "node:test";
import assert from "node:assert";
import { join } from "node:path";
import { mkdtempSync, rmSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";

// Import the module under test
import {
    SYNC_EXCLUDE_FILENAME,
    SYNC_WRITE_IDS,
    loadSkipWrites,
    addSkipWrites,
    DIR_TO_SYNC_SKIP_ID,
} from "../ai-sync-shared.js";

describe("SYNC_EXCLUDE_FILENAME", () => {
    it("should be a string", () => {
        assert.strictEqual(typeof SYNC_EXCLUDE_FILENAME, "string");
    });

    it("should have the expected value", () => {
        assert.strictEqual(SYNC_EXCLUDE_FILENAME, "ai-sync.exclude.json");
    });
});

describe("SYNC_WRITE_IDS", () => {
    it("should be an array", () => {
        assert.ok(Array.isArray(SYNC_WRITE_IDS));
    });

    it("should contain expected IDs", () => {
        const expectedIds = [
            "cursorrules",
            "claude",
            "windsurf",
            "copilot",
            "vscode",
            "tabnine",
            "codewhisperer",
            "editorconfig",
            "cursorIndex",
        ];
        assert.deepStrictEqual(SYNC_WRITE_IDS.sort(), expectedIds.sort());
    });

    it("should have exactly 9 IDs", () => {
        assert.strictEqual(SYNC_WRITE_IDS.length, 9);
    });

    it("should contain only strings", () => {
        for (const id of SYNC_WRITE_IDS) {
            assert.strictEqual(typeof id, "string", `ID ${id} should be a string`);
        }
    });

    it("should not contain duplicates", () => {
        const unique = new Set(SYNC_WRITE_IDS);
        assert.strictEqual(unique.size, SYNC_WRITE_IDS.length, "SYNC_WRITE_IDS should not have duplicates");
    });
});

describe("DIR_TO_SYNC_SKIP_ID", () => {
    it("should be an object", () => {
        assert.strictEqual(typeof DIR_TO_SYNC_SKIP_ID, "object");
        assert.ok(DIR_TO_SYNC_SKIP_ID !== null);
    });

    it("should have expected mappings", () => {
        assert.strictEqual(DIR_TO_SYNC_SKIP_ID[".tabnine"], "tabnine");
        assert.strictEqual(DIR_TO_SYNC_SKIP_ID[".codewhisperer"], "codewhisperer");
    });

    it("should map to valid SYNC_WRITE_IDS", () => {
        for (const [dir, id] of Object.entries(DIR_TO_SYNC_SKIP_ID)) {
            assert.ok(SYNC_WRITE_IDS.includes(id), `ID ${id} for dir ${dir} should be in SYNC_WRITE_IDS`);
        }
    });

    it("should have exactly 2 mappings", () => {
        assert.strictEqual(Object.keys(DIR_TO_SYNC_SKIP_ID).length, 2);
    });
});

describe("loadSkipWrites", () => {
    let tempDir;

    beforeEach(() => {
        tempDir = mkdtempSync(join(tmpdir(), "ai-sync-test-"));
    });

    afterEach(() => {
        rmSync(tempDir, { recursive: true, force: true });
    });

    it("should return empty Set when exclude file does not exist", () => {
        const result = loadSkipWrites(tempDir);
        assert.ok(result instanceof Set);
        assert.strictEqual(result.size, 0);
    });

    it("should return empty Set when exclude file is empty JSON object", () => {
        const excludePath = join(tempDir, SYNC_EXCLUDE_FILENAME);
        writeFileSync(excludePath, "{}", "utf8");

        const result = loadSkipWrites(tempDir);
        assert.strictEqual(result.size, 0);
    });

    it("should return empty Set when skipWrites is missing", () => {
        const excludePath = join(tempDir, SYNC_EXCLUDE_FILENAME);
        writeFileSync(excludePath, JSON.stringify({ otherKey: "value" }), "utf8");

        const result = loadSkipWrites(tempDir);
        assert.strictEqual(result.size, 0);
    });

    it("should return empty Set when skipWrites is not an array", () => {
        const excludePath = join(tempDir, SYNC_EXCLUDE_FILENAME);
        writeFileSync(excludePath, JSON.stringify({ skipWrites: "not-an-array" }), "utf8");

        const result = loadSkipWrites(tempDir);
        assert.strictEqual(result.size, 0);
    });

    it("should load valid IDs from exclude file", () => {
        const excludePath = join(tempDir, SYNC_EXCLUDE_FILENAME);
        writeFileSync(
            excludePath,
            JSON.stringify({ skipWrites: ["tabnine", "cursorrules"] }),
            "utf8"
        );

        const result = loadSkipWrites(tempDir);
        assert.strictEqual(result.size, 2);
        assert.ok(result.has("tabnine"));
        assert.ok(result.has("cursorrules"));
    });

    it("should filter out invalid IDs", () => {
        const excludePath = join(tempDir, SYNC_EXCLUDE_FILENAME);
        writeFileSync(
            excludePath,
            JSON.stringify({ skipWrites: ["tabnine", "invalid-id", "claude"] }),
            "utf8"
        );

        const result = loadSkipWrites(tempDir);
        assert.strictEqual(result.size, 2);
        assert.ok(result.has("tabnine"));
        assert.ok(result.has("claude"));
        assert.ok(!result.has("invalid-id"));
    });

    it("should filter out non-string values", () => {
        const excludePath = join(tempDir, SYNC_EXCLUDE_FILENAME);
        writeFileSync(
            excludePath,
            JSON.stringify({ skipWrites: ["tabnine", 123, null, true, {}, []] }),
            "utf8"
        );

        const result = loadSkipWrites(tempDir);
        assert.strictEqual(result.size, 1);
        assert.ok(result.has("tabnine"));
    });

    it("should return empty Set when file has invalid JSON", () => {
        const excludePath = join(tempDir, SYNC_EXCLUDE_FILENAME);
        writeFileSync(excludePath, "not valid json {", "utf8");

        const result = loadSkipWrites(tempDir);
        assert.strictEqual(result.size, 0);
    });

    it("should return empty Set when JSON is malformed", () => {
        const excludePath = join(tempDir, SYNC_EXCLUDE_FILENAME);
        writeFileSync(excludePath, "{skipWrites: [unquoted]}", "utf8");

        const result = loadSkipWrites(tempDir);
        assert.strictEqual(result.size, 0);
    });

    it("should handle all valid IDs", () => {
        const excludePath = join(tempDir, SYNC_EXCLUDE_FILENAME);
        writeFileSync(
            excludePath,
            JSON.stringify({ skipWrites: [...SYNC_WRITE_IDS] }),
            "utf8"
        );

        const result = loadSkipWrites(tempDir);
        assert.strictEqual(result.size, SYNC_WRITE_IDS.length);
        for (const id of SYNC_WRITE_IDS) {
            assert.ok(result.has(id), `Should have ${id}`);
        }
    });

    it("should deduplicate IDs in file", () => {
        const excludePath = join(tempDir, SYNC_EXCLUDE_FILENAME);
        writeFileSync(
            excludePath,
            JSON.stringify({ skipWrites: ["tabnine", "tabnine", "claude", "claude"] }),
            "utf8"
        );

        const result = loadSkipWrites(tempDir);
        assert.strictEqual(result.size, 2);
        assert.ok(result.has("tabnine"));
        assert.ok(result.has("claude"));
    });
});

describe("addSkipWrites", () => {
    let tempDir;

    beforeEach(() => {
        tempDir = mkdtempSync(join(tmpdir(), "ai-sync-test-"));
    });

    afterEach(() => {
        rmSync(tempDir, { recursive: true, force: true });
    });

    it("should return empty array when no valid IDs provided", () => {
        const result = addSkipWrites(tempDir, []);
        assert.deepStrictEqual(result, []);
    });

    it("should return empty array when invalid IDs provided", () => {
        const result = addSkipWrites(tempDir, ["invalid-id", "another-invalid"]);
        assert.deepStrictEqual(result, []);
    });

    it("should create exclude file when it does not exist", () => {
        const result = addSkipWrites(tempDir, ["tabnine"]);

        assert.ok(existsSync(join(tempDir, SYNC_EXCLUDE_FILENAME)));
        assert.ok(result.includes("tabnine"));
    });

    it("should add single valid ID", () => {
        const result = addSkipWrites(tempDir, ["tabnine"]);

        assert.strictEqual(result.length, 1);
        assert.ok(result.includes("tabnine"));

        // Verify file contents
        const fileContent = JSON.parse(readFileSync(join(tempDir, SYNC_EXCLUDE_FILENAME), "utf8"));
        assert.deepStrictEqual(fileContent.skipWrites, ["tabnine"]);
    });

    it("should add multiple valid IDs", () => {
        const result = addSkipWrites(tempDir, ["tabnine", "claude", "windsurf"]);

        assert.strictEqual(result.length, 3);
        assert.ok(result.includes("tabnine"));
        assert.ok(result.includes("claude"));
        assert.ok(result.includes("windsurf"));
    });

    it("should filter out invalid IDs while adding valid ones", () => {
        const result = addSkipWrites(tempDir, ["tabnine", "invalid", "claude"]);

        assert.strictEqual(result.length, 2);
        assert.ok(result.includes("tabnine"));
        assert.ok(result.includes("claude"));
        assert.ok(!result.includes("invalid"));
    });

    it("should deduplicate input IDs", () => {
        const result = addSkipWrites(tempDir, ["tabnine", "tabnine", "claude", "claude"]);

        assert.strictEqual(result.length, 2);
    });

    it("should merge with existing exclude file", () => {
        const excludePath = join(tempDir, SYNC_EXCLUDE_FILENAME);
        writeFileSync(excludePath, JSON.stringify({ skipWrites: ["tabnine"] }), "utf8");

        const result = addSkipWrites(tempDir, ["claude"]);

        assert.strictEqual(result.length, 2);
        assert.ok(result.includes("tabnine"));
        assert.ok(result.includes("claude"));
    });

    it("should not duplicate existing IDs", () => {
        const excludePath = join(tempDir, SYNC_EXCLUDE_FILENAME);
        writeFileSync(excludePath, JSON.stringify({ skipWrites: ["tabnine"] }), "utf8");

        const result = addSkipWrites(tempDir, ["tabnine"]);

        assert.strictEqual(result.length, 1);
        assert.ok(result.includes("tabnine"));
    });

    it("should sort IDs alphabetically", () => {
        const result = addSkipWrites(tempDir, ["windsurf", "claude", "tabnine"]);

        assert.deepStrictEqual(result, ["claude", "tabnine", "windsurf"]);
    });

    it("should overwrite malformed JSON file", () => {
        const excludePath = join(tempDir, SYNC_EXCLUDE_FILENAME);
        writeFileSync(excludePath, "not valid json", "utf8");

        const result = addSkipWrites(tempDir, ["tabnine"]);

        assert.strictEqual(result.length, 1);
        assert.ok(result.includes("tabnine"));

        // Verify file is now valid JSON
        const fileContent = JSON.parse(readFileSync(excludePath, "utf8"));
        assert.deepStrictEqual(fileContent.skipWrites, ["tabnine"]);
    });

    it("should handle exclude file with invalid skipWrites type", () => {
        const excludePath = join(tempDir, SYNC_EXCLUDE_FILENAME);
        writeFileSync(excludePath, JSON.stringify({ skipWrites: "not-an-array" }), "utf8");

        const result = addSkipWrites(tempDir, ["tabnine"]);

        assert.strictEqual(result.length, 1);
        assert.ok(result.includes("tabnine"));
    });

    it("should preserve other properties in exclude file", () => {
        const excludePath = join(tempDir, SYNC_EXCLUDE_FILENAME);
        writeFileSync(
            excludePath,
            JSON.stringify({ skipWrites: ["tabnine"], otherProp: "value" }),
            "utf8"
        );

        addSkipWrites(tempDir, ["claude"]);

        const fileContent = JSON.parse(readFileSync(excludePath, "utf8"));
        assert.strictEqual(fileContent.otherProp, "value");
    });

    it("should format JSON with 4-space indentation", () => {
        addSkipWrites(tempDir, ["tabnine"]);

        const rawContent = readFileSync(join(tempDir, SYNC_EXCLUDE_FILENAME), "utf8");
        assert.ok(rawContent.includes("    "), "Should use 4-space indentation");
    });

    it("should add trailing newline to file", () => {
        addSkipWrites(tempDir, ["tabnine"]);

        const rawContent = readFileSync(join(tempDir, SYNC_EXCLUDE_FILENAME), "utf8");
        assert.ok(rawContent.endsWith("\n"), "Should end with newline");
    });

    it("should handle all valid IDs", () => {
        const result = addSkipWrites(tempDir, [...SYNC_WRITE_IDS]);

        assert.strictEqual(result.length, SYNC_WRITE_IDS.length);
        for (const id of SYNC_WRITE_IDS) {
            assert.ok(result.includes(id), `Should include ${id}`);
        }
    });

    it("should filter out non-string input values", () => {
        const result = addSkipWrites(tempDir, ["tabnine", 123, null, undefined, true, {}, []]);

        assert.strictEqual(result.length, 1);
        assert.ok(result.includes("tabnine"));
    });
});

describe("Integration: loadSkipWrites and addSkipWrites", () => {
    let tempDir;

    beforeEach(() => {
        tempDir = mkdtempSync(join(tmpdir(), "ai-sync-test-"));
    });

    afterEach(() => {
        rmSync(tempDir, { recursive: true, force: true });
    });

    it("should round-trip data correctly", () => {
        addSkipWrites(tempDir, ["tabnine", "claude", "windsurf"]);

        const loaded = loadSkipWrites(tempDir);

        assert.strictEqual(loaded.size, 3);
        assert.ok(loaded.has("tabnine"));
        assert.ok(loaded.has("claude"));
        assert.ok(loaded.has("windsurf"));
    });

    it("should accumulate IDs across multiple calls", () => {
        addSkipWrites(tempDir, ["tabnine"]);
        addSkipWrites(tempDir, ["claude"]);
        addSkipWrites(tempDir, ["windsurf"]);

        const loaded = loadSkipWrites(tempDir);

        assert.strictEqual(loaded.size, 3);
        assert.ok(loaded.has("tabnine"));
        assert.ok(loaded.has("claude"));
        assert.ok(loaded.has("windsurf"));
    });

    it("should handle duplicate additions across calls", () => {
        addSkipWrites(tempDir, ["tabnine"]);
        addSkipWrites(tempDir, ["tabnine", "claude"]);

        const loaded = loadSkipWrites(tempDir);

        assert.strictEqual(loaded.size, 2);
        assert.ok(loaded.has("tabnine"));
        assert.ok(loaded.has("claude"));
    });
});
