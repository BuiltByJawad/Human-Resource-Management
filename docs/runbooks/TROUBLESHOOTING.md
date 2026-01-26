# Troubleshooting Guide

**Audience:** Support, Engineering  
**Scope:** Common production issues and recovery steps.

---

## Authentication Issues
- Verify auth service availability
- Check JWT secrets and token expiry settings
- Validate Redis connectivity for session caching
- Confirm refresh token cookie is set on login
- Review audit logs for failed login attempts

## Database Issues
- Check connectivity via `/health`
- Validate Prisma migration status
- Review DB logs for slow queries or locks
- Confirm database user has required privileges
- Run a basic connectivity check:
  - `SELECT 1;` via psql
  - `npm run prisma:migrate:status`
- Restore from the latest verified backup if corruption is detected

## Performance Degradation
- Check CPU/memory usage
- Review p95 latency
- Identify noisy endpoints
- Inspect background job queues
- Review database query performance and missing indexes
- Inspect Redis latency and cache hit ratio
- Verify rate limiting is not over-throttling critical endpoints

## File Upload Issues
- Verify storage permissions
- Check disk space status in `/health`

## Notifications/Email Failures
- Verify SMTP credentials
- Review outbound queue logs
- Re-send from audit logs if needed

## Recovery Checklist
- [ ] Identify root cause
- [ ] Apply mitigation
- [ ] Validate system health
- [ ] Validate `/health/ready` returns ready
- [ ] Document resolution
