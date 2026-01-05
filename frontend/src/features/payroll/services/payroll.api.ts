import api from '@/lib/axios'
import type { PayrollRecord, PayrollStatus } from '@/features/payroll/types/payroll.types'

const withAuthConfig = (token?: string) => (token ? { headers: { Authorization: `Bearer ${token}` } } : undefined)

export async function fetchPayrollRecords(token?: string): Promise<PayrollRecord[]> {
  const response = await api.get('/payroll', withAuthConfig(token))
  const payload = response.data
  const root = (payload as { data?: unknown }).data ?? payload ?? []

  if (Array.isArray(root)) return root as PayrollRecord[]

  const items = (root as { items?: unknown[] }).items
  if (Array.isArray(items)) return items as PayrollRecord[]

  const payrolls = (root as { payrolls?: unknown[] }).payrolls
  if (Array.isArray(payrolls)) return payrolls as PayrollRecord[]

  return []
}

export async function generatePayroll(payPeriod: string, token?: string): Promise<void> {
  await api.post(
    '/payroll/generate',
    { payPeriod },
    {
      ...withAuthConfig(token),
    },
  )
}

export async function updatePayrollStatus(payrollId: string, status: PayrollStatus, token?: string): Promise<void> {
  await api.patch(`/payroll/${payrollId}/status`, { status }, withAuthConfig(token))
}
