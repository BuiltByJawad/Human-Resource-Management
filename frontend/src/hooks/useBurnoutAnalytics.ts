'use client'

import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { useToast } from '@/components/ui/ToastProvider'
import { PERMISSIONS } from '@/constants/permissions'
import { handleCrudError } from '@/lib/apiError'
import { fetchBurnoutAnalytics } from '@/services/analytics/burnout/api'
import type { BurnoutAnalyticsResponse } from '@/services/analytics/burnout/types'

interface UseBurnoutAnalyticsOptions {
  initialPeriod: number
  initialData: BurnoutAnalyticsResponse | null
  canViewAnalytics: boolean
}

const FALLBACK_PERIOD = 30

export function useBurnoutAnalytics({ initialPeriod, initialData, canViewAnalytics }: UseBurnoutAnalyticsOptions) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, token, hasPermission } = useAuthStore()
  const { showToast } = useToast()

  const periodFromSearch = useMemo(() => {
    const param = searchParams.get('period')
    const parsed = param ? Number.parseInt(param, 10) : initialPeriod
    return Number.isNaN(parsed) ? FALLBACK_PERIOD : parsed
  }, [initialPeriod, searchParams])

  const [period, setPeriod] = useState(periodFromSearch)

  useEffect(() => {
    setPeriod(periodFromSearch)
  }, [periodFromSearch])

  const resolvedCanView = canViewAnalytics || hasPermission(PERMISSIONS.VIEW_ANALYTICS)

  const analyticsQuery = useQuery({
    queryKey: ['burnout-analytics', period, token],
    queryFn: () => fetchBurnoutAnalytics(period),
    enabled: !!token && !!user && resolvedCanView,
    retry: false,
    staleTime: 5 * 60 * 1000,
    initialData: period === initialPeriod ? initialData ?? undefined : undefined,
    refetchOnMount: false,
  })

  useEffect(() => {
    if (analyticsQuery.isError && analyticsQuery.error) {
      handleCrudError({ error: analyticsQuery.error, resourceLabel: 'Burnout analytics', showToast })
    }
  }, [analyticsQuery.isError, analyticsQuery.error, showToast])

  const handlePeriodChange = (value: string) => {
    const next = Number(value)
    setPeriod(next)
    const params = new URLSearchParams(searchParams.toString())
    params.set('period', value)
    router.replace(`/analytics/burnout?${params.toString()}`)
  }

  return {
    period,
    setPeriod,
    analyticsQuery,
    handlePeriodChange,
    resolvedCanView,
  }
}
