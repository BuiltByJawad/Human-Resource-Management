#!/bin/bash

##############################################################################
# Redis Backup Script
#
# This script performs Redis backups using BGSAVE with:
# - Timestamped snapshots
# - Optional cloud upload
# - Basic retention cleanup
##############################################################################

set -e
set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${PROJECT_ROOT}/backups/redis"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

REDIS_HOST="${REDIS_HOST:-127.0.0.1}"
REDIS_PORT="${REDIS_PORT:-6379}"
REDIS_PASSWORD="${REDIS_PASSWORD:-}"

CLOUD_PROVIDER="${CLOUD_PROVIDER:-none}"
S3_BUCKET="${S3_BUCKET:-}"
AZURE_CONTAINER="${AZURE_CONTAINER:-}"
GCS_BUCKET="${GCS_BUCKET:-}"

DAILY_RETENTION=${DAILY_RETENTION:-30}

log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*"
}

error() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $*" >&2
}

redis_cmd() {
  if [ -n "$REDIS_PASSWORD" ]; then
    redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASSWORD" "$@"
  else
    redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" "$@"
  fi
}

create_backup() {
  log "Starting Redis BGSAVE..."
  redis_cmd BGSAVE

  while true; do
    local status
    status=$(redis_cmd INFO persistence | grep -E "rdb_bgsave_in_progress" | cut -d: -f2 | tr -d '\r')
    if [ "$status" = "0" ]; then
      break
    fi
    sleep 1
  done

  local rdb_path
  rdb_path=$(redis_cmd CONFIG GET dir | tail -n 1)
  local rdb_file
  rdb_file=$(redis_cmd CONFIG GET dbfilename | tail -n 1)

  mkdir -p "$BACKUP_DIR"
  local source_file="${rdb_path}/${rdb_file}"
  local target_file="${BACKUP_DIR}/redis_${TIMESTAMP}.rdb"

  if [ ! -f "$source_file" ]; then
    error "RDB file not found at ${source_file}"
    exit 1
  fi

  cp "$source_file" "$target_file"
  log "Backup created: ${target_file}"
}

upload_to_cloud() {
  if [ "$CLOUD_PROVIDER" = "none" ]; then
    log "Cloud backup disabled, skipping upload"
    return 0
  fi

  local latest_file
  latest_file=$(ls -t "$BACKUP_DIR"/*.rdb | head -n 1)

  case "$CLOUD_PROVIDER" in
    s3)
      [ -n "$S3_BUCKET" ] || { error "S3_BUCKET not configured"; return 1; }
      aws s3 cp "$latest_file" "s3://${S3_BUCKET}/backups/" ;;
    azure)
      [ -n "$AZURE_CONTAINER" ] || { error "AZURE_CONTAINER not configured"; return 1; }
      az storage blob upload --container-name "$AZURE_CONTAINER" --file "$latest_file" --name "backups/$(basename "$latest_file")" ;;
    gcp)
      [ -n "$GCS_BUCKET" ] || { error "GCS_BUCKET not configured"; return 1; }
      gsutil cp "$latest_file" "gs://${GCS_BUCKET}/backups/" ;;
    *)
      error "Unknown cloud provider: $CLOUD_PROVIDER"; return 1 ;;
  esac

  log "Upload completed successfully"
}

cleanup_old_backups() {
  log "Cleaning up backups older than ${DAILY_RETENTION} days"
  find "$BACKUP_DIR" -name "redis_*.rdb" -mtime +"$DAILY_RETENTION" -delete
}

main() {
  create_backup
  upload_to_cloud
  cleanup_old_backups
}

main
