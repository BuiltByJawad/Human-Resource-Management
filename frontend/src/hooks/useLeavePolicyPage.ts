'use client'

import { useCallback, useMemo, useState } from 'react'

import { useToast } from '@/components/ui/ToastProvider'
import { useAuthStore } from '@/store/useAuthStore'
import { PERMISSIONS } from '@/constants/permissions'
import { updateLeavePolicy } from '@/services/leave-policy/api'
import type {
  EditablePolicy,
  LeavePolicyPayload,
  LeavePolicyTypeConfig,
  LeaveTypeKey,
} from '@/services/leave-policy/types'

const LEAVE_TYPES: LeavePolicyTypeConfig[] = [
  { key: 'annual', label: 'Annual', defaultEntitlement: 20, defaultCarry: 5, accrualDefault: true },
  { key: 'sick', label: 'Sick', defaultEntitlement: 10, defaultCarry: 0, accrualDefault: false },
  { key: 'personal', label: 'Personal', defaultEntitlement: 5, defaultCarry: 0, accrualDefault: false },
  { key: 'maternity', label: 'Maternity', defaultEntitlement: 90, defaultCarry: 0, accrualDefault: false },
  { key: 'paternity', label: 'Paternity', defaultEntitlement: 14, defaultCarry: 0, accrualDefault: false },
  { key: 'unpaid', label: 'Unpaid', defaultEntitlement: 0, defaultCarry: 0, accrualDefault: false },
]

const normalizeHolidayList = (value: string): string[] =>
  value
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean)

const isValidIsoDate = (value: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(value)

interface UseLeavePolicyPageOptions {
  initialLeavePolicy: LeavePolicyPayload
}

export const useLeavePolicyPage = ({ initialLeavePolicy }: UseLeavePolicyPageOptions) => {
  const { showToast } = useToast()
  const { hasPermission } = useAuthStore()
  const canManage = hasPermission(PERMISSIONS.MANAGE_LEAVE_POLICIES)

  const initialPolicies = useMemo(() => {
    const policies = initialLeavePolicy.policies ?? {}
    const map: Record<LeaveTypeKey, EditablePolicy> = {} as Record<LeaveTypeKey, EditablePolicy>

    for (const type of LEAVE_TYPES) {
      const existing = policies[type.key]
      map[type.key] = {
        annualEntitlementDays: String(existing?.annualEntitlementDays ?? type.defaultEntitlement),
        carryForwardMaxDays: String(existing?.carryForwardMaxDays ?? type.defaultCarry),
        accrualEnabled: existing?.accrual?.enabled ?? type.accrualDefault,
      }
    }

    return map
  }, [initialLeavePolicy])

  const [policies, setPolicies] = useState<Record<LeaveTypeKey, EditablePolicy>>(initialPolicies)
  const [holidaysText, setHolidaysText] = useState(
    (initialLeavePolicy.calendar?.holidays ?? []).join('\n'),
  )
  const [isSaving, setIsSaving] = useState(false)

  const updatePolicyField = useCallback(
    (type: LeaveTypeKey, field: keyof EditablePolicy, value: string | boolean) => {
      setPolicies((prev) => ({
        ...prev,
        [type]: {
          ...prev[type],
          [field]: value,
        },
      }))
    },
    [],
  )

  const handleSave = useCallback(async () => {
    if (!canManage) {
      showToast('You do not have permission to manage leave policies', 'error')
      return
    }

    const holidays = normalizeHolidayList(holidaysText)
    const invalidHoliday = holidays.find((date) => !isValidIsoDate(date))
    if (invalidHoliday) {
      showToast(`Invalid holiday date: ${invalidHoliday} (use YYYY-MM-DD)`, 'error')
      return
    }

    const payload: LeavePolicyPayload = {
      policies: {},
      calendar: { holidays },
    }

    for (const type of LEAVE_TYPES) {
      const current = policies[type.key]
      const entitlement = Number(current.annualEntitlementDays)
      const carryForward = Number(current.carryForwardMaxDays)

      if (!Number.isFinite(entitlement) || entitlement < 0) {
        showToast(`${type.label}: Annual entitlement must be a valid number`, 'error')
        return
      }

      if (!Number.isFinite(carryForward) || carryForward < 0) {
        showToast(`${type.label}: Carry-forward max must be a valid number`, 'error')
        return
      }

      payload.policies![type.key] = {
        annualEntitlementDays: entitlement,
        carryForwardMaxDays: carryForward,
        accrual: {
          enabled: current.accrualEnabled,
          frequency: 'monthly',
        },
      }
    }

    setIsSaving(true)
    try {
      const ok = await updateLeavePolicy(payload)
      if (ok) {
        showToast('Leave policy saved', 'success')
        return true
      }
      showToast('Failed to save leave policy', 'error')
      return false
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to save leave policy'
      showToast(message, 'error')
      return false
    } finally {
      setIsSaving(false)
    }
  }, [canManage, holidaysText, policies, showToast])

  return {
    canManage,
    policies,
    holidaysText,
    isSaving,
    leaveTypes: LEAVE_TYPES,
    setHolidaysText,
    updatePolicyField,
    handleSave,
  }
}
