export type LeaveTypeKey = 'annual' | 'sick' | 'personal' | 'maternity' | 'paternity' | 'unpaid'

export interface LeavePolicyEntry {
  annualEntitlementDays: number
  carryForwardMaxDays?: number
  accrual?: {
    enabled: boolean
    frequency: 'monthly'
  }
}

export interface LeavePolicyPayload {
  policies?: Partial<Record<LeaveTypeKey, LeavePolicyEntry>>
  calendar?: {
    holidays?: string[]
  }
}

export interface LeavePolicyTypeConfig {
  key: LeaveTypeKey
  label: string
  defaultEntitlement: number
  defaultCarry: number
  accrualDefault: boolean
}

export interface EditablePolicy {
  annualEntitlementDays: string
  carryForwardMaxDays: string
  accrualEnabled: boolean
}
