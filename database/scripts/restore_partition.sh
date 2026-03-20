#!/bin/bash
# ============================================================================
# Script: restore_partition.sh
# Clinical Appointment Platform (UPACI)
# ============================================================================
# Description: Restores archived audit_logs partitions from cold storage 
#              (S3/Azure Blob) back to the PostgreSQL database.
# Version: 1.0.0
# Date: 2026-03-18
# Usage:
#   ./restore_partition.sh <year> [--s3-bucket=<name>] [--azure-container=<name>] [--dry-run]
# Examples:
#   ./restore_partition.sh 2024 --s3-bucket=upaci-audit-archive
#   ./restore_partition.sh 2024 --azure-container=audit-archives
#   ./restore_partition.sh 2024 --s3-bucket=upaci-audit-archive --dry-run
# ============================================================================

set -euo pipefail

# ============================================================================
# Configuration
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Database connection settings (override with environment variables)
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-upaci}"
DB_USER="${DB_USER:-postgres}"
DB_SCHEMA="${DB_SCHEMA:-app}"

# Restore settings
RESTORE_DIR="${RESTORE_DIR:-/tmp/audit_restore}"
S3_BUCKET=""
AZURE_CONTAINER=""
DRY_RUN=false
STORAGE_TYPE=""

# ============================================================================
# Helper functions
# ============================================================================

log_info() {
    echo "[INFO] $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo "[ERROR] $(date '+%Y-%m-%d %H:%M:%S') - $1" >&2
}

log_success() {
    echo "[SUCCESS] $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

usage() {
    cat << EOF
Usage: $0 <year> [OPTIONS]

Restores an archived audit_logs partition from cold storage back to database.

Arguments:
    year                Year of partition to restore (e.g., 2024)

Options:
    --s3-bucket=NAME       Restore from AWS S3 bucket
    --azure-container=NAME Restore from Azure Blob container
    --dry-run              Show commands without executing
    -h, --help             Show this help message

Environment Variables:
    DB_HOST           Database host (default: localhost)
    DB_PORT           Database port (default: 5432)
    DB_NAME           Database name (default: upaci)
    DB_USER           Database user (default: postgres)
    DB_SCHEMA         Database schema (default: app)
    RESTORE_DIR       Local restore directory (default: /tmp/audit_restore)
    AWS_ACCESS_KEY_ID     AWS credentials (required for S3)
    AWS_SECRET_ACCESS_KEY AWS credentials (required for S3)
    AWS_DEFAULT_REGION    AWS region (required for S3)
    AZURE_STORAGE_ACCOUNT     Azure credentials (required for Azure)
    AZURE_STORAGE_KEY         Azure credentials (required for Azure)

Examples:
    # Restore from S3
    $0 2024 --s3-bucket=upaci-audit-archive

    # Restore from Azure
    $0 2024 --azure-container=audit-archives

    # Dry run (test without restoring)
    $0 2024 --s3-bucket=upaci-audit-archive --dry-run

Exit codes:
    0   Success
    1   Invalid arguments or configuration
    2   Archive download failed
    3  Archive file corrupted or invalid
    4   Partition creation failed
    5   Data restore failed
    6   Metadata update failed

EOF
    exit 0
}

# ============================================================================
# Parse arguments
# ============================================================================

if [ $# -eq 0 ]; then
    log_error "Missing required argument: year"
    usage
fi

YEAR="$1"
shift

# Validate year
if ! [[ "$YEAR" =~ ^[0-9]{4}$ ]]; then
    log_error "Invalid year: $YEAR. Must be a 4-digit year."
    exit 1
fi

# Parse options
while [[ $# -gt 0 ]]; do
    case $1 in
        --s3-bucket=*)
            S3_BUCKET="${1#*=}"
            STORAGE_TYPE="s3"
            shift
            ;;
        --azure-container=*)
            AZURE_CONTAINER="${1#*=}"
            STORAGE_TYPE="azure"
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        -h|--help)
            usage
            ;;
        *)
            log_error "Unknown option: $1"
            usage
            ;;
    esac
done

# ============================================================================
# Validation
# ============================================================================

PARTITION_NAME="audit_logs_${YEAR}"
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')

# Validate storage type specified
if [ -z "$STORAGE_TYPE" ]; then
    log_error "Must specify either --s3-bucket or --azure-container"
    exit 1
fi

# Validate S3 credentials if using S3
if [ "$STORAGE_TYPE" = "s3" ] && [ "$DRY_RUN" = false ]; then
    if [ -z "${AWS_ACCESS_KEY_ID:-}" ] || [ -z "${AWS_SECRET_ACCESS_KEY:-}" ]; then
        log_error "AWS credentials not set. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables."
        exit 1
    fi
    
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI not installed. Install with: pip install awscli"
        exit 1
    fi
fi

# Validate Azure credentials if using Azure
if [ "$STORAGE_TYPE" = "azure" ] && [ "$DRY_RUN" = false ]; then
    if [ -z "${AZURE_STORAGE_ACCOUNT:-}" ] || [ -z "${AZURE_STORAGE_KEY:-}" ]; then
        log_error "Azure Storage credentials not set. Set AZURE_STORAGE_ACCOUNT and AZURE_STORAGE_KEY environment variables."
        exit 1
    fi
    
    if ! command -v az &> /dev/null; then
        log_error "Azure CLI not installed. Install with: curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash"
        exit 1
    fi
fi

# ============================================================================
# Display configuration
# ============================================================================

log_info "=========================================="
log_info "Audit Partition Restore Configuration"
log_info "=========================================="
log_info "Mode:              $([ "$DRY_RUN" = true ] && echo 'DRY RUN (no changes)' || echo 'EXECUTE (real restore)')"
log_info "Partition:         $PARTITION_NAME"
log_info "Database:          $DB_NAME@$DB_HOST:$DB_PORT"
log_info "Storage Type:      $STORAGE_TYPE"
log_info "S3 Bucket:         ${S3_BUCKET:-N/A}"
log_info "Azure Container:   ${AZURE_CONTAINER:-N/A}"
log_info "Restore Directory: $RESTORE_DIR"
log_info "=========================================="

# ============================================================================
# Step 1: Check partition metadata
# ============================================================================

log_info "Checking partition metadata..."

METADATA=$(PGPASSWORD="${PGPASSWORD:-}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "
    SELECT 
        status,
        archive_location,
        row_count_at_archive
    FROM ${DB_SCHEMA}.partition_metadata
    WHERE partition_name = '$PARTITION_NAME';
" | tr '|' ' ')

if [ -z "$METADATA" ]; then
    log_error "No metadata found for partition $PARTITION_NAME"
    log_error "This partition may never have existed or was never archived"
    exit 1
fi

read -r STATUS ARCHIVE_LOCATION ROW_COUNT_AT_ARCHIVE <<< "$METADATA"

log_info "Partition status: $STATUS"
log_info "Archive location: $ARCHIVE_LOCATION"
log_info "Records to restore: $ROW_COUNT_AT_ARCHIVE"

if [ "$STATUS" != "archived" ]; then
    log_error "Partition status is '$STATUS', not 'archived'. Cannot restore."
    exit 1
fi

# ============================================================================
# Step 2: Check if partition already exists
# ============================================================================

log_info "Checking if partition already exists in database..."

PARTITION_EXISTS=$(PGPASSWORD="${PGPASSWORD:-}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "
    SELECT EXISTS (
        SELECT 1 
        FROM pg_tables 
        WHERE schemaname = '$DB_SCHEMA' 
        AND tablename = '$PARTITION_NAME'
    );
")

if [ "$PARTITION_EXISTS" = "t" ]; then
    log_error "Partition $PARTITION_NAME already exists in database"
    log_error "Drop it first or use a different approach to merge data"
    exit 1
fi

log_info "Partition does not exist (good for restore)"

# ============================================================================
# Step 3: Find and download archive file
# ============================================================================

if [ "$STORAGE_TYPE" = "s3" ]; then
    log_info "Searching for archive file in S3..."
    
    # Find the latest archive file for this partition
    ARCHIVE_FILE=$(aws s3 ls "s3://${S3_BUCKET}/audit-archives/${PARTITION_NAME}_" \
        | sort -r \
        | head -n 1 \
        | awk '{print $4}')
    
    if [ -z "$ARCHIVE_FILE" ]; then
        log_error "No archive file found in s3://${S3_BUCKET}/audit-archives/ for partition $PARTITION_NAME"
        exit 2
    fi
    
    CLOUD_ARCHIVE_PATH="s3://${S3_BUCKET}/audit-archives/${ARCHIVE_FILE}"
    LOCAL_ARCHIVE_PATH="${RESTORE_DIR}/${ARCHIVE_FILE}"
    
    log_info "Found archive: $ARCHIVE_FILE"
    
    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY RUN] Would download from S3:"
        echo "  aws s3 cp $CLOUD_ARCHIVE_PATH $LOCAL_ARCHIVE_PATH"
    else
        log_info "Creating restore directory..."
        mkdir -p "$RESTORE_DIR"
        
        log_info "Downloading from S3..."
        if ! aws s3 cp "$CLOUD_ARCHIVE_PATH" "$LOCAL_ARCHIVE_PATH"; then
            log_error "Failed to download archive from S3"
            exit 2
        fi
        log_success "Downloaded archive file"
    fi
    
elif [ "$STORAGE_TYPE" = "azure" ]; then
    log_info "Searching for archive file in Azure Blob..."
    
    # Find the latest archive file for this partition
    ARCHIVE_FILE=$(az storage blob list \
        --account-name "$AZURE_STORAGE_ACCOUNT" \
        --container-name "$AZURE_CONTAINER" \
        --prefix "audit-archives/${PARTITION_NAME}_" \
        --query "[].name" -o tsv \
        | sort -r \
        | head -n 1 \
        | xargs basename)
    
    if [ -z "$ARCHIVE_FILE" ]; then
        log_error "No archive file found in Azure container $AZURE_CONTAINER for partition $PARTITION_NAME"
        exit 2
    fi
    
    CLOUD_ARCHIVE_PATH="azure://${AZURE_STORAGE_ACCOUNT}/${AZURE_CONTAINER}/audit-archives/${ARCHIVE_FILE}"
    LOCAL_ARCHIVE_PATH="${RESTORE_DIR}/${ARCHIVE_FILE}"
    
    log_info "Found archive: $ARCHIVE_FILE"
    
    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY RUN] Would download from Azure:"
        echo "  az storage blob download --account-name $AZURE_STORAGE_ACCOUNT --container-name $AZURE_CONTAINER --name audit-archives/$ARCHIVE_FILE --file $LOCAL_ARCHIVE_PATH"
    else
        log_info "Creating restore directory..."
        mkdir -p "$RESTORE_DIR"
        
        log_info "Downloading from Azure Blob..."
        if ! az storage blob download \
            --account-name "$AZURE_STORAGE_ACCOUNT" \
            --container-name "$AZURE_CONTAINER" \
            --name "audit-archives/${ARCHIVE_FILE}" \
            --file "$LOCAL_ARCHIVE_PATH"; then
            log_error "Failed to download archive from Azure"
            exit 2
        fi
        log_success "Downloaded archive file"
    fi
fi

# ============================================================================
# Step 4: Decompress archive
# ============================================================================

if [ "$DRY_RUN" = true ]; then
    log_info "[DRY RUN] Would decompress archive:"
    echo "  gunzip $LOCAL_ARCHIVE_PATH"
else
    log_info "Decompressing archive..."
    
    if ! gunzip "$LOCAL_ARCHIVE_PATH"; then
        log_error "Failed to decompress archive"
        exit 3
    fi
    
    DECOMPRESSED_FILE="${LOCAL_ARCHIVE_PATH%.gz}"
    log_success "Archive decompressed to $DECOMPRESSED_FILE"
fi

# ============================================================================
# Step 5: Create partition structure
# ============================================================================

if [ "$DRY_RUN" = true ]; then
    log_info "[DRY RUN] Would create partition via SQL function:"
    echo "  SELECT * FROM ${DB_SCHEMA}.create_audit_partition($YEAR);"
else
    log_info "Creating partition structure..."
    
    CREATE_RESULT=$(PGPASSWORD="${PGPASSWORD:-}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "
        SELECT status FROM ${DB_SCHEMA}.create_audit_partition($YEAR);
    ")
    
    if [ "$CREATE_RESULT" != "SUCCESS" ] && [ "$CREATE_RESULT" != "INFO" ]; then
        log_error "Failed to create partition: $CREATE_RESULT"
        exit 4
    fi
    
    log_success "Partition $PARTITION_NAME created with indexes"
fi

# ============================================================================
# Step 6: Restore data
# ============================================================================

if [ "$DRY_RUN" = true ]; then
    log_info "[DRY RUN] Would restore data:"
    echo "  psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME < $DECOMPRESSED_FILE"
else
    log_info "Restoring data to partition..."
    
    if ! PGPASSWORD="${PGPASSWORD:-}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" < "${DECOMPRESSED_FILE}"; then
        log_error "Failed to restore data"
        log_error "Partition structure was created but data restore failed"
        exit 5
    fi
    
    log_success "Data restored to partition"
fi

# ============================================================================
# Step 7: Verify row count
# ============================================================================

if [ "$DRY_RUN" = false ]; then
    log_info "Verifying restored row count..."
    
    RESTORED_COUNT=$(PGPASSWORD="${PGPASSWORD:-}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "
        SELECT COUNT(*) FROM ${DB_SCHEMA}.${PARTITION_NAME};
    ")
    
    log_info "Restored records: $RESTORED_COUNT"
    log_info "Expected records: $ROW_COUNT_AT_ARCHIVE"
    
    if [ "$RESTORED_COUNT" -ne "$ROW_COUNT_AT_ARCHIVE" ]; then
        log_error "Row count mismatch! Expected $ROW_COUNT_AT_ARCHIVE, got $RESTORED_COUNT"
        log_error "Data may be corrupted or incomplete"
        exit 5
    fi
    
    log_success "Row count verified: $RESTORED_COUNT records"
fi

# ============================================================================
# Step 8: Update partition metadata
# ============================================================================

if [ "$DRY_RUN" = true ]; then
    log_info "[DRY RUN] Would update partition_metadata table:"
    echo "  UPDATE partition_metadata SET"
    echo "    status = 'restored',"
    echo "    notes = COALESCE(notes || ' | ', '') || 'Restored on $TIMESTAMP from $CLOUD_ARCHIVE_PATH'"
    echo "  WHERE partition_name = '$PARTITION_NAME';"
else
    log_info "Updating partition metadata..."
    
    if ! PGPASSWORD="${PGPASSWORD:-}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
        UPDATE ${DB_SCHEMA}.partition_metadata
        SET 
            status = 'restored',
            notes = COALESCE(notes || ' | ', '') || 'Restored on $TIMESTAMP from $CLOUD_ARCHIVE_PATH'
        WHERE partition_name = '$PARTITION_NAME';
    " > /dev/null; then
        log_error "Failed to update partition metadata"
        exit 6
    fi
    
    log_success "Partition metadata updated"
fi

# ============================================================================
# Step 9: Cleanup local files
# ============================================================================

if [ "$DRY_RUN" = false ]; then
    log_info "Cleaning up temporary files..."
    rm -f "${DECOMPRESSED_FILE}"
    log_success "Temporary files removed"
fi

# ============================================================================
# Summary
# ============================================================================

log_info "=========================================="
log_success "Restore operation completed successfully"
log_info "=========================================="
log_info "Partition:         $PARTITION_NAME"
log_info "Records Restored:  $RESTORED_COUNT"
log_info "Archive Source:    $CLOUD_ARCHIVE_PATH"
log_info "Mode:              $([ "$DRY_RUN" = true ] && echo 'DRY RUN' || echo 'EXECUTED')"
log_info "=========================================="

exit 0
