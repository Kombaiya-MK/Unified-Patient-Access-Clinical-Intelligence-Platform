#!/bin/bash
# ─────────────────────────────────────────────────────────────
# PostgreSQL Backup Script
#
# Performs a full pg_dump with --format=custom (best compression)
# and writes to the postgresql backup directory.
#
# Usage: backup-postgresql.sh
# Outputs: Absolute path of the backup file on stdout
#
# @task US_042 TASK_001
# ─────────────────────────────────────────────────────────────
set -euo pipefail

# Load database credentials from environment file if present (before deriving paths)
if [ -f "${BACKUP_ENV_FILE:-/etc/app/backup.env}" ]; then
  # shellcheck source=/dev/null
  source "${BACKUP_ENV_FILE:-/etc/app/backup.env}"
fi

TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_DIR="${BACKUP_DIR_PG:-/var/backups/postgresql}"
BACKUP_FILE="${BACKUP_DIR}/backup-${TIMESTAMP}.dump"

# Ensure directory exists
mkdir -p "${BACKUP_DIR}"

# Validate required variables
: "${DB_HOST:?DB_HOST is required}"
: "${DB_PORT:?DB_PORT is required}"
: "${DB_NAME:?DB_NAME is required}"
: "${DB_USER:?DB_USER is required}"

# Perform pg_dump with custom format
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

# Verify the dump file was created and is non-empty
if [ ! -s "${BACKUP_FILE}" ]; then
  echo "ERROR: Backup file is empty or missing: ${BACKUP_FILE}" >&2
  exit 1
fi

echo "PostgreSQL backup completed: ${BACKUP_FILE}" | logger -t backup-postgresql
echo "${BACKUP_FILE}"
