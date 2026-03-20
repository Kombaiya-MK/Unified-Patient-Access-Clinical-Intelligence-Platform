#!/bin/bash
# ============================================================================
# Script: archive_partition.sh
# Clinical Appointment Platform (UPACI)
# ============================================================================
# Description: Archives old audit_logs partitions to cold storage (S3/Azure Blob)
#              and drops them from the database to save storage costs.
#              Supports dry-run mode for testing without actual execution.
# Version: 1.0.0
# Date: 2026-03-18
# Usage:
#   ./archive_partition.sh <year> [--dry-run] [--execute] [--s3-bucket=<name>] [--azure-container=<name>]
# Examples:
#   ./archive_partition.sh 2024 --dry-run
#   ./archive_partition.sh 2024 --execute --s3-bucket=upaci-audit-archive
#   ./archive_partition.sh 2024 --execute --azure-container=audit-archives
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

# Archive settings
ARCHIVE_DIR="${ARCHIVE_DIR:-/tmp/audit_archives}"
S3_BUCKET=""
AZURE_CONTAINER=""
DRY_RUN=true
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

Archives an audit_logs partition to cold storage and drops it from database.

Arguments:
    year                Year of partition to archive (e.g., 2024)

Options:
    --dry-run          Show commands without executing (default)
    --execute          Actually execute the archive operation
    --s3-bucket=NAME   Archive to AWS S3 bucket
    --azure-container=NAME  Archive to Azure Blob container
    -h, --help         Show this help message

Environment Variables:
    DB_HOST           Database host (default: localhost)
    DB_PORT           Database port (default: 5432)
    DB_NAME           Database name (default: upaci)
    DB_USER           Database user (default: postgres)
    DB_SCHEMA         Database schema (default: app)
    ARCHIVE_DIR       Local archive directory (default: /tmp/audit_archives)
    AWS_ACCESS_KEY_ID     AWS credentials (required for S3)
    AWS_SECRET_ACCESS_KEY AWS credentials (required for S3)
    AWS_DEFAULT_REGION    AWS region (required for S3)
    AZURE_STORAGE_ACCOUNT     Azure credentials (required for Azure)
    AZURE_STORAGE_KEY         Azure credentials (required for Azure)

Examples:
    # Dry run (test without executing)
    $0 2024 --dry-run --s3-bucket=upaci-audit-archive

    # Actually archive to S3
    $0 2024 --execute --s3-bucket=upaci-audit-archive

    # Archive to Azure Blob Storage
    $0 2024 --execute --azure-container=audit-archives

Exit codes:
    0   Success
    1   Invalid arguments or configuration
    2   Archive export failed
    3   Upload to cloud storage failed
    4   Database DROP failed
    5   Metadata update failed

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
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --execute)
            DRY_RUN=false
            shift
            ;;
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
ARCHIVE_FILENAME="${PARTITION_NAME}_${TIMESTAMP}.sql.gz"
LOCAL_ARCHIVE_PATH="${ARCHIVE_DIR}/${ARCHIVE_FILENAME}"

# Validate storage type specified
if [ "$DRY_RUN" = false ] && [ -z "$STORAGE_TYPE" ]; then
    log_error "Must specify either --s3-bucket or --azure-container when using --execute"
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
log_info "Audit Partition Archive Configuration"
log_info "=========================================="
log_info "Mode:              $([ "$DRY_RUN" = true ] && echo 'DRY RUN (no changes)' || echo 'EXECUTE (real changes)')"
log_info "Partition:         $PARTITION_NAME"
log_info "Database:          $DB_NAME@$DB_HOST:$DB_PORT"
log_info "Storage Type:      ${STORAGE_TYPE:-none}"
log_info "S3 Bucket:         ${S3_BUCKET:-N/A}"
log_info "Azure Container:   ${AZURE_CONTAINER:-N/A}"
log_info "Local Archive:     $LOCAL_ARCHIVE_PATH"
log_info "Timestamp:         $TIMESTAMP"
log_info "=========================================="

# ============================================================================
# Step 1: Check if partition exists
# ============================================================================

log_info "Checking if partition $PARTITION_NAME exists..."

PARTITION_EXISTS=$(PGPASSWORD="${PGPASSWORD:-}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "
    SELECT EXISTS (
        SELECT 1 
        FROM pg_tables 
        WHERE schemaname = '$DB_SCHEMA' 
        AND tablename = '$PARTITION_NAME'
    );
")

if [ "$PARTITION_EXISTS" != "t" ]; then
    log_error "Partition $PARTITION_NAME does not exist in database"
    exit 1
fi

log_success "Partition $PARTITION_NAME exists"

# ============================================================================
# Step 2: Get partition row count
# ============================================================================

log_info "Counting records in partition..."

ROW_COUNT=$(PGPASSWORD="${PGPASSWORD:-}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "
    SELECT COUNT(*) FROM ${DB_SCHEMA}.${PARTITION_NAME};
")

log_info "Partition contains $ROW_COUNT records"

if [ "$ROW_COUNT" -eq 0 ]; then
    log_info "Partition is empty. Skipping export, proceeding to drop."
fi

# ============================================================================
# Step 3: Export partition to file
# ============================================================================

if [ "$DRY_RUN" = true ]; then
    log_info "[DRY RUN] Would execute:"
    echo "  pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t ${DB_SCHEMA}.${PARTITION_NAME} --data-only | gzip > $LOCAL_ARCHIVE_PATH"
else
    log_info "Creating local archive directory..."
    mkdir -p "$ARCHIVE_DIR"
    
    log_info "Exporting partition to $LOCAL_ARCHIVE_PATH..."
    
    if ! PGPASSWORD="${PGPASSWORD:-}" pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        -t "${DB_SCHEMA}.${PARTITION_NAME}" \
        --data-only \
        --no-owner \
        --no-privileges \
        | gzip > "$LOCAL_ARCHIVE_PATH"; then
        log_error "Failed to export partition"
        exit 2
    fi
    
    ARCHIVE_SIZE=$(stat -f%z "$LOCAL_ARCHIVE_PATH" 2>/dev/null || stat -c%s "$LOCAL_ARCHIVE_PATH")
    log_success "Partition exported successfully ($(numfmt --to=iec-i --suffix=B "$ARCHIVE_SIZE" 2>/dev/null || echo "$ARCHIVE_SIZE bytes"))"
fi

# ============================================================================
# Step 4: Upload to cloud storage
# ============================================================================

CLOUD_ARCHIVE_LOCATION=""

if [ "$STORAGE_TYPE" = "s3" ]; then
    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY RUN] Would upload to S3:"
        echo "  aws s3 cp $LOCAL_ARCHIVE_PATH s3://${S3_BUCKET}/audit-archives/${ARCHIVE_FILENAME}"
        CLOUD_ARCHIVE_LOCATION="s3://${S3_BUCKET}/audit-archives/${ARCHIVE_FILENAME}"
    else
        log_info "Uploading to S3 bucket: $S3_BUCKET..."
        
        if ! aws s3 cp "$LOCAL_ARCHIVE_PATH" "s3://${S3_BUCKET}/audit-archives/${ARCHIVE_FILENAME}"; then
            log_error "Failed to upload to S3"
            exit 3
        fi
        
        CLOUD_ARCHIVE_LOCATION="s3://${S3_BUCKET}/audit-archives/${ARCHIVE_FILENAME}"
        log_success "Uploaded to $CLOUD_ARCHIVE_LOCATION"
    fi
elif [ "$STORAGE_TYPE" = "azure" ]; then
    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY RUN] Would upload to Azure Blob:"
        echo "  az storage blob upload --account-name \$AZURE_STORAGE_ACCOUNT --container-name ${AZURE_CONTAINER} --name audit-archives/${ARCHIVE_FILENAME} --file $LOCAL_ARCHIVE_PATH"
        CLOUD_ARCHIVE_LOCATION="azure://${AZURE_STORAGE_ACCOUNT}/${AZURE_CONTAINER}/audit-archives/${ARCHIVE_FILENAME}"
    else
        log_info "Uploading to Azure Blob container: $AZURE_CONTAINER..."
        
        if ! az storage blob upload \
            --account-name "$AZURE_STORAGE_ACCOUNT" \
            --container-name "$AZURE_CONTAINER" \
            --name "audit-archives/${ARCHIVE_FILENAME}" \
            --file "$LOCAL_ARCHIVE_PATH"; then
            log_error "Failed to upload to Azure Blob"
            exit 3
        fi
        
        CLOUD_ARCHIVE_LOCATION="azure://${AZURE_STORAGE_ACCOUNT}/${AZURE_CONTAINER}/audit-archives/${ARCHIVE_FILENAME}"
        log_success "Uploaded to $CLOUD_ARCHIVE_LOCATION"
    fi
fi

# ============================================================================
# Step 5: Verify upload (if executed)
# ============================================================================

if [ "$DRY_RUN" = false ]; then
    log_info "Verifying cloud storage upload..."
    
    if [ "$STORAGE_TYPE" = "s3" ]; then
        if ! aws s3 ls "s3://${S3_BUCKET}/audit-archives/${ARCHIVE_FILENAME}" &> /dev/null; then
            log_error "Verification failed: File not found in S3"
            exit 3
        fi
    elif [ "$STORAGE_TYPE" = "azure" ]; then
        if ! az storage blob show \
            --account-name "$AZURE_STORAGE_ACCOUNT" \
            --container-name "$AZURE_CONTAINER" \
            --name "audit-archives/${ARCHIVE_FILENAME}" &> /dev/null; then
            log_error "Verification failed: File not found in Azure Blob"
            exit 3
        fi
    fi
    
    log_success "Cloud storage upload verified"
fi

# ============================================================================
# Step 6: Update partition metadata
# ============================================================================

if [ "$DRY_RUN" = true ]; then
    log_info "[DRY RUN] Would update partition_metadata table:"
    echo "  UPDATE partition_metadata SET"
    echo "    status = 'archived',"
    echo "    archived_at = NOW(),"
    echo "    archive_location = '$CLOUD_ARCHIVE_LOCATION',"
    echo "    archive_size_bytes = $ARCHIVE_SIZE,"
    echo "    row_count_at_archive = $ROW_COUNT"
    echo "  WHERE partition_name = '$PARTITION_NAME';"
else
    log_info "Updating partition metadata..."
    
    if ! PGPASSWORD="${PGPASSWORD:-}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
        UPDATE ${DB_SCHEMA}.partition_metadata
        SET 
            status = 'archived',
            archived_at = NOW(),
            archive_location = '$CLOUD_ARCHIVE_LOCATION',
            archive_size_bytes = $ARCHIVE_SIZE,
            row_count_at_archive = $ROW_COUNT,
            notes = COALESCE(notes || ' | ', '') || 'Archived on $TIMESTAMP to $CLOUD_ARCHIVE_LOCATION'
        WHERE partition_name = '$PARTITION_NAME';
    " > /dev/null; then
        log_error "Failed to update partition metadata"
        exit 5
    fi
    
    log_success "Partition metadata updated"
fi

# ============================================================================
# Step 7: Drop partition from database
# ============================================================================

if [ "$DRY_RUN" = true ]; then
    log_info "[DRY RUN] Would drop partition from database:"
    echo "  DROP TABLE ${DB_SCHEMA}.${PARTITION_NAME};"
else
    log_info "Dropping partition $PARTITION_NAME from database..."
    
    if ! PGPASSWORD="${PGPASSWORD:-}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
        DROP TABLE ${DB_SCHEMA}.${PARTITION_NAME};
    " > /dev/null; then
        log_error "Failed to drop partition from database"
        log_error "Archive is safe at: $CLOUD_ARCHIVE_LOCATION"
        exit 4
    fi
    
    log_success "Partition $PARTITION_NAME dropped from database"
fi

# ============================================================================
# Step 8: Cleanup local archive (optional)
# ============================================================================

if [ "$DRY_RUN" = false ]; then
    log_info "Cleaning up local archive file..."
    rm -f "$LOCAL_ARCHIVE_PATH"
    log_success "Local archive file removed"
fi

# ============================================================================
# Summary
# ============================================================================

log_info "=========================================="
log_success "Archive operation completed successfully"
log_info "=========================================="
log_info "Partition:         $PARTITION_NAME"
log_info "Records Archived:  $ROW_COUNT"
log_info "Archive Location:  $CLOUD_ARCHIVE_LOCATION"
log_info "Archive Size:      $(numfmt --to=iec-i --suffix=B "$ARCHIVE_SIZE" 2>/dev/null || echo "$ARCHIVE_SIZE bytes")"
log_info "Mode:              $([ "$DRY_RUN" = true ] && echo 'DRY RUN' || echo 'EXECUTED')"
log_info "=========================================="

exit 0
