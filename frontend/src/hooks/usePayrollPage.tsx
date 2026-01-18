'use client'

import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/useAuthStore'
import { useToast } from '@/components/ui/ToastProvider'
import { handleCrudError } from '@/lib/apiError'
import { PERMISSIONS } from '@/constants/permissions'
import type { PayrollRecord } from '@/services/payroll/types'
import {
  deletePayrollOverride,
  downloadPayrollPeriodCsv,
  fetchPayrollConfig,
  fetchPayrollOverride,
  fetchPayrollRecords,
  generatePayroll,
  updatePayrollConfig,
  updatePayrollStatus,
  upsertPayrollOverride,
} from '@/services/payroll/api'
import type { MarkPayrollPaidPayload } from '@/components/hrm/MarkPayrollPaidModal'

const STALE_TIME = 10 * 60 * 1000
const GC_TIME = 15 * 60 * 1000

interface UsePayrollPageOptions {
  initialPayrolls: PayrollRecord[]
}

export function usePayrollPage({ initialPayrolls }: UsePayrollPageOptions) {
  const { token } = useAuthStore()
  const { hasPermission } = useAuthStore()
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  const [selectedPayroll, setSelectedPayroll] = useState<PayrollRecord | null>(null)
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false)
  const [overrideTarget, setOverrideTarget] = useState<{ employeeId: string; payPeriod: string } | null>(null)
  const [markPaidTarget, setMarkPaidTarget] = useState<{ id: string } | null>(null)
  const [hasHydrated, setHasHydrated] = useState(false)

  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      setHasHydrated(true)
    })
    if (useAuthStore.persist.hasHydrated()) {
      setHasHydrated(true)
    }
    return unsub
  }, [])

  const canViewPayrollAction = hasHydrated && hasPermission(PERMISSIONS.VIEW_PAYROLL)
  const canConfigurePayrollAction = hasHydrated && hasPermission(PERMISSIONS.CONFIGURE_PAYROLL)
  const canManagePayrollAction = hasHydrated && hasPermission(PERMISSIONS.MANAGE_PAYROLL)

  const canViewPayrollUi = !hasHydrated || canViewPayrollAction
  const canConfigurePayrollUi = !hasHydrated || canConfigurePayrollAction
  const canManagePayrollUi = !hasHydrated || canManagePayrollAction

  const payrollQuery = useQuery<PayrollRecord[]>({
    queryKey: ['payroll', 'list'],
    queryFn: () => fetchPayrollRecords(token ?? undefined),
    enabled: !!token,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    refetchOnWindowFocus: false,
    initialData: initialPayrolls,
  })

  const payrollConfigQuery = useQuery({
    queryKey: ['payroll', 'config'],
    queryFn: () => fetchPayrollConfig(token ?? undefined),
    enabled: !!token && hasPermission(PERMISSIONS.CONFIGURE_PAYROLL),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    refetchOnWindowFocus: false,
  })

  const payrollConfigMutation = useMutation({
    mutationFn: (config: Parameters<typeof updatePayrollConfig>[0]) => updatePayrollConfig(config, token ?? undefined),
    onSuccess: () => {
      showToast('Payroll configuration saved', 'success')
      queryClient.invalidateQueries({ queryKey: ['payroll', 'config'] })
    },
    onError: (error: unknown) =>
      handleCrudError({
        error,
        resourceLabel: 'Payroll configuration',
        showToast,
      }),
  })

  const payrollOverrideQuery = useQuery({
    queryKey: ['payroll', 'override', overrideTarget?.employeeId, overrideTarget?.payPeriod],
    queryFn: () =>
      overrideTarget
        ? fetchPayrollOverride(overrideTarget.employeeId, overrideTarget.payPeriod, token ?? undefined)
        : Promise.resolve(null),
    enabled: !!token && !!overrideTarget && hasPermission(PERMISSIONS.MANAGE_PAYROLL),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    refetchOnWindowFocus: false,
  })

  const upsertPayrollOverrideMutation = useMutation({
    mutationFn: (config: Parameters<typeof upsertPayrollOverride>[2]) => {
      if (!overrideTarget) throw new Error('Override target missing')
      return upsertPayrollOverride(overrideTarget.employeeId, overrideTarget.payPeriod, config, token ?? undefined)
    },
    onSuccess: () => {
      showToast('Payroll override saved', 'success')
      queryClient.invalidateQueries({
        queryKey: ['payroll', 'override', overrideTarget?.employeeId, overrideTarget?.payPeriod],
      })
    },
    onError: (error: unknown) => handleCrudError({ error, resourceLabel: 'Payroll override', showToast }),
  })

  const deletePayrollOverrideMutation = useMutation({
    mutationFn: async () => {
      if (!overrideTarget) return false
      return deletePayrollOverride(overrideTarget.employeeId, overrideTarget.payPeriod, token ?? undefined)
    },
    onSuccess: (removed) => {
      showToast(removed ? 'Payroll override removed' : 'Payroll override not found', removed ? 'success' : 'info')
      queryClient.invalidateQueries({
        queryKey: ['payroll', 'override', overrideTarget?.employeeId, overrideTarget?.payPeriod],
      })
    },
    onError: (error: unknown) => handleCrudError({ error, resourceLabel: 'Payroll override', showToast }),
  })

  const stats = useMemo(() => {
    const list = Array.isArray(payrollQuery.data) ? payrollQuery.data : []
    const total = list.reduce((acc, curr) => acc + Number(curr.netSalary ?? 0), 0)
    const pending = list.filter((record) => record.status === 'draft').length
    const approved = list.filter((record) => record.status === 'processed').length
    const paid = list.filter((record) => record.status === 'paid').length
    return { totalCost: total, pendingCount: pending, approvedCount: approved, paidCount: paid }
  }, [payrollQuery.data])

  const generateMutation = useMutation({
    mutationFn: (payPeriod: string) => generatePayroll(payPeriod, token ?? undefined),
    onSuccess: () => {
      showToast('Payroll generated successfully!', 'success')
      queryClient.invalidateQueries({ queryKey: ['payroll', 'list'] })
    },
    onError: (error: unknown) =>
      handleCrudError({
        error,
        resourceLabel: 'Payroll generation',
        showToast,
      }),
  })

  const statusMutation = useMutation({
    mutationFn: (args: { id: string; status: PayrollRecord['status']; meta?: MarkPayrollPaidPayload }) => {
      if (args.meta) {
        return updatePayrollStatus(args.id, args.status, args.meta, token ?? undefined)
      }
      return updatePayrollStatus(args.id, args.status, token ?? undefined)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll', 'list'] })
    },
    onError: (error: unknown) =>
      handleCrudError({
        error,
        resourceLabel: 'Payroll status',
        showToast,
      }),
  })

  return {
    payrollQuery,
    payrollConfigQuery,
    payrollConfigMutation,
    payrollOverrideQuery,
    upsertPayrollOverrideMutation,
    deletePayrollOverrideMutation,
    stats,
    generateMutation,
    statusMutation,
    selectedPayroll,
    setSelectedPayroll,
    isGenerateModalOpen,
    setIsGenerateModalOpen,
    isExportModalOpen,
    setIsExportModalOpen,
    isModalOpen,
    setIsModalOpen,
    isConfigModalOpen,
    setIsConfigModalOpen,
    overrideTarget,
    setOverrideTarget,
    markPaidTarget,
    setMarkPaidTarget,
    hasHydrated,
    canViewPayrollAction,
    canConfigurePayrollAction,
    canManagePayrollAction,
    canViewPayrollUi,
    canConfigurePayrollUi,
    canManagePayrollUi,
    handleExportPeriodCsv: async (payPeriod: string) => {
      await downloadPayrollPeriodCsv(payPeriod, token ?? undefined)
    },
    showToast,
    token,
  }
}
