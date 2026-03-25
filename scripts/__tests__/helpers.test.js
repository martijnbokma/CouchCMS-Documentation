/**
 * Tests for test helpers
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import {
    mockExecSync,
    createMockFs,
    samplePrData,
    testFixtures,
    sampleLastPrPath,
} from "./helpers.js";

describe("mockExecSync", () => {
    it("should return mock output for exact command match", () => {
        const mockExec = mockExecSync({
            "git rev-parse HEAD": "abc123\n",
        });

        const result = mockExec("git rev-parse HEAD");
        assert.strictEqual(result, "abc123\n");
    });

    it("should throw error for unexpected command", () => {
        const mockExec = mockExecSync({});

        assert.throws(() => {
            mockExec("unexpected command");
        }, /Unexpected command/);
    });

    it("should throw Error instance when mock is an Error", () => {
        const mockExec = mockExecSync({
            "git status": new Error("Not a git repository"),
        });

        assert.throws(() => {
            mockExec("git status");
        }, /Not a git repository/);
    });
});

describe("createMockFs", () => {
    describe("readFileSync", () => {
        it("should return file content for existing file", () => {
            const mockRead = createMockFs.readFileSync({
                "/path/to/file.txt": "file content",
            });

            const result = mockRead("/path/to/file.txt", "utf-8");
            assert.strictEqual(result, "file content");
        });

        it("should throw ENOENT for missing file", () => {
            const mockRead = createMockFs.readFileSync({});

            assert.throws(() => {
                mockRead("/nonexistent.txt", "utf-8");
            }, (err) => err.code === "ENOENT");
        });
    });

    describe("existsSync", () => {
        it("should return true for existing files", () => {
            const mockExists = createMockFs.existsSync(["/a.txt", "/b.txt"]);

            assert.strictEqual(mockExists("/a.txt"), true);
            assert.strictEqual(mockExists("/b.txt"), true);
        });

        it("should return false for non-existing files", () => {
            const mockExists = createMockFs.existsSync(["/a.txt"]);

            assert.strictEqual(mockExists("/c.txt"), false);
        });
    });

    describe("trackWriteFileSync", () => {
        it("should track written files", () => {
            const { written, writeFileSync } = createMockFs.trackWriteFileSync();

            writeFileSync("/output.json", '{"key": "value"}', "utf-8");

            assert.strictEqual(written["/output.json"], '{"key": "value"}');
        });
    });
});

describe("samplePrData", () => {
    it("should have required properties", () => {
        assert.ok(samplePrData.date);
        assert.ok(samplePrData.branch);
        assert.ok(samplePrData.commit);
        assert.ok(samplePrData.commit.hash);
        assert.ok(samplePrData.commit.message);
    });
});

describe("paths", () => {
    it("testFixtures should be a string", () => {
        assert.strictEqual(typeof testFixtures, "string");
    });

    it("sampleLastPrPath should include fixtures directory", () => {
        assert.ok(sampleLastPrPath.includes("fixtures"));
    });
});
