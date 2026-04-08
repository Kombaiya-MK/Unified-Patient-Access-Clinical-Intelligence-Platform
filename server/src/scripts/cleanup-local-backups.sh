#!/bin/bash
# ─────────────────────────────────────────────────────────────
# Local Backup Cleanup Script
#
# Removes encrypted backup files older than the configured
# retention period (default: 7 days). Runs after backups have
# been verified or offloaded to offsite storage.
#
# Usage: cleanup-local-backups.sh
#
# @task US_042 TASK_001
# ─────────────────────────────────────────────────────────────
set -euo pipefail

# Load environment file if present
if [ -f "${BACKUP_ENV_FILE:-/etc/app/backup.env}" ]; then
  # shellcheck source=/dev/null
  source "${BACKUP_ENV_FILE:-/etc/app/backup.env}"
fi

RETENTION_DAYS="${LOCAL_RETENTION_DAYS:-7}"
ENCRYPTED_DIR="${BACKUP_DIR_ENCRYPTED:-/var/backups/encrypted}"
POSTGRES_DIR="${BACKUP_DIR_POSTGRES:-/var/backups/postgresql}"
REDIS_DIR="${BACKUP_DIR_REDIS:-/var/backups/redis}"
LOGS_DIR="${BACKUP_DIR_LOGS:-/var/backups/logs}"
COMPRESSED_DIR="${BACKUP_DIR_COMPRESSED:-/var/backups/compressed}"

cleanup_directory() {
  local dir="$1"
  local label="$2"

  if [ ! -d "${dir}" ]; then
    echo "Directory does not exist, skipping: ${dir}" | logger -t cleanup-backups
    return 0
  fi

  local count
  count=$(find "${dir}" -type f -mtime "+${RETENTION_DAYS}" 2>/dev/null | wc -l)

  if [ "${count}" -gt 0 ]; then
    find "${dir}" -type f -mtime "+${RETENTION_DAYS}" -delete
    echo "Cleaned up ${count} ${label} files older than ${RETENTION_DAYS} days in ${dir}" | logger -t cleanup-backups
  else
    echo "No ${label} files older than ${RETENTION_DAYS} days in ${dir}" | logger -t cleanup-backups
  fi
}

echo "Starting local backup cleanup (retention: ${RETENTION_DAYS} days)" | logger -t cleanup-backups

cleanup_directory "${ENCRYPTED_DIR}" "encrypted"
cleanup_directory "${POSTGRES_DIR}" "postgresql"
cleanup_directory "${REDIS_DIR}" "redis"
cleanup_directory "${LOGS_DIR}" "logs"
cleanup_directory "${COMPRESSED_DIR}" "compressed"

echo "Local backup cleanup completed" | logger -t cleanup-backups
