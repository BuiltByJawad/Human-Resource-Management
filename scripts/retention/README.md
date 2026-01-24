# Data Retention Cleanup

This folder contains the retention cleanup job for expiring data.

## Cleanup Script

- **Script:** `backend/scripts/retention-cleanup.ts`
- **Command:** `npm run retention:cleanup` (run inside `backend`)

## Schedule Recommendations

- **Daily** execution during off-peak hours.
- Ensure `DATABASE_URL` is available to the job runner.

### Linux cron (daily at 2am)
```cron
0 2 * * * cd /path/to/hrm/backend && npm run retention:cleanup >> /var/log/hrm-retention.log 2>&1
```

### Windows Task Scheduler (PowerShell action)
```powershell
Set-Location -Path "C:\path\to\hrm\backend"
cmd /c "npm run retention:cleanup"
```

## Notes

- Cleanup logic aligns with `RETENTION_POLICY.md`.
- Review anonymization output before enabling in production.
