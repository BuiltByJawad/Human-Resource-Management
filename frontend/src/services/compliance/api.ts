import type {
  ComplianceLog,
  ComplianceRule,
  ComplianceRunResult,
} from '@/services/compliance/types'
import {
  createComplianceRule as createComplianceRuleLegacy,
  fetchComplianceLogs as fetchComplianceLogsLegacy,
  fetchComplianceRules as fetchComplianceRulesLegacy,
  runComplianceCheck as runComplianceCheckLegacy,
  toggleComplianceRule as toggleComplianceRuleLegacy,
} from '@/lib/hrmData'

export const fetchComplianceRules = (token?: string): Promise<ComplianceRule[]> => fetchComplianceRulesLegacy(token)

export const fetchComplianceLogs = (token?: string): Promise<ComplianceLog[]> => fetchComplianceLogsLegacy(token)

export const createComplianceRule = (payload: Partial<ComplianceRule>, token?: string): Promise<ComplianceRule> =>
  createComplianceRuleLegacy(payload, token)

export const toggleComplianceRule = (ruleId: string, token?: string): Promise<ComplianceRule | null> =>
  toggleComplianceRuleLegacy(ruleId, token)

export const runComplianceCheck = (token?: string): Promise<ComplianceRunResult | null> => runComplianceCheckLegacy(token)

