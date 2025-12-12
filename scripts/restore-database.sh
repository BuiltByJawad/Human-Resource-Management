#!/bin/bash

##############################################################################
# Database Restore Script
# 
# This script restores PostgreSQL backups with the following features:
# - Download from cloud storage if needed
# - Backup validation before restore
# - Optional database recreation
# - Restore verification
##############################################################################

set -e  # Exit on error
set -u  # Exit on undefined variable

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${PROJECT_ROOT}/backups"

# Load environment variables
if [ -f "${PROJECT_ROOT}/backend/.env" ]; then
    export $(cat "${PROJECT_ROOT}/backend/.env" | grep -v '^#' | xargs)
fi

# Database configuration
: "${DATABASE_URL:?DATABASE_URL is required}"
DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_USER=$(echo "$DATABASE_URL" | sed -n 's/.*\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')

# Cloud storage configuration
CLOUD_PROVIDER="${CLOUD_PROVIDER:-none}"
S3_BUCKET="${S3_BUCKET:-}"
AZURE_CONTAINER="${AZURE_CONTAINER:-}"
GCS_BUCKET="${GCS_BUCKET:-}"

##############################################################################
# Functions
##############################################################################

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*"
}

error() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $*" >&2
}

usage() {
    cat <<EOF
Usage: $0 [OPTIONS] BACKUP_FILE

Restore HRM database from a backup file.

Arguments:
    BACKUP_FILE     Path to backup file (local or cloud path)

Options:
    -r, --recreate      Drop and recreate database before restore
    -c, --cloud         Download from cloud storage
    -d, --database NAME Target database name (default: from DATABASE_URL)
    -h, --help          Show this help message

Examples:
    # Restore from local backup
    $0 backups/hrm_backup_20240312_120000.sql.gz

    # Restore from cloud and recreate database
    $0 --cloud --recreate backups/hrm_backup_20240312_120000.sql.gz

    # Restore to different database
    $0 --database hrm_test backups/hrm_backup_20240312_120000.sql.gz
EOF
}

list_available_backups() {
    log "Available local backups:"
    ls -lh "$BACKUP_DIR"/hrm_backup_*.sql.gz 2>/dev/null | \
        awk '{print "  " $9 " (" $5 ", " $6 " " $7 ")"}' || \
        log "  No local backups found"
    
    if [ "$CLOUD_PROVIDER" != "none" ]; then
        log ""
        log "Cloud backups:"
        case "$CLOUD_PROVIDER" in
            s3)
                aws s3 ls "s3://${S3_BUCKET}/backups/" | grep hrm_backup || true
                ;;
            azure)
                az storage blob list --container-name "$AZURE_CONTAINER" \
                    --prefix "backups/hrm_backup" --output table || true
                ;;
            gcp)
                gsutil ls "gs://${GCS_BUCKET}/backups/hrm_backup*" || true
                ;;
        esac
    fi
}

download_from_cloud() {
    local backup_file="$1"
    local local_path="${BACKUP_DIR}/$(basename "$backup_file")"
    
    log "Downloading backup from cloud..."
    
    case "$CLOUD_PROVIDER" in
        s3)
            aws s3 cp "s3://${S3_BUCKET}/${backup_file}" "$local_path"
            ;;
        azure)
            az storage blob download \
                --container-name "$AZURE_CONTAINER" \
                --name "$backup_file" \
                --file "$local_path"
            ;;
        gcp)
            gsutil cp "gs://${GCS_BUCKET}/${backup_file}" "$local_path"
            ;;
        *)
            error "Unknown cloud provider: $CLOUD_PROVIDER"
            return 1
            ;;
    esac
    
    echo "$local_path"
}

validate_backup() {
    local backup_file="$1"
    
    log "Validating backup file..."
    
    # Check if file exists
    if [ ! -f "$backup_file" ]; then
        error "Backup file not found: $backup_file"
        return 1
    fi
    
    # Check if gzip file is valid
    if ! gzip -t "$backup_file" 2>/dev/null; then
        error "Backup file is corrupted: $backup_file"
        return 1
    fi
    
    log "Backup file is valid"
}

recreate_database() {
    log "Recreating database: $DB_NAME"
    
    export PGPASSWORD="$DB_PASS"
    
    # Drop existing connections
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres <<EOF
SELECT pg_terminate_backend(pg_stat_activity.pid)
FROM pg_stat_activity
WHERE pg_stat_activity.datname = '$DB_NAME'
  AND pid <> pg_backend_pid();
EOF
    
    # Drop and recreate database
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres <<EOF
DROP DATABASE IF EXISTS "$DB_NAME";
CREATE DATABASE "$DB_NAME";
EOF
    
    log "Database recreated successfully"
}

restore_backup() {
    local backup_file="$1"
    
    log "Restoring database from: $backup_file"
    
    export PGPASSWORD="$DB_PASS"
    
    # Restore database
    gunzip -c "$backup_file" | \
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        2>&1 | grep -v "^SET$" | grep -v "^$" || true
    
    log "Restore completed"
}

verify_restore() {
    log "Verifying restored database..."
    
    export PGPASSWORD="$DB_PASS"
    
    # Check if we can connect and query
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" \
        > /dev/null 2>&1; then
        log "Database is accessible and contains tables"
        return 0
    else
        error "Database verification failed"
        return 1
    fi
}

##############################################################################
# Main execution
##############################################################################

# Parse arguments
RECREATE=false
FROM_CLOUD=false
TARGET_DB=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -r|--recreate)
            RECREATE=true
            shift
            ;;
        -c|--cloud)
            FROM_CLOUD=true
            shift
            ;;
        -d|--database)
            TARGET_DB="$2"
            shift 2
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        -l|--list)
            list_available_backups
            exit 0
            ;;
        -*)
            error "Unknown option: $1"
            usage
            exit 1
            ;;
        *)
            BACKUP_FILE="$1"
            shift
            ;;
    esac
done

# Check if backup file is specified
if [ -z "${BACKUP_FILE:-}" ]; then
    error "No backup file specified"
    usage
    exit 1
fi

# Override database name if specified
if [ -n "$TARGET_DB" ]; then
    DB_NAME="$TARGET_DB"
fi

main() {
    log "========================================="
    log "Starting HRM Database Restore"
    log "Target database: $DB_NAME"
    log "========================================="
    
    # Download from cloud if needed
    if [ "$FROM_CLOUD" = true ]; then
        BACKUP_FILE=$(download_from_cloud "$BACKUP_FILE")
    fi
    
    # Validate backup
    if ! validate_backup "$BACKUP_FILE"; then
        exit 1
    fi
    
    # Confirm restore
    log "WARNING: This will restore the database '$DB_NAME'"
    if [ "$RECREATE" = true ]; then
        log "WARNING: The database will be DROPPED and RECREATED"
    fi
    read -p "Are you sure you want to continue? (yes/no): " -r
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        log "Restore cancelled"
        exit 0
    fi
    
    # Recreate database if requested
    if [ "$RECREATE" = true ]; then
        recreate_database
    fi
    
    # Restore backup
    restore_backup "$BACKUP_FILE"
    
    # Verify restore
    if ! verify_restore; then
        error "Restore verification failed"
        exit 1
    fi
    
    log "========================================="
    log "Restore completed successfully"
    log "========================================="
}

# Run main function
main "$@"
