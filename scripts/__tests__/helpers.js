/**
 * Test Helpers
 *
 * Common utilities for testing scripts
 */

import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Path to test fixtures directory
 */
export const testFixtures = join(__dirname, "fixtures");

/**
 * Path to sample PR tracking file
 */
export const sampleLastPrPath = join(testFixtures, "sample-last-pr.json");

/**
 * Create a mock for child_process.execSync
 *
 * @param {Object} mocks - Object mapping commands to their mock outputs
 * @returns {Function} Mock execSync function
 *
 * @example
 * const mockExec = mockExecSync({
 *   'git rev-parse HEAD': 'abc123',
 *   'git branch': '* main\n  feature'
 * });
 */
export function mockExecSync(mocks = {}) {
    return (command, options = {}) => {
        const cmd = command.trim();

        if (mocks[cmd] !== undefined) {
            const result = mocks[cmd];
            if (result instanceof Error) {
                throw result;
            }
            return typeof result === "string" ? result : JSON.stringify(result);
        }

        // Check for partial matches (for commands with dynamic parts)
        for (const [pattern, result] of Object.entries(mocks)) {
            if (cmd.startsWith(pattern)) {
                if (result instanceof Error) {
                    throw result;
                }
                return typeof result === "string" ? result : JSON.stringify(result);
            }
        }

        throw new Error(`Unexpected command: ${cmd}`);
    };
}

/**
 * Create mock filesystem operations
 */
export const createMockFs = {
    /**
     * Create a mock for fs.readFileSync
     *
     * @param {Object} files - Object mapping file paths to their contents
     * @returns {Function} Mock readFileSync function
     */
    readFileSync: (files = {}) => {
        return (filePath, encoding) => {
            if (files[filePath] !== undefined) {
                return files[filePath];
            }
            const error = new Error(`ENOENT: no such file or directory, open '${filePath}'`);
            error.code = "ENOENT";
            throw error;
        };
    },

    /**
     * Create a mock for fs.existsSync
     *
     * @param {string[]} existingFiles - Array of file paths that "exist"
     * @returns {Function} Mock existsSync function
     */
    existsSync: (existingFiles = []) => {
        return (filePath) => existingFiles.includes(filePath);
    },

    /**
     * Create a mock for fs.writeFileSync
     * Returns an object to track what was written
     *
     * @returns {Object} Object with mock function and written data
     */
    trackWriteFileSync: () => {
        const written = {};
        return {
            written,
            writeFileSync: (filePath, content, encoding) => {
                written[filePath] = content;
            },
        };
    },
};

/**
 * Sample PR tracking data for tests
 */
export const samplePrData = {
    date: "2025-01-15T10:30:00.000Z",
    branch: "feature/test-branch",
    description: "Test PR description",
    commit: {
        hash: "abc123def456789",
        message: "Test commit message",
    },
};

/**
 * Create a temporary test context with cleanup
 *
 * @param {Function} fn - Test function to run
 * @returns {Promise<void>}
 */
export async function withTestContext(fn) {
    const originals = new Map();

    const stub = (obj, key, value) => {
        originals.set({ obj, key }, obj[key]);
        obj[key] = value;
    };

    const restore = () => {
        for (const [{ obj, key }, value] of originals) {
            obj[key] = value;
        }
        originals.clear();
    };

    try {
        await fn({ stub, restore });
    } finally {
        restore();
    }
}
