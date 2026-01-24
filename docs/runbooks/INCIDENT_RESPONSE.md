# Incident Response Plan

**Audience:** Engineering, Security, Operations  
**Scope:** Production incidents affecting availability, integrity, or confidentiality.

---

## Severity Levels
- **P1**: Full outage, data breach, or critical security event
- **P2**: Major feature outage or severe degradation
- **P3**: Partial degradation with workaround
- **P4**: Minor issue or cosmetic defect

## Escalation Matrix
- **P1**: On-call + Engineering Lead + Security Lead + Product
- **P2**: On-call + Engineering Lead
- **P3/P4**: On-call, schedule fix in sprint

## Response Workflow
1. **Detect**: Alert or user report
2. **Triage**: Assign severity, open incident channel
3. **Mitigate**: Stop the bleeding (rollback/feature flag)
4. **Communicate**: Status updates every 30–60 minutes
5. **Resolve**: Fix root cause
6. **Postmortem**: Document root cause and action items

## Communication Templates
- **Internal:**
  - "Incident detected: [summary]. Impact: [impact]. Severity: [P1/P2]. Mitigation: [status]."
- **External:**
  - "We are investigating an issue affecting [service]. Next update in [time]."

## On-Call Procedures
- Maintain rotation calendar
- Ensure escalation contacts are current
- Use runbooks and verify mitigation steps

## Postmortem Template
- Summary
- Timeline
- Root cause
- Impact analysis
- Mitigations & follow-up actions
