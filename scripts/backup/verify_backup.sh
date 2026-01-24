#!/bin/bash

##############################################################################
# Backup Verification Script
#
# - Verifies gzip integrity of the latest database backup
# - Runs restore verification (scripts/backup-verification.ts)
# - Emits exit codes for scheduler/monitoring
##############################################################################

set -e
set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "${SCRIPT_DIR}")"
BACKUP_DIR="${PROJECT_ROOT}/backups"
LOG_FILE="${PROJECT_ROOT}/backups/backup-verify.log"

log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

latest_backup() {
  ls -t "${BACKUP_DIR}"/hrm_backup_*.sql.gz 2>/dev/null | head -n 1
}

main() {
  mkdir -p "${BACKUP_DIR}"

  local backup_file
  backup_file=$(latest_backup || true)

  if [ -z "$backup_file" ]; then
    log "No backups found to verify"
    exit 1
  fi

  log "Verifying backup integrity: ${backup_file}"
  if gzip -t "$backup_file"; then
    log "Backup gzip integrity check passed"
  else
    log "Backup gzip integrity check failed"
    exit 1
  fi

  log "Running restore verification"
  (cd "${PROJECT_ROOT}/backend" && npm run backup:verify)

  log "Backup verification completed successfully"
}

main
