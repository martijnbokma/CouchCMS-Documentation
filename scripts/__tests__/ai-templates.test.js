/**
 * Tests for AI Configuration Templates
 * @module scripts/__tests__/ai-templates.test
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import {
    createBaseRules,
    getEditorConfig,
    createAiToolkitIndex,
    getVscodeSettings,
    createTabnineConfig,
    createCodewhispererConfig,
} from "../lib/ai-templates.js";

describe("createBaseRules", () => {
    it("should return a string", () => {
        const result = createBaseRules("2025-01-15");
        assert.strictEqual(typeof result, "string");
    });

    it("should return non-empty content", () => {
        const result = createBaseRules("2025-01-15");
        assert.ok(result.length > 0);
    });

    it("should include the date in the output", () => {
        const testDate = "2025-03-25";
        const result = createBaseRules(testDate);
        assert.ok(result.includes(testDate));
    });

    it("should include 'CouchCMS Documentation Standards' header", () => {
        const result = createBaseRules("2025-01-15");
        assert.ok(result.includes("CouchCMS Documentation Standards"));
    });

    it("should include 'Project Context' section", () => {
        const result = createBaseRules("2025-01-15");
        assert.ok(result.includes("## Project Context"));
    });

    it("should include 'Core Principles' section", () => {
        const result = createBaseRules("2025-01-15");
        assert.ok(result.includes("## Core Principles"));
    });

    it("should include 'Essential Formatting Rules' section", () => {
        const result = createBaseRules("2025-01-15");
        assert.ok(result.includes("## Essential Formatting Rules"));
    });

    it("should include 'Quality Checklist' section", () => {
        const result = createBaseRules("2025-01-15");
        assert.ok(result.includes("## Quality Checklist"));
    });

    it("should include 'AI Tools Available' section", () => {
        const result = createBaseRules("2025-01-15");
        assert.ok(result.includes("## AI Tools Available"));
    });

    it("should include 'Common Patterns' section", () => {
        const result = createBaseRules("2025-01-15");
        assert.ok(result.includes("## Common Patterns"));
    });

    it("should include 'Error Prevention' section", () => {
        const result = createBaseRules("2025-01-15");
        assert.ok(result.includes("## Error Prevention"));
    });

    it("should include 'Single Source of Truth' reference", () => {
        const result = createBaseRules("2025-01-15");
        assert.ok(result.includes("Single Source of Truth"));
    });

    it("should include STYLEGUIDE.md reference", () => {
        const result = createBaseRules("2025-01-15");
        assert.ok(result.includes("STYLEGUIDE.md"));
    });

    it("should include DOCS-STANDARDS.md reference", () => {
        const result = createBaseRules("2025-01-15");
        assert.ok(result.includes("DOCS-STANDARDS.md"));
    });

    it("should include the date in the 'Last updated' line at the end", () => {
        const testDate = "2025-12-31";
        const result = createBaseRules(testDate);
        // The date appears in the last content line: "Generated from DOCS-STANDARDS.md - Last updated: DATE"
        assert.ok(result.includes(`Last updated: ${testDate}`));
        assert.ok(result.includes("Generated from DOCS-STANDARDS.md"));
    });
});

describe("getEditorConfig", () => {
    it("should return a string", () => {
        const result = getEditorConfig();
        assert.strictEqual(typeof result, "string");
    });

    it("should return non-empty content", () => {
        const result = getEditorConfig();
        assert.ok(result.length > 0);
    });

    it("should include 'root = true'", () => {
        const result = getEditorConfig();
        assert.ok(result.includes("root = true"));
    });

    it("should include charset setting", () => {
        const result = getEditorConfig();
        assert.ok(result.includes("charset = utf-8"));
    });

    it("should include end_of_line setting", () => {
        const result = getEditorConfig();
        assert.ok(result.includes("end_of_line = lf"));
    });

    it("should include indent_style setting", () => {
        const result = getEditorConfig();
        assert.ok(result.includes("indent_style = space"));
    });

    it("should include indent_size = 4 for default", () => {
        const result = getEditorConfig();
        assert.ok(result.includes("indent_size = 4"));
    });

    it("should include indent_size = 2 for JSON/YAML", () => {
        const result = getEditorConfig();
        assert.ok(result.includes("[*.{json,yml,yaml}]"));
        assert.ok(result.includes("indent_size = 2"));
    });

    it("should include md/mdx file settings", () => {
        const result = getEditorConfig();
        assert.ok(result.includes("[*.{md,mdx}]"));
    });

    it("should include max_line_length for markdown", () => {
        const result = getEditorConfig();
        assert.ok(result.includes("max_line_length = 80"));
    });

    it("should include trim_trailing_whitespace setting", () => {
        const result = getEditorConfig();
        assert.ok(result.includes("trim_trailing_whitespace = true"));
    });

    it("should include insert_final_newline setting", () => {
        const result = getEditorConfig();
        assert.ok(result.includes("insert_final_newline = true"));
    });

    it("should include TypeScript/JavaScript settings", () => {
        const result = getEditorConfig();
        assert.ok(result.includes("[*.{ts,js,mjs}]"));
    });
});

describe("createAiToolkitIndex", () => {
    it("should return a string", () => {
        const result = createAiToolkitIndex("2025-01-15T10:30:00.000Z");
        assert.strictEqual(typeof result, "string");
    });

    it("should return non-empty content", () => {
        const result = createAiToolkitIndex("2025-01-15T10:30:00.000Z");
        assert.ok(result.length > 0);
    });

    it("should include the ISO date in the output", () => {
        const testDate = "2025-03-25T14:30:00.000Z";
        const result = createAiToolkitIndex(testDate);
        assert.ok(result.includes(testDate));
    });

    it("should include 'AI Configuration Index' header", () => {
        const result = createAiToolkitIndex("2025-01-15T10:30:00.000Z");
        assert.ok(result.includes("# AI Configuration Index"));
    });

    it("should include 'Generated Files' section", () => {
        const result = createAiToolkitIndex("2025-01-15T10:30:00.000Z");
        assert.ok(result.includes("## Generated Files"));
    });

    it("should include 'Single Source of Truth' section", () => {
        const result = createAiToolkitIndex("2025-01-15T10:30:00.000Z");
        assert.ok(result.includes("## Single Source of Truth"));
    });

    it("should include 'Manual Tools' section", () => {
        const result = createAiToolkitIndex("2025-01-15T10:30:00.000Z");
        assert.ok(result.includes("## Manual Tools"));
    });

    it("should include 'Last Sync' section", () => {
        const result = createAiToolkitIndex("2025-01-15T10:30:00.000Z");
        assert.ok(result.includes("## Last Sync"));
    });

    it("should reference .cursorrules", () => {
        const result = createAiToolkitIndex("2025-01-15T10:30:00.000Z");
        assert.ok(result.includes(".cursorrules"));
    });

    it("should reference CLAUDE.md", () => {
        const result = createAiToolkitIndex("2025-01-15T10:30:00.000Z");
        assert.ok(result.includes("CLAUDE.md"));
    });

    it("should reference .windsurfrules", () => {
        const result = createAiToolkitIndex("2025-01-15T10:30:00.000Z");
        assert.ok(result.includes(".windsurfrules"));
    });

    it("should reference GitHub Copilot instructions", () => {
        const result = createAiToolkitIndex("2025-01-15T10:30:00.000Z");
        assert.ok(result.includes(".github/copilot-instructions.md"));
    });

    it("should reference .editorconfig", () => {
        const result = createAiToolkitIndex("2025-01-15T10:30:00.000Z");
        assert.ok(result.includes(".editorconfig"));
    });

    it("should reference bun run sync command", () => {
        const result = createAiToolkitIndex("2025-01-15T10:30:00.000Z");
        assert.ok(result.includes("bun run sync"));
    });

    it("should reference bun run ai command", () => {
        const result = createAiToolkitIndex("2025-01-15T10:30:00.000Z");
        assert.ok(result.includes("bun run ai"));
    });

    it("should include DOCS-STANDARDS.md reference", () => {
        const result = createAiToolkitIndex("2025-01-15T10:30:00.000Z");
        assert.ok(result.includes("DOCS-STANDARDS.md"));
    });
});

describe("getVscodeSettings", () => {
    it("should return an object", () => {
        const result = getVscodeSettings();
        assert.strictEqual(typeof result, "object");
        assert.ok(result !== null);
    });

    it("should be valid JSON serializable", () => {
        const result = getVscodeSettings();
        assert.doesNotThrow(() => JSON.stringify(result));
    });

    it("should include files.associations setting", () => {
        const result = getVscodeSettings();
        assert.ok(Object.hasOwn(result, "files.associations"));
    });

    it("should associate .mdx files with mdx", () => {
        const result = getVscodeSettings();
        assert.strictEqual(result["files.associations"]["*.mdx"], "mdx");
    });

    it("should associate .mdc files with markdown", () => {
        const result = getVscodeSettings();
        assert.strictEqual(result["files.associations"]["*.mdc"], "markdown");
    });

    it("should include editor.formatOnSave setting", () => {
        const result = getVscodeSettings();
        assert.ok(Object.hasOwn(result, "editor.formatOnSave"));
        assert.strictEqual(result["editor.formatOnSave"], true);
    });

    it("should include editor.defaultFormatter setting", () => {
        const result = getVscodeSettings();
        assert.ok(Object.hasOwn(result, "editor.defaultFormatter"));
    });

    it("should include [markdown] settings", () => {
        const result = getVscodeSettings();
        assert.ok(Object.hasOwn(result, "[markdown]"));
    });

    it("should include [mdx] settings", () => {
        const result = getVscodeSettings();
        assert.ok(Object.hasOwn(result, "[mdx]"));
    });

    it("should include markdown.validate.enabled setting", () => {
        const result = getVscodeSettings();
        assert.ok(Object.hasOwn(result, "markdown.validate.enabled"));
        assert.strictEqual(result["markdown.validate.enabled"], true);
    });

    it("should include markdown.updateLinksOnFileMove.enabled setting", () => {
        const result = getVscodeSettings();
        assert.ok(Object.hasOwn(result, "markdown.updateLinksOnFileMove.enabled"));
        assert.strictEqual(result["markdown.updateLinksOnFileMove.enabled"], "always");
    });

    it("should include cSpell.enabled setting", () => {
        const result = getVscodeSettings();
        assert.ok(Object.hasOwn(result, "cSpell.enabled"));
        assert.strictEqual(result["cSpell.enabled"], true);
    });

    it("should include cSpell.language setting", () => {
        const result = getVscodeSettings();
        assert.ok(Object.hasOwn(result, "cSpell.language"));
        assert.strictEqual(result["cSpell.language"], "en");
    });

    it("should include cSpell.words array", () => {
        const result = getVscodeSettings();
        assert.ok(Object.hasOwn(result, "cSpell.words"));
        assert.ok(Array.isArray(result["cSpell.words"]));
    });

    it("should include CouchCMS in cSpell.words", () => {
        const result = getVscodeSettings();
        assert.ok(result["cSpell.words"].includes("CouchCMS"));
    });

    it("should include Starlight in cSpell.words", () => {
        const result = getVscodeSettings();
        assert.ok(result["cSpell.words"].includes("Starlight"));
    });

    it("should include Astro in cSpell.words", () => {
        const result = getVscodeSettings();
        assert.ok(result["cSpell.words"].includes("Astro"));
    });

    it("should include mdx in cSpell.words", () => {
        const result = getVscodeSettings();
        assert.ok(result["cSpell.words"].includes("mdx"));
    });

    it("should include frontmatter in cSpell.words", () => {
        const result = getVscodeSettings();
        assert.ok(result["cSpell.words"].includes("frontmatter"));
    });
});

describe("createTabnineConfig", () => {
    it("should return an object", () => {
        const result = createTabnineConfig("test rules");
        assert.strictEqual(typeof result, "object");
        assert.ok(result !== null);
    });

    it("should be valid JSON serializable", () => {
        const result = createTabnineConfig("test rules");
        assert.doesNotThrow(() => JSON.stringify(result));
    });

    it("should include team_learning setting", () => {
        const result = createTabnineConfig("test rules");
        assert.ok(Object.hasOwn(result, "team_learning"));
        assert.strictEqual(result.team_learning, false);
    });

    it("should include local_mode setting", () => {
        const result = createTabnineConfig("test rules");
        assert.ok(Object.hasOwn(result, "local_mode"));
        assert.strictEqual(result.local_mode, true);
    });

    it("should include instructions setting", () => {
        const result = createTabnineConfig("test rules");
        assert.ok(Object.hasOwn(result, "instructions"));
    });

    it("should include the base rules in instructions", () => {
        const testRules = "These are my custom rules";
        const result = createTabnineConfig(testRules);
        assert.strictEqual(result.instructions, testRules);
    });

    it("should preserve empty string instructions", () => {
        const result = createTabnineConfig("");
        assert.strictEqual(result.instructions, "");
    });

    it("should preserve multiline instructions", () => {
        const multilineRules = "Line 1\nLine 2\nLine 3";
        const result = createTabnineConfig(multilineRules);
        assert.strictEqual(result.instructions, multilineRules);
    });

    it("should have exactly 3 keys", () => {
        const result = createTabnineConfig("test");
        const keys = Object.keys(result);
        assert.strictEqual(keys.length, 3);
    });
});

describe("createCodewhispererConfig", () => {
    it("should return an object", () => {
        const result = createCodewhispererConfig("test rules");
        assert.strictEqual(typeof result, "object");
        assert.ok(result !== null);
    });

    it("should be valid JSON serializable", () => {
        const result = createCodewhispererConfig("test rules");
        assert.doesNotThrow(() => JSON.stringify(result));
    });

    it("should include customizations array", () => {
        const result = createCodewhispererConfig("test rules");
        assert.ok(Object.hasOwn(result, "customizations"));
        assert.ok(Array.isArray(result.customizations));
    });

    it("should have exactly one customization", () => {
        const result = createCodewhispererConfig("test rules");
        assert.strictEqual(result.customizations.length, 1);
    });

    it("should include name in customization", () => {
        const result = createCodewhispererConfig("test rules");
        assert.ok(Object.hasOwn(result.customizations[0], "name"));
        assert.strictEqual(result.customizations[0].name, "CouchCMS Documentation Standards");
    });

    it("should include description in customization", () => {
        const result = createCodewhispererConfig("test rules");
        assert.ok(Object.hasOwn(result.customizations[0], "description"));
        assert.strictEqual(result.customizations[0].description, "Documentation writing standards for CouchCMS");
    });

    it("should include instructions in customization", () => {
        const result = createCodewhispererConfig("test rules");
        assert.ok(Object.hasOwn(result.customizations[0], "instructions"));
    });

    it("should include the base rules in instructions", () => {
        const testRules = "Custom CodeWhisperer rules";
        const result = createCodewhispererConfig(testRules);
        assert.strictEqual(result.customizations[0].instructions, testRules);
    });

    it("should preserve empty string instructions", () => {
        const result = createCodewhispererConfig("");
        assert.strictEqual(result.customizations[0].instructions, "");
    });

    it("should preserve multiline instructions", () => {
        const multilineRules = "Rule 1\nRule 2\nRule 3";
        const result = createCodewhispererConfig(multilineRules);
        assert.strictEqual(result.customizations[0].instructions, multilineRules);
    });

    it("should have exactly 3 keys in customization object", () => {
        const result = createCodewhispererConfig("test");
        const keys = Object.keys(result.customizations[0]);
        assert.strictEqual(keys.length, 3);
    });
});

describe("Integration tests", () => {
    it("should create valid Tabnine config from createBaseRules output", () => {
        const baseRules = createBaseRules("2025-01-15");
        const config = createTabnineConfig(baseRules);

        assert.strictEqual(config.instructions, baseRules);
        assert.ok(JSON.stringify(config).includes("CouchCMS Documentation Standards"));
    });

    it("should create valid CodeWhisperer config from createBaseRules output", () => {
        const baseRules = createBaseRules("2025-01-15");
        const config = createCodewhispererConfig(baseRules);

        assert.strictEqual(config.customizations[0].instructions, baseRules);
        assert.ok(JSON.stringify(config).includes("CouchCMS Documentation Standards"));
    });

    it("should produce consistent output for same date input", () => {
        const date = "2025-06-15";
        const result1 = createBaseRules(date);
        const result2 = createBaseRules(date);

        assert.strictEqual(result1, result2);
    });

    it("should produce consistent output for same ISO date input", () => {
        const isoDate = "2025-06-15T12:00:00.000Z";
        const result1 = createAiToolkitIndex(isoDate);
        const result2 = createAiToolkitIndex(isoDate);

        assert.strictEqual(result1, result2);
    });

    it("should produce different output for different dates", () => {
        const result1 = createBaseRules("2025-01-01");
        const result2 = createBaseRules("2025-12-31");

        assert.notStrictEqual(result1, result2);
    });
});
