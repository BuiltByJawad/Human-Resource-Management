# SOC 2 Readiness Overview

**Scope:** HRM Platform controls for Security, Availability, and Confidentiality.

---

## Control Objectives
1. **Security:** Protect systems against unauthorized access.
2. **Availability:** Ensure systems are available for operation and use.
3. **Confidentiality:** Protect data designated as confidential.

## Policies & Procedures
- **Access Control:** Role-based access control, least privilege, and periodic access reviews.
- **Change Management:** Code review, CI checks, and controlled deployment approvals.
- **Incident Response:** Defined severity levels, escalation, and postmortem process.
- **Backup & Recovery:** Automated backups with verification and documented RTO/RPO.
- **Monitoring & Logging:** Centralized logging, alerting, and audit trails.

## Evidence Collection
- Change logs and deployment records
- Access review records
- Backup verification logs
- Incident reports and postmortems
- Security training records

## Implementation Notes
- Audit logs are stored in the database and include actor, action, and timestamp.
- Health endpoints expose readiness/liveness and dependency checks.
- Backups support verification and optional encryption.

## Gaps & Next Actions
- Independent SOC 2 audit firm selection
- Continuous evidence automation
- Formal risk assessment documentation
