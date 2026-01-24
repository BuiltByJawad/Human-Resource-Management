# Disaster Recovery Plan

**System:** HRM Platform  
**RTO:** 4 hours  
**RPO:** 1 hour

---

## Recovery Scenarios
- Primary database outage
- Region-level infrastructure failure
- Accidental data deletion

## Recovery Procedures
1. Declare incident and assemble response team
2. Validate latest backup and integrity report
3. Provision/verify standby database instance
4. Restore database to standby environment
5. Apply any pending migrations if required
6. Repoint services to restored database
7. Verify core workflows (auth, payroll, attendance)
8. Communicate status to stakeholders

## Backup Strategy
- Daily full backups with retention policy
- Backup verification run after each backup cycle
- Offsite storage for disaster recovery

## Failover Runbook
- Promote standby database
- Update environment configuration (DATABASE_URL, READ_REPLICA if used)
- Restart services and verify health checks
- Verify `/health/ready` and critical API endpoints

## Rollback Procedures
- If recovery fails, restore previous snapshot
- Validate data consistency
- Document root cause and remediations

## Testing Schedule
- DR simulation exercises quarterly
- Document outcomes and action items
