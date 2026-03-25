# Documentation Scripts

Automation scripts for managing CouchCMS documentation AI configurations and validation.

## 🤖 AI Configuration Management

### Single Source of Truth

All AI editor configurations are generated from **DOCS-STANDARDS.md**.

```
DOCS-STANDARDS.md (Single Source)
        ↓
    bun run sync
        ↓
All AI Configurations Updated
```

### Optional: `ai-sync.exclude.json`

To **stop** `bun run sync` from writing specific outputs (for example after you removed **`.tabnine`** or **`.codewhisperer`** and do not want them back), add a file at the repository root:

- **Copy** [`ai-sync.exclude.example.json`](../ai-sync.exclude.example.json) to **`ai-sync.exclude.json`** and edit the **`skipWrites`** array.
- **Valid keys** are defined in [`scripts/ai-sync-shared.js`](./ai-sync-shared.js) (`cursorrules`, `claude`, `windsurf`, `copilot`, `vscode`, `tabnine`, `codewhisperer`, `editorconfig`, `cursorIndex`).
- **Or** run **`bun run ai:list -- --remove .tabnine --yes --sync-exclude`** so the folder is deleted and the id is appended in one step.

Commit **`ai-sync.exclude.json`** if the team should share the same skips, or keep it local-only.

### Generated Configurations

Running `bun run sync` generates:

1. **`.cursorrules`** - Cursor AI configuration
2. **`CLAUDE.md`** - Claude AI instructions
3. **`.windsurfrules`** - Windsurf AI configuration
4. **`.github/copilot-instructions.md`** - GitHub Copilot
5. **`.vscode/settings.json`** - VS Code settings
6. **`.tabnine/settings.json`** - Tabnine configuration
7. **`.codewhisperer/settings.json`** - Amazon CodeWhisperer
8. **`.editorconfig`** - Universal editor config
9. **`.cursor/AI-CONFIG-INDEX.md`** - Configuration index

## 📜 Available Scripts

### `bun run sync`
Generate all AI configurations from DOCS-STANDARDS.md

**When to use:**
- After editing DOCS-STANDARDS.md
- After git clone (runs automatically via postinstall)
- Before committing AI config changes

**Example:**
```bash
# Edit standards
vim DOCS-STANDARDS.md

# Sync all configurations
bun run sync

# Commit changes
git add .
git commit -m "Update documentation standards"
```

### `bun run ai:list`

Lists **which AI/editor directories** exist at the repository root (for example **`.tabnine`**, **`.codewhisperer`**, **`.giga`**, **`.vibe`**, **`.agents`**, skills installs) and shows **synced** root files (`.cursorrules`, `CLAUDE.md`, …). Unknown dot-directories are listed under “Other”. Use **`--json`** for machine-readable output.

**Remove** optional folders only (never `.cursor` / `.vscode` / `.github` whole-tree): dry-run first, then confirm with **`--yes`**:

```bash
bun run ai:list
bun run ai:list -- --json
bun run ai:list -- --remove .giga .vibe --dry-run
bun run ai:list -- --remove .giga --yes
```

If you delete **`.tabnine`** or **`.codewhisperer`** without updating **`ai-sync.exclude.json`**, **`bun run sync`** will recreate them. Use **`--sync-exclude`** on remove, or edit **`ai-sync.exclude.json`** (see **Optional: ai-sync.exclude.json** above).

**Interactive (checkbox, arrows + space):** `bun run ai:list -- --interactive` (alias: **`bun run ai:pick`**). Only lists **removable** folders that **exist** on disk. Use **`--interactive --dry-run`** to preview without deleting.

**Script:** [`ai-inventory.js`](./ai-inventory.js) · shared keys: [`ai-sync-shared.js`](./ai-sync-shared.js) · uses [**@inquirer/prompts**](https://github.com/SBoudrias/Inquirer.js) for `--interactive`

### `bun run ai` (unified)

Runs [`ai-check.js`](./ai-check.js):

1. **`bun run sync`** — regenerate configs from DOCS-STANDARDS.md
2. **Verify** `skills/couchcms-documentation/SKILL.md` (YAML `name` + `description`)
3. **`bun run validate`** — documentation checks

**When to use:** Before a PR or whenever you want the full AI-tooling pipeline (same as **`bun run ai:update`**).

```bash
bun run ai
```

### `bun run validate`
Validate all documentation files against standards

**Checks:**
- ✅ Frontmatter presence and completeness
- ✅ Title length: warns per file if over 60 characters; **aggregate notice** if many pages have titles under 50 characters (STYLEGUIDE SEO target 50–60)
- ✅ Heading hierarchy (no skipped levels)
- ✅ Code block formatting
- ✅ Link structure (trailing slashes)
- ✅ English-only content
- ✅ Documentation quality

**Example:**
```bash
# Validate all docs
bun run validate

# Output example:
# 🔍 Validating CouchCMS Documentation...
#
# Found 150 documentation files
#
# 📊 Validation Summary
# Total files:    150
# Passed:         145 ✅
# With warnings:  5 ⚠️
# Errors:         0 ❌
```

### `bun run ai:update`
Sync AI configs AND validate documentation (combined)

**When to use:**
- Before deploying documentation
- After major documentation changes
- During CI/CD pipeline

**Example:**
```bash
bun run ai:update
```

## 🔄 Workflow Examples

### Updating Documentation Standards

```bash
# 1. Edit the single source of truth
vim DOCS-STANDARDS.md

# 2. Sync to all AI tools
bun run sync

# 3. Validate existing docs still comply
bun run validate

# 4. Commit if all passes
git add .
git commit -m "Update: stricter code block titles"
```

### Creating New Documentation

```bash
# 1. Use AI to create content
# @.cursor/prompts/convert-to-markdown.md
# Convert this content about [topic]

# 2. Validate the new file
bun run validate

# 3. Fix any issues reported
# 4. Re-validate
bun run validate
```

### Team Onboarding

```bash
# 1. Clone repository
git clone <repo>

# 2. Install dependencies (auto-syncs)
bun install

# 3. All AI tools are configured!
# Start using Cursor, Claude, Copilot, etc.
```

## 🎯 Script Details

### ai-sync.js

**Purpose:** Generate all AI configurations from single source

**Input:** `DOCS-STANDARDS.md`

**Output:** 9 configuration files for different AI tools

**Process:**
1. Read DOCS-STANDARDS.md
2. Generate base rules content
3. Create tool-specific configurations
4. Write files with proper formatting
5. Report success/failures

**Error Handling:**
- Exits if DOCS-STANDARDS.md missing
- Creates directories if needed
- Reports each file generated
- Returns exit code 0 on success

### docs-validate.js

**Purpose:** Validate documentation quality and compliance

**Input:** All `.md` and `.mdx` files in `src/content/docs/`

**Output:** Validation report with errors and warnings

**Validators:**
1. **Frontmatter Validator**
   - Checks presence and format
   - Validates required fields
   - Checks title length (10-70 chars)
   - Checks description length (100-170 chars)

2. **Heading Hierarchy Validator**
   - Ensures no skipped levels
   - Reports H2→H4 skips

3. **Code Block Validator**
   - Checks for descriptive titles
   - Reports blocks without titles

4. **Link Validator**
   - Checks internal links have trailing slashes
   - Reports non-descriptive link text

5. **Language Validator**
   - Checks for Dutch words
   - Enforces English-only content

**Exit Codes:**
- `0` - All validations passed
- `1` - Errors found or no files found

## 🚨 Common Issues

### Issue: Sync script fails

**Cause:** DOCS-STANDARDS.md missing or invalid

**Solution:**
```bash
# Ensure file exists
ls -la DOCS-STANDARDS.md

# Check file content is valid
cat DOCS-STANDARDS.md
```

### Issue: Validation reports Dutch words

**Cause:** Non-English content detected

**Solution:**
1. Review reported words
2. Translate to English
3. Re-validate

### Issue: Missing trailing slashes

**Cause:** Internal links without `/` at end

**Solution:**
```markdown
❌ [Link](./page)
✅ [Link](./page/)
```

### Issue: Skipped heading levels

**Cause:** H2 followed by H4

**Solution:**
```markdown
❌ ## Section
   #### Subsection

✅ ## Section
   ### Subsection
```

## 🔧 Customization

### Adding New AI Tool

Edit `scripts/ai-sync.js`:

```javascript
// Add new tool configuration
const newToolConfig = {
    "custom": "configuration",
    "instructions": baseRules
};

writeConfig(
    join(rootDir, '.newtool', 'config.json'),
    JSON.stringify(newToolConfig, null, 4),
    '.newtool/config.json (New Tool)'
);
```

### Adding New Validation

Edit `scripts/docs-validate.js`:

```javascript
// Add new validator function
function validateNewRule(content, file) {
    const issues = [];
    // Your validation logic
    return issues;
}

// Add to validateFile function
fileIssues.push(...validateNewRule(content, relativePath));
```

## 📊 CI/CD Integration

### GitHub Actions Example

```yaml
name: Validate Documentation

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - run: bun install --frozen-lockfile
      - run: bun run validate
      - run: bun run build
```

## 🎓 Best Practices

1. **Always sync after editing standards**
   ```bash
   vim DOCS-STANDARDS.md
   bun run sync
   ```

2. **Validate before committing**
   ```bash
   bun run validate
   git add .
   git commit -m "Update docs"
   ```

3. **Use ai:update for comprehensive checks**
   ```bash
   bun run ai:update
   ```

4. **Never edit generated files directly**
   - Edit DOCS-STANDARDS.md
   - Run `bun run sync`
   - Generated files update automatically

5. **Check validation output**
   - Fix all errors (❌)
   - Address warnings (⚠️) when possible
   - Info messages (ℹ️) are optional

## 📝 Notes

- Scripts use ES Modules (Node.js 14+)
- Cross-platform compatible
- Safe to run multiple times
- Idempotent operations
- No external dependencies required

---

**For complete documentation system information, see [AI-TOOLKIT.md](../AI-TOOLKIT.md)**

