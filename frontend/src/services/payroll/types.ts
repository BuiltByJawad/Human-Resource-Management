import type { PayrollRecord as PayrollRecordBase } from '@/types/hrm'

export type PayrollRecord = PayrollRecordBase

export type PayrollStatus = PayrollRecord['status']

export type PayrollConfigItem = {
  name: string
  type: 'fixed' | 'percentage'
  value: number
}

export type PayrollConfig = {
  allowances: PayrollConfigItem[]
  deductions: PayrollConfigItem[]
}
