#!/bin/bash

##############################################################################
# Database Backup Script
# 
# This script performs automated PostgreSQL backups with the following features:
# - Compressed backups using gzip
# - Retention policy (30 daily, 12 weekly, 12 monthly)
# - Upload to cloud storage (S3/Azure/GCP)
# - Notifications on failure
# - Backup verification
##############################################################################

set -e  # Exit on error
set -u  # Exit on undefined variable

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${PROJECT_ROOT}/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DATE=$(date +"%Y%m%d")

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

# Backup filenames
BACKUP_FILENAME="hrm_backup_${TIMESTAMP}.sql"
BACKUP_COMPRESSED="${BACKUP_FILENAME}.gz"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_COMPRESSED}"

# Cloud storage configuration (optional)
CLOUD_PROVIDER="${CLOUD_PROVIDER:-none}"  # none, s3, azure, gcp
S3_BUCKET="${S3_BUCKET:-}"
AZURE_CONTAINER="${AZURE_CONTAINER:-}"
GCS_BUCKET="${GCS_BUCKET:-}"

# Notification configuration
SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"
EMAIL_TO="${BACKUP_NOTIFICATION_EMAIL:-}"

# Retention settings
DAILY_RETENTION=30    # Keep 30 days
WEEKLY_RETENTION=12   # Keep 12 weeks
MONTHLY_RETENTION=12  # Keep 12 months

# Encryption settings
BACKUP_ENCRYPTION_ENABLED="${BACKUP_ENCRYPTION_ENABLED:-false}"
BACKUP_ENCRYPTION_PASSPHRASE="${BACKUP_ENCRYPTION_PASSPHRASE:-}"

##############################################################################
# Functions
##############################################################################

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*"
}

error() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $*" >&2
}

notify_failure() {
    local message="$1"
    
    # Slack notification
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST "$SLACK_WEBHOOK_URL" \
            -H 'Content-Type: application/json' \
            -d "{\"text\":\"❌ Database Backup Failed: ${message}\"}" \
            2>/dev/null || true
    fi
    
    # Email notification (requires sendmail or similar)
    if [ -n "$EMAIL_TO" ]; then
        echo "Database backup failed: ${message}" | \
            mail -s "HRM Backup Failure" "$EMAIL_TO" 2>/dev/null || true
    fi
}

encrypt_backup() {
    if [ "$BACKUP_ENCRYPTION_ENABLED" != "true" ]; then
        return 0
    fi

    if ! command -v gpg >/dev/null 2>&1; then
        error "GPG not installed; cannot encrypt backup"
        return 1
    fi

    if [ -z "$BACKUP_ENCRYPTION_PASSPHRASE" ]; then
        error "BACKUP_ENCRYPTION_PASSPHRASE is required when encryption is enabled"
        return 1
    fi

    log "Encrypting backup archive..."
    gpg --batch --yes --passphrase "$BACKUP_ENCRYPTION_PASSPHRASE" -c "$BACKUP_PATH"
    rm -f "$BACKUP_PATH"
    BACKUP_PATH="${BACKUP_PATH}.gpg"
    BACKUP_COMPRESSED="${BACKUP_COMPRESSED}.gpg"
    log "Encrypted backup created: $BACKUP_PATH"
}

notify_success() {
    local message="$1"
    
    # Slack notification
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST "$SLACK_WEBHOOK_URL" \
            -H 'Content-Type: application/json' \
            -d "{\"text\":\"✅ Database Backup Successful: ${message}\"}" \
            2>/dev/null || true
    fi
}

create_backup() {
    log "Starting database backup..."
    
    # Ensure backup directory exists
    mkdir -p "$BACKUP_DIR"
    
    # Set password for pg_dump
    export PGPASSWORD="$DB_PASS"
    
    # Perform backup
    if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        --format=plain \
        --no-owner \
        --no-acl \
        --verbose \
        | gzip > "$BACKUP_PATH" 2>&1; then
        log "Backup created successfully: $BACKUP_PATH"
        
        # Get backup size
        local size=$(du -h "$BACKUP_PATH" | cut -f1)
        log "Backup size: $size"
        
        return 0
    else
        error "Failed to create backup"
        return 1
    fi
}

upload_to_cloud() {
    if [ "$CLOUD_PROVIDER" = "none" ]; then
        log "Cloud backup disabled, skipping upload"
        return 0
    fi
    
    log "Uploading backup to ${CLOUD_PROVIDER}..."
    
    case "$CLOUD_PROVIDER" in
        s3)
            if [ -z "$S3_BUCKET" ]; then
                error "S3_BUCKET not configured"
                return 1
            fi
            aws s3 cp "$BACKUP_PATH" "s3://${S3_BUCKET}/backups/${BACKUP_COMPRESSED}" \
                --storage-class STANDARD_IA
            ;;
        azure)
            if [ -z "$AZURE_CONTAINER" ]; then
                error "AZURE_CONTAINER not configured"
                return 1
            fi
            az storage blob upload \
                --container-name "$AZURE_CONTAINER" \
                --file "$BACKUP_PATH" \
                --name "backups/${BACKUP_COMPRESSED}"
            ;;
        gcp)
            if [ -z "$GCS_BUCKET" ]; then
                error "GCS_BUCKET not configured"
                return 1
            fi
            gsutil cp "$BACKUP_PATH" "gs://${GCS_BUCKET}/backups/${BACKUP_COMPRESSED}"
            ;;
        *)
            error "Unknown cloud provider: $CLOUD_PROVIDER"
            return 1
            ;;
    esac
    
    log "Upload completed successfully"
}

cleanup_old_backups() {
    log "Cleaning up old backups..."
    
    # Clean local backups
    # Keep last 30 daily backups
    find "$BACKUP_DIR" -name "hrm_backup_*.sql.gz" -mtime +$DAILY_RETENTION -delete
    
    # For cloud storage, you'd implement retention policies specific to your provider
    # Example for S3:
    # aws s3 ls "s3://${S3_BUCKET}/backups/" | ... | aws s3 rm ...
    
    log "Cleanup completed"
}

verify_backup() {
    log "Verifying backup integrity..."
    
    # Test if gzip file is valid
    if gzip -t "$BACKUP_PATH" 2>/dev/null; then
        log "Backup file integrity verified"
        return 0
    else
        error "Backup file is corrupted"
        return 1
    fi
}

##############################################################################
# Main execution
##############################################################################

main() {
    log "========================================="
    log "Starting HRM Database Backup"
    log "========================================="
    
    # Create backup
    if ! create_backup; then
        notify_failure "Backup creation failed"
        exit 1
    fi
    
    # Verify backup
    if ! verify_backup; then
        notify_failure "Backup verification failed"
        exit 1
    fi

    # Encrypt backup if configured
    if ! encrypt_backup; then
        notify_failure "Backup encryption failed"
        exit 1
    fi
    
    # Upload to cloud
    if ! upload_to_cloud; then
        notify_failure "Cloud upload failed (local backup preserved)"
        # Don't exit - local backup is still valid
    fi
    
    # Cleanup old backups
    cleanup_old_backups
    
    log "========================================="
    log "Backup completed successfully"
    log "========================================="
    
    notify_success "Backup: ${BACKUP_COMPRESSED} ($(du -h "$BACKUP_PATH" | cut -f1))"
}

# Run main function
main "$@"
