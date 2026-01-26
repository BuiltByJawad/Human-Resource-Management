# Backup Operations

## Schedule Recommendations
- **Database**: Hourly incremental + nightly full backup
- **Redis**: Hourly snapshot
- **Verification**: Daily restore test after full backup

## Encryption Notes
- Encrypt backups at rest using cloud KMS (AWS KMS, Azure Key Vault, GCP KMS).
- If storing locally, encrypt archives with GPG before upload.
- Ensure backup keys are rotated and access-controlled.

### GPG Encryption (Local)
- Enable: `BACKUP_ENCRYPTION_ENABLED=true`
- Passphrase: `BACKUP_ENCRYPTION_PASSPHRASE=your-strong-passphrase`
- Requires `gpg` installed on the backup host

## Execution
- `scripts/backup-database.sh` for PostgreSQL backups
- `scripts/backup/redis_backup.sh` for Redis snapshots
- `scripts/backup/verify_backup.sh` for integrity + restore verification
- `scripts/backup-verification.ts` for restore verification

## Alerts
- Slack: set `SLACK_WEBHOOK_URL` in environment
- Email: set `BACKUP_NOTIFICATION_EMAIL` in environment

## Storage
- Store offsite backups in a separate account/project.
- Apply retention policies and lifecycle rules in cloud storage.
