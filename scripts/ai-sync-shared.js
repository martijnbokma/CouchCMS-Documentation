/**
 * Shared helpers for ai-sync.js and ai-inventory.js.
 * Optional root file ai-sync.exclude.json: { "skipWrites": ["tabnine", ...] }
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export const SYNC_EXCLUDE_FILENAME = "ai-sync.exclude.json";

/** Must match each writeConfigSynced id in ai-sync.js */
export const SYNC_WRITE_IDS = [
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

const VALID = new Set(SYNC_WRITE_IDS);

/**
 * @param {string} rootDir
 * @returns {Set<string>}
 */
export function loadSkipWrites(rootDir) {
    const p = join(rootDir, SYNC_EXCLUDE_FILENAME);
    if (!existsSync(p)) {
        return new Set();
    }
    try {
        const j = JSON.parse(readFileSync(p, "utf8"));
        const arr = Array.isArray(j.skipWrites) ? j.skipWrites : [];
        return new Set(arr.filter((x) => typeof x === "string" && VALID.has(x)));
    } catch {
        return new Set();
    }
}

/**
 * @param {string} rootDir
 * @param {string[]} ids
 * @returns {string[]}
 */
export function addSkipWrites(rootDir, ids) {
    const toAdd = [...new Set(ids)].filter((x) => VALID.has(x));
    if (toAdd.length === 0) {
        return [];
    }
    const p = join(rootDir, SYNC_EXCLUDE_FILENAME);
    let data = { skipWrites: [] };
    if (existsSync(p)) {
        try {
            data = JSON.parse(readFileSync(p, "utf8"));
        } catch {
            data = { skipWrites: [] };
        }
    }
    if (!Array.isArray(data.skipWrites)) {
        data.skipWrites = [];
    }
    const merged = new Set([...data.skipWrites, ...toAdd]);
    data.skipWrites = [...merged].filter((x) => VALID.has(x)).sort();
    writeFileSync(p, `${JSON.stringify(data, null, 4)}\n`, "utf8");
    return data.skipWrites;
}

/** Directory removed by inventory → sync skip id (if any). */
export const DIR_TO_SYNC_SKIP_ID = {
    ".tabnine": "tabnine",
    ".codewhisperer": "codewhisperer",
};
