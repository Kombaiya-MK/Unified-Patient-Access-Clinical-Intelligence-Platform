#!/bin/bash
# ─────────────────────────────────────────────────────────────
# Backup Compression Script (gzip -9)
#
# Compresses a backup file using gzip at maximum compression
# level (-9) and reports compression ratio. The input file
# is replaced by the .gz version.
#
# Usage: compress-backups.sh <input_file>
# Outputs: Absolute path of the compressed file on stdout
#
# @task US_042 TASK_001
# ─────────────────────────────────────────────────────────────
set -euo pipefail

INPUT_FILE="${1:?Usage: compress-backups.sh <input_file>}"

# Validate input file
if [ ! -f "${INPUT_FILE}" ]; then
  echo "ERROR: File not found: ${INPUT_FILE}" >&2
  exit 1
fi

if [ ! -s "${INPUT_FILE}" ]; then
  echo "ERROR: Input file is empty: ${INPUT_FILE}" >&2
  exit 1
fi

ORIGINAL_SIZE=$(stat --printf='%s' "${INPUT_FILE}" 2>/dev/null || stat -f '%z' "${INPUT_FILE}" 2>/dev/null)

# Compress with maximum compression
gzip -9 --force "${INPUT_FILE}"

COMPRESSED_FILE="${INPUT_FILE}.gz"

# Verify compressed file exists and is non-empty
if [ ! -s "${COMPRESSED_FILE}" ]; then
  echo "ERROR: Compression failed or produced empty file: ${COMPRESSED_FILE}" >&2
  exit 1
fi

COMPRESSED_SIZE=$(stat --printf='%s' "${COMPRESSED_FILE}" 2>/dev/null || stat -f '%z' "${COMPRESSED_FILE}" 2>/dev/null)

# Calculate compression ratio (percentage reduction)
if [ "${ORIGINAL_SIZE}" -gt 0 ]; then
  RATIO=$(awk "BEGIN { printf \"%.1f\", (1 - ${COMPRESSED_SIZE}/${ORIGINAL_SIZE}) * 100 }")
  echo "Compressed ${INPUT_FILE}: ${ORIGINAL_SIZE} -> ${COMPRESSED_SIZE} bytes (${RATIO}% reduction)" | logger -t compress-backups
else
  echo "Compressed ${INPUT_FILE}: ${COMPRESSED_SIZE} bytes" | logger -t compress-backups
fi

echo "${COMPRESSED_FILE}"
