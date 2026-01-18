export interface ComplianceRule {
  id: string
  name: string
  description?: string
  type: string
  threshold: number
  isActive: boolean
}

export interface ComplianceLogEmployeeDepartmentSummary {
  name: string
}

export interface ComplianceLogEmployeeSummary {
  firstName: string
  lastName: string
  department?: ComplianceLogEmployeeDepartmentSummary
}

export interface ComplianceLogRuleSummary {
  name: string
}

export interface ComplianceLog {
  id: string
  violationDate: string
  details: string
  status: string
  employee: ComplianceLogEmployeeSummary
  rule: ComplianceLogRuleSummary
}

export interface ComplianceRunResult {
  message?: string
}
