import api from '@/lib/axios'
import type {
  ComplianceLog,
  ComplianceRule,
  ComplianceRunResult,
} from '@/features/compliance/types/compliance.types'

const withAuthConfig = (token?: string) => (token ? { headers: { Authorization: `Bearer ${token}` } } : undefined)

const extractStatusCode = (error: unknown): number | undefined => {
  if (typeof error !== 'object' || error === null) {
    return undefined
  }
  const maybeResponse = (error as { response?: { status?: number } }).response
  return maybeResponse?.status
}

export async function fetchComplianceRules(token?: string): Promise<ComplianceRule[]> {
  try {
    const response = await api.get('/compliance/rules', withAuthConfig(token))
    const payload = response.data
    const root = (payload as { data?: unknown }).data ?? payload

    if (Array.isArray(root)) return root as ComplianceRule[]

    if (root && typeof root === 'object') {
      const dataField = (root as { data?: unknown; items?: unknown }).data
      const itemsField = (root as { data?: unknown; items?: unknown }).items

      if (Array.isArray(dataField)) return dataField as ComplianceRule[]
      if (Array.isArray(itemsField)) return itemsField as ComplianceRule[]

      const nestedData = (root as { data?: { data?: unknown } }).data
      if (nestedData && typeof nestedData === 'object') {
        const inner = (nestedData as { data?: unknown }).data
        if (Array.isArray(inner)) return inner as ComplianceRule[]
      }
    }

    return []
  } catch (error: unknown) {
    const status = extractStatusCode(error)
    if (status === 401 || status === 404) return []
    throw error
  }
}

export async function fetchComplianceLogs(token?: string): Promise<ComplianceLog[]> {
  try {
    const response = await api.get('/compliance/logs', withAuthConfig(token))
    const payload = response.data
    const root = (payload as { data?: unknown }).data ?? payload

    if (Array.isArray(root)) return root as ComplianceLog[]

    if (root && typeof root === 'object') {
      const dataField = (root as { data?: unknown; items?: unknown }).data
      const itemsField = (root as { data?: unknown; items?: unknown }).items

      if (Array.isArray(dataField)) return dataField as ComplianceLog[]
      if (Array.isArray(itemsField)) return itemsField as ComplianceLog[]

      const nestedData = (root as { data?: { data?: unknown } }).data
      if (nestedData && typeof nestedData === 'object') {
        const inner = (nestedData as { data?: unknown }).data
        if (Array.isArray(inner)) return inner as ComplianceLog[]
      }
    }

    return []
  } catch (error: unknown) {
    const status = extractStatusCode(error)
    if (status === 401 || status === 404) return []
    throw error
  }
}

export async function createComplianceRule(
  payload: Partial<ComplianceRule>,
  token?: string,
): Promise<ComplianceRule> {
  const response = await api.post('/compliance/rules', payload, withAuthConfig(token))
  const data = response.data?.data ?? response.data
  return data as ComplianceRule
}

export async function toggleComplianceRule(
  ruleId: string,
  token?: string,
): Promise<ComplianceRule | null> {
  const response = await api.patch(`/compliance/rules/${ruleId}/toggle`, undefined, withAuthConfig(token))
  const data = response.data?.data ?? response.data
  if (!data || typeof data !== 'object') return null
  return data as ComplianceRule
}

export async function runComplianceCheck(token?: string): Promise<ComplianceRunResult | null> {
  const response = await api.post('/compliance/run', undefined, withAuthConfig(token))
  const data = response.data?.data ?? response.data
  if (!data || typeof data !== 'object') return null
  return data as ComplianceRunResult
}
