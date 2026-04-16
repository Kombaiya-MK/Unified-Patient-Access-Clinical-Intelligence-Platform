#!/bin/bash
# ─────────────────────────────────────────────────────────────
# Redis RDB Backup Script
#
# Triggers BGSAVE on the Redis server, waits for completion,
# then copies the RDB dump to the redis backup directory.
#
# Usage: backup-redis.sh
# Outputs: Absolute path of the backup file on stdout
#
# @task US_042 TASK_001
# ─────────────────────────────────────────────────────────────
set -euo pipefail

# Load Redis credentials from environment file if present (before deriving paths)
if [ -f "${BACKUP_ENV_FILE:-/etc/app/backup.env}" ]; then
  # shellcheck source=/dev/null
  source "${BACKUP_ENV_FILE:-/etc/app/backup.env}"
fi

TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_DIR="${BACKUP_DIR_REDIS:-/var/backups/redis}"
BACKUP_FILE="${BACKUP_DIR}/dump-${TIMESTAMP}.rdb"
BGSAVE_WAIT_SECS="${BGSAVE_WAIT_SECS:-5}"

# Ensure directory exists
mkdir -p "${BACKUP_DIR}"

: "${REDIS_HOST:?REDIS_HOST is required}"
: "${REDIS_PORT:?REDIS_PORT is required}"

# Build redis-cli auth options
AUTH_OPTS=""
if [ -n "${REDIS_PASSWORD:-}" ]; then
  AUTH_OPTS="-a ${REDIS_PASSWORD}"
fi

TLS_OPTS=""
if [ "${REDIS_TLS:-false}" = "true" ]; then
  TLS_OPTS="--tls"
fi

# Trigger BGSAVE
# shellcheck disable=SC2086
redis-cli -h "${REDIS_HOST}" -p "${REDIS_PORT}" ${AUTH_OPTS} ${TLS_OPTS} BGSAVE 2>&1 | logger -t backup-redis

# Wait for the save to complete
sleep "${BGSAVE_WAIT_SECS}"

# Copy the RDB file (location varies; default /data/dump.rdb)
REDIS_DATA_DIR="${REDIS_DATA_DIR:-/data}"
if [ -f "${REDIS_DATA_DIR}/dump.rdb" ]; then
  cp "${REDIS_DATA_DIR}/dump.rdb" "${BACKUP_FILE}"
else
  echo "WARNING: Redis dump.rdb not found at ${REDIS_DATA_DIR}/dump.rdb" >&2
  exit 1
fi

# Verify the file is non-empty
if [ ! -s "${BACKUP_FILE}" ]; then
  echo "ERROR: Redis backup file is empty: ${BACKUP_FILE}" >&2
  exit 1
fi

echo "Redis backup completed: ${BACKUP_FILE}" | logger -t backup-redis
echo "${BACKUP_FILE}"
