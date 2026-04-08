# Bug Fix Task - BUG_BACKUP_001

## Bug Report Reference

- Bug ID: BUG_BACKUP_001
- Source: `.propel/context/tasks/EP-008/us_042/reviews/task-review-task_001.md` (Fix Plan #1-#3)

## Bug Summary

### Issue Classification

- **Priority**: Medium
- **Severity**: Potential data-loss risk (silent backup failure) + missing test coverage
- **Affected Version**: Current HEAD on `feature/us005-us008-monitoring-db-audit`
- **Environment**: Linux (bash scripts), Node.js 20.x LTS, PostgreSQL 15.x

### Steps to Reproduce

1. Configure `backup.env` with an **invalid** DB_PASSWORD or point to a non-existent database.
2. Run `bash server/src/scripts/backup-postgresql.sh`.
3. **Expected**: Script exits with non-zero code; orchestrator retry logic triggers.
4. **Actual**: pg_dump fails but `|| true` on line 44 suppresses the exit code. If pg_dump creates a non-empty but corrupt dump file (partial write), the file-size guard on line 48 passes successfully. The orchestrator logs success and pushes positive Prometheus metrics for a corrupt backup.

**Error Output**:

```text
# No error output — the || true silences pg_dump's non-zero exit code.
# The 2>&1 | logger pipe captures stderr but does not propagate the exit status.
# set -euo pipefail is active, but the || true defeats pipefail for this specific command.
```

### Root Cause Analysis

- **File**: `server/src/scripts/backup-postgresql.sh:44`
- **Component**: PostgreSQL backup shell script
- **Function**: pg_dump pipeline
- **Cause**: The command `pg_dump ... 2>&1 | logger -t backup-postgresql || true` has two compounding issues:
  1. **`|| true`** — Regardless of the exit code from the pipeline, the command always succeeds. With `set -e` active, this means script execution continues even when pg_dump returns a non-zero exit code.
  2. **Pipe to logger without `pipefail` propagation** — While `set -o pipefail` *is* set, the `|| true` at the end overrides the pipeline's exit status. The `PIPESTATUS[0]` (pg_dump's actual exit code) is never checked.
  3. **Secondary guard insufficient** — The file-size check (`[ ! -s "${BACKUP_FILE}" ]`) on line 48 catches cases where pg_dump writes nothing, but does NOT catch corrupted/partial dumps where some bytes were written before failure.

**Why not caught earlier:** No automated tests exist for the shell scripts or TypeScript modules. The implementation was validated only by TypeScript compilation, not by functional execution tests.

### Impact Assessment

- **Affected Features**: PostgreSQL automated backup pipeline, backup orchestrator success/failure detection, Prometheus metrics accuracy
- **User Impact**: Operations team may receive false-positive success metrics for PostgreSQL backups. Corrupt backups discovered only at restore time.
- **Data Integrity Risk**: Yes — corrupt backup files could be compressed, encrypted, and stored as if valid. Restore from these files would fail.
- **Security Implications**: None directly, but failed backups reduce disaster recovery posture.

## Fix Overview

Three-part fix addressing the review's Fix Plan items:

1. **Remove `|| true` from pg_dump pipeline** in `backup-postgresql.sh` — Capture pg_dump's exit code explicitly, fail fast on non-zero, and add dump integrity verification with `pg_restore --list`.
2. **Add unit tests for `KMSKeyManager`** — Test key generation, rotation, age checking, and integrity verification using temporary directories and mock filesystem operations.
3. **Add unit tests for `backup-orchestrator` `parseArgs()`** — Test CLI argument parsing, validation, and default behavior.

## Fix Dependencies

- Jest must be configured in `server/` (test infrastructure exists at `server/tests/unit/` but `npm test` is not wired up — tests can still be run directly with `npx jest`)
- No new npm dependencies required

## Impacted Components

### Backend (Shell Scripts)

- `server/src/scripts/backup-postgresql.sh` — MODIFY: Remove `|| true`, add explicit exit code check and dump integrity verification

### Backend (TypeScript Tests)

- `server/tests/unit/kms-key-manager.test.ts` — CREATE: Unit tests for KMSKeyManager class
- `server/tests/unit/backup-orchestrator.test.ts` — CREATE: Unit tests for parseArgs() and pushMetrics()

## Expected Changes

| Action | File Path | Description |
|--------|-----------|-------------|
| MODIFY | `server/src/scripts/backup-postgresql.sh` | Remove `\|\| true` from pg_dump pipeline, add explicit PIPESTATUS check, add `pg_restore --list` integrity verification |
| CREATE | `server/tests/unit/kms-key-manager.test.ts` | Unit tests: generateKey, rotateKey, checkKeyAge, shouldRotate, verifyKeyIntegrity |
| CREATE | `server/tests/unit/backup-orchestrator.test.ts` | Unit tests: parseArgs with --type=postgresql, invalid type, no args default |

## Implementation Plan

1. **Fix pg_dump error suppression** (`backup-postgresql.sh`):
   - Remove `|| true` from the pg_dump pipeline on line 44
   - Separate pg_dump execution from logging: run pg_dump first writing to file, then log success/failure
   - Add explicit exit code check: `if [ $? -ne 0 ]; then echo "ERROR: pg_dump failed" >&2; exit 1; fi`
   - Add dump integrity check: `pg_restore --list "${BACKUP_FILE}" > /dev/null 2>&1` to verify the dump is a valid custom-format archive
   - Keep existing file-size check as a secondary guard

   ```bash
   # Replace lines 35-44 with:
   PGPASSWORD="${DB_PASSWORD:-}" pg_dump \
     -U "${DB_USER}" \
     -h "${DB_HOST}" \
     -p "${DB_PORT}" \
     -d "${DB_NAME}" \
     --format=custom \
     --file="${BACKUP_FILE}" \
     --verbose \
     --no-password 2>&1 | logger -t backup-postgresql

   PG_EXIT=${PIPESTATUS[0]}
   if [ "${PG_EXIT}" -ne 0 ]; then
     echo "ERROR: pg_dump failed with exit code ${PG_EXIT}" >&2
     rm -f "${BACKUP_FILE}"
     exit 1
   fi
   ```

2. **Create KMSKeyManager tests** (`server/tests/unit/kms-key-manager.test.ts`):
   - Use `os.tmpdir()` + `crypto.randomUUID()` for isolated test directories
   - Test `generateKey()`: verify file exists, size is 32 bytes
   - Test `rotateKey()`: verify old key archived, new key generated, rotation log appended
   - Test `checkKeyAge()`: verify returns 0 for fresh key, throws when key missing
   - Test `shouldRotate()`: verify returns false for fresh key, true when key missing
   - Test `verifyKeyIntegrity()`: verify true when valid key, false when missing
   - Clean up temp directories in afterEach

3. **Create backup-orchestrator tests** (`server/tests/unit/backup-orchestrator.test.ts`):
   - Mock `process.argv` to test `parseArgs()`
   - Test `--type=postgresql` returns `['postgresql']`
   - Test `--type=invalid` calls `process.exit(1)`
   - Test no args returns `['postgresql', 'redis', 'logs']`

## Regression Prevention Strategy

- [ ] Unit test: pg_dump failure propagation — verify script exits non-zero when pg_dump fails
- [ ] Unit test: KMSKeyManager.generateKey() creates correct key size and permissions
- [ ] Unit test: KMSKeyManager.rotateKey() archives old key and generates new
- [ ] Unit test: KMSKeyManager.checkKeyAge() returns days since creation
- [ ] Unit test: KMSKeyManager.shouldRotate() respects 365-day threshold
- [ ] Unit test: parseArgs() correctly parses --type flag
- [ ] Unit test: parseArgs() validates backup type enum

## Rollback Procedure

1. Revert `backup-postgresql.sh` to restore `|| true` (one-line change)
2. Delete test files — no production code impact
3. Verify: run `npx tsc --noEmit` in `server/` to confirm build is clean

## External References

- [PostgreSQL pg_dump exit codes](https://www.postgresql.org/docs/15/app-pgdump.html) — pg_dump returns 0 on success, non-zero on failure
- [Bash pipefail](https://www.gnu.org/software/bash/manual/bash.html#Pipelines) — `set -o pipefail` makes pipeline return rightmost non-zero exit, but `|| true` overrides
- [pg_restore --list](https://www.postgresql.org/docs/15/app-pgrestore.html) — validates custom-format dump integrity without restoring

## Build Commands

```bash
cd server

# Verify TypeScript compilation after changes
npx tsc --noEmit

# Run unit tests (if Jest is configured)
npx jest tests/unit/kms-key-manager.test.ts --verbose
npx jest tests/unit/backup-orchestrator.test.ts --verbose

# Verify shell script syntax
bash -n src/scripts/backup-postgresql.sh
```

## Implementation Validation Strategy

- [ ] `backup-postgresql.sh` no longer contains `|| true` on the pg_dump line
- [ ] PIPESTATUS check is present after pg_dump pipeline
- [ ] Corrupt/empty backup file is cleaned up on pg_dump failure
- [ ] TypeScript compilation passes: `npx tsc --noEmit` = 0 errors
- [ ] KMSKeyManager unit tests pass: generateKey, rotateKey, checkKeyAge, shouldRotate, verifyKeyIntegrity
- [ ] Backup orchestrator unit tests pass: parseArgs with valid, invalid, and missing --type flag
- [ ] Existing tests unaffected: no regressions in `server/tests/unit/`

## Implementation Checklist

- [x] Remove `|| true` from pg_dump pipeline in `backup-postgresql.sh` line 44
- [x] Add `PIPESTATUS[0]` exit code check after pg_dump
- [x] Add cleanup (`rm -f`) of partial dump file on failure
- [x] Create `server/tests/unit/kms-key-manager.test.ts` with 5+ test cases
- [x] Create `server/tests/unit/backup-orchestrator.test.ts` with 3+ test cases
- [x] Verify `bash -n backup-postgresql.sh` passes (syntax check)
- [x] Verify `npx tsc --noEmit` passes with 0 errors
- [x] Run all new unit tests and confirm passing
