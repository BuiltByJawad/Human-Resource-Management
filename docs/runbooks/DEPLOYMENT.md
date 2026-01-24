# Deployment Runbook

**Audience:** Engineering, DevOps  
**Scope:** Production deployments for HRM Platform

---

## 1. Preconditions
- Approved release tag and changelog
- All tests green (unit + integration)
- Required environment variables validated
- Backups verified within last 24 hours

## 2. Pre-Deployment Checklist
- [ ] Confirm maintenance window (if required)
- [ ] Verify database migration plan
- [ ] Confirm rollback artifact is available
- [ ] Notify stakeholders if downtime expected
- [ ] Review error budgets/SLA impact

## 3. Deployment Steps
1. Pull release artifacts (Docker image or build)
2. Apply configuration changes (secrets, env)
3. Run database migrations
4. Deploy backend service
5. Deploy frontend service
6. Warm caches (if applicable)
7. Verify health checks:
   - `/health`
   - `/health/live`
   - `/health/ready`

## 4. Post-Deployment Verification
- [ ] Smoke test login flow
- [ ] Verify key APIs (auth, employees, payroll)
- [ ] Check logs for errors and elevated latency
- [ ] Validate background jobs / scheduler

## 5. Rollback Procedures
- Redeploy previous stable build
- Roll back database migrations (if reversible)
- Validate data integrity
- Notify stakeholders of rollback

## 5.1 Environment Configuration
- Validate required backend env vars (JWT secrets, database, redis, SMTP)
- Validate frontend env vars (NEXT_PUBLIC_API_URL, BACKEND_URL)
- Confirm secrets are sourced from secure store (not committed)

## 6. Monitoring
- Confirm error rate < 1%
- Confirm p95 latency within target thresholds
- Verify alerting channels

## 7. Ownership
- **Release Manager**: Coordinates deployment
- **DevOps**: Executes infra changes
- **QA**: Validates post-deploy checks
