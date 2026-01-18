export type BurnoutRiskLevel = 'Critical' | 'High' | 'Medium' | 'Low'

export interface BurnoutSummary {
  totalEmployees: number
  criticalRisk: number
  highRisk: number
  mediumRisk: number
  lowRisk: number
  avgRiskScore: number
}

export interface BurnoutEmployeeMetrics {
  avgOvertimeHours: number
  totalWorkHours: number
}

export interface BurnoutEmployee {
  employeeId: string
  employeeName: string
  department: string
  riskLevel: BurnoutRiskLevel
  riskScore: number
  flags: string[]
  metrics: BurnoutEmployeeMetrics
}

export interface BurnoutAnalyticsResponse {
  summary: BurnoutSummary
  employees: BurnoutEmployee[]
}
