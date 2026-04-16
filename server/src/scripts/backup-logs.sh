#!/bin/bash
# ─────────────────────────────────────────────────────────────
# Application Logs Backup Script
#
# Archives application log files from the last N days into a
# timestamped tar archive for downstream compression/encryption.
#
# Usage: backup-logs.sh
# Outputs: Absolute path of the backup archive on stdout
#
# @task US_042 TASK_001
# ─────────────────────────────────────────────────────────────
set -euo pipefail

# Load environment file if present (before deriving paths)
if [ -f "${BACKUP_ENV_FILE:-/etc/app/backup.env}" ]; then
  # shellcheck source=/dev/null
  source "${BACKUP_ENV_FILE:-/etc/app/backup.env}"
fi

TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_DIR="${BACKUP_DIR_LOGS:-/var/backups/logs}"
BACKUP_FILE="${BACKUP_DIR}/app-logs-${TIMESTAMP}.tar"
LOG_DIR="${APP_LOG_DIR:-/var/log/app}"
RETENTION_DAYS="${LOG_RETENTION_DAYS:-90}"

# Ensure directories exist
mkdir -p "${BACKUP_DIR}"

# Validate log directory
if [ ! -d "${LOG_DIR}" ]; then
  echo "ERROR: Log directory does not exist: ${LOG_DIR}" >&2
  exit 1
fi

# Find log files modified within retention window and archive them
LOG_FILES=$(find "${LOG_DIR}" -type f -name "*.log" -mtime "-${RETENTION_DAYS}" 2>/dev/null)

if [ -z "${LOG_FILES}" ]; then
  echo "WARNING: No log files found in ${LOG_DIR} within last ${RETENTION_DAYS} days" >&2
  exit 0
fi

# Create tar archive
find "${LOG_DIR}" -type f -name "*.log" -mtime "-${RETENTION_DAYS}" -print0 \
  | tar --null -cf "${BACKUP_FILE}" -T -

# Verify the file is non-empty
if [ ! -s "${BACKUP_FILE}" ]; then
  echo "ERROR: Log backup archive is empty: ${BACKUP_FILE}" >&2
  exit 1
fi

FILE_COUNT=$(echo "${LOG_FILES}" | wc -l)
echo "Log backup completed: ${BACKUP_FILE} (${FILE_COUNT} files)" | logger -t backup-logs
echo "${BACKUP_FILE}"
