export type PayrollStatus = 'draft' | 'processed' | 'paid' | 'error'

export interface PayrollRecord {
  id: string
  payPeriod: string
  netSalary: number
  baseSalary?: number
  allowances?: number
  allowancesBreakdown?: { name: string; amount: number }[]
  deductions?: number
  deductionsBreakdown?: { name: string; amount: number }[]
  bonuses?: number
  bonusesBreakdown?: { name: string; amount: number }[]
  taxes?: number
  benefits?: number
  status: PayrollStatus
  processedAt?: string
  paymentDate?: string
  employee: {
    firstName: string
    lastName: string
    employeeNumber: string
    department?: { name: string }
  }
}
