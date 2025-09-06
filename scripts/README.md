# Regression Check Scripts

Manual commands since package.json is write-protected:

## Scripts Available

### Run QA Regression Check
```bash
node scripts/regression-check.mjs
```
**Expected**: 13/13 tests PASS, exit code 0

### Wait for Server
```bash
node scripts/wait-on.mjs [port]
```
**Purpose**: Waits for server health endpoints to be ready

### Manual Verification Flow
```bash
# 1. Type check
npx tsc -p . --noEmit

# 2. Lint (placeholder)
echo "ESLint not configured - skipping"

# 3. QA regression check
node scripts/regression-check.mjs

# Combined verification
npx tsc -p . --noEmit && echo "ESLint not configured - skipping" && node scripts/regression-check.mjs
```

## Intended Package.json Scripts
If package.json were editable, these would be added:

```json
{
  "scripts": {
    "qa:run": "node scripts/regression-check.mjs",
    "typecheck": "tsc -p . --noEmit", 
    "lint": "echo 'ESLint not configured - skipping'",
    "verify": "npm run typecheck && npm run lint && npm run qa:run"
  }
}
```

## Git Workflow (requires manual git commands)

### Create Stable Baseline
```bash
git checkout -b baseline/qa-green-2025-09-06
git tag -a v0.1.0-stable -m "Baseline stable — QA 13/13 PASS at $(date -u). URL: /qa/public"
```

### Feature Development Flow
```bash
git checkout -b feature/<name>
# work on changes
npx tsc -p . --noEmit && node scripts/regression-check.mjs
git push
```

### Rollback to Stable
```bash
git checkout -B hotfix/from-stable v0.1.0-stable
```

### Emergency Bypass (hooks)
```bash
git commit -m "emergency fix" --no-verify
git push --no-verify
```