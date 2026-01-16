'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useAuthStore } from '@/store/useAuthStore'
import { useToast } from '@/components/ui/ToastProvider'
import { PERMISSIONS } from '@/constants/permissions'
import {
  getPerformanceCycles,
  getPerformanceReviews,
  createPerformanceCycleApi,
  submitPerformanceReviewApi,
  summarizePerformanceReviewsApi,
  type ReviewCycle,
  type PerformanceReview,
  type CreatePerformanceCyclePayload,
  type SubmitPerformanceReviewPayload,
} from '@/services/performance/api'
import type { PerformanceSummaryRequest } from '@/types/hrm'

export type TabKey = 'active' | 'past' | 'team'

export interface PerformanceReviewFormValues {
  ratings: Record<string, number>
  comments: string
}

export interface UsePerformancePageProps {
  initialCycles?: ReviewCycle[]
  initialReviews?: PerformanceReview[]
  currentUserId?: string | null
  initialCanManageCycles?: boolean
}

export function usePerformancePage({
  initialCycles = [],
  initialReviews = [],
  currentUserId = null,
  initialCanManageCycles = false,
}: UsePerformancePageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const { user, token, hasPermission } = useAuthStore()
  const { showToast } = useToast()

  const [mounted, setMounted] = useState(false)
  const [selectedCycle, setSelectedCycle] = useState<ReviewCycle | null>(null)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [summary, setSummary] = useState('')
  const [activeTab, setActiveTab] = useState<TabKey>('active')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const resolvedUserId = user?.id ?? currentUserId ?? null
  const storeCanManageCycles = hasPermission(PERMISSIONS.MANAGE_PERFORMANCE_CYCLES)
  const canManageCycles = storeCanManageCycles || initialCanManageCycles

  const {
    data: cycles = initialCycles,
    isLoading: cyclesLoading,
  } = useQuery<ReviewCycle[]>({
    queryKey: ['performance', 'cycles', token],
    queryFn: () => getPerformanceCycles(token ?? undefined),
    enabled: !!token,
    staleTime: 10 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    initialData: initialCycles,
    placeholderData: () => queryClient.getQueryData<ReviewCycle[]>(['performance', 'cycles', token]) ?? initialCycles,
  })

  const {
    data: userReviews = initialReviews,
    isLoading: reviewsLoading,
  } = useQuery<PerformanceReview[]>({
    queryKey: ['performance', 'reviews', resolvedUserId],
    queryFn: () => getPerformanceReviews(resolvedUserId ?? '', token ?? undefined),
    enabled: !!token && !!resolvedUserId,
    staleTime: 10 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    initialData: initialReviews,
    placeholderData: () =>
      queryClient.getQueryData<PerformanceReview[]>(['performance', 'reviews', resolvedUserId]) ?? initialReviews,
  })

  const createCycleMutation = useMutation({
    mutationFn: (data: CreatePerformanceCyclePayload) => createPerformanceCycleApi(data, token ?? undefined),
    onSuccess: () => {
      showToast('Review cycle created successfully', 'success')
      setIsCreateModalOpen(false)
      queryClient.invalidateQueries({ queryKey: ['performance', 'cycles', token] })
    },
    onError: (error: unknown) => {
      showToast(
        error instanceof Error ? error.message : 'Failed to create review cycle',
        'error',
      )
    },
  })

  const summarizeMutation = useMutation({
    mutationFn: (payload: PerformanceSummaryRequest) => summarizePerformanceReviewsApi(payload, token ?? undefined),
    onSuccess: (data) => {
      setSummary(data?.summary ?? '')
    },
    onError: (error: unknown) => {
      showToast(error instanceof Error ? error.message : 'Failed to generate summary', 'error')
    },
  })

  const submitReviewMutation = useMutation({
    mutationFn: (data: SubmitPerformanceReviewPayload) => submitPerformanceReviewApi(data, token ?? undefined),
    onSuccess: () => {
      showToast('Review submitted successfully', 'success')
      setIsReviewModalOpen(false)
      setSelectedCycle(null)
      queryClient.invalidateQueries({ queryKey: ['performance', 'reviews', resolvedUserId] })
      summarizeMutation.mutate({ reviews: [{}] })
    },
    onError: (error: unknown) => {
      showToast(error instanceof Error ? error.message : 'Failed to submit review', 'error')
    },
  })

  useEffect(() => {
    const tabParam = searchParams.get('tab')?.toLowerCase()
    if (tabParam === 'active' || tabParam === 'past' || tabParam === 'team') {
      setActiveTab(tabParam as TabKey)
    }
  }, [searchParams])

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleCreateCycle = useCallback(
    (data: CreatePerformanceCyclePayload) => createCycleMutation.mutate(data),
    [createCycleMutation],
  )

  const handleSubmitReview = useCallback(
    (data: PerformanceReviewFormValues) => {
      if (!resolvedUserId || !selectedCycle) return
      submitReviewMutation.mutate({
        employeeId: resolvedUserId,
        reviewerId: resolvedUserId,
        cycleId: selectedCycle.id,
        type: 'self',
        ...data,
      })
    },
    [resolvedUserId, selectedCycle, submitReviewMutation],
  )

  const generateSummary = useCallback(() => {
    summarizeMutation.mutate({ reviews: [{}] })
  }, [summarizeMutation])

  const stats = useMemo(
    () => [
      {
        name: 'Pending Reviews',
        value: (cycles?.length ?? 0) - (userReviews?.length ?? 0),
        color: 'text-orange-600',
        bg: 'bg-orange-100',
      },
      {
        name: 'Completed Reviews',
        value: userReviews?.length ?? 0,
        color: 'text-green-600',
        bg: 'bg-green-100',
      },
      {
        name: 'Avg. Rating',
        value: '4.8',
        color: 'text-blue-600',
        bg: 'bg-blue-100',
      },
    ],
    [cycles?.length, userReviews?.length],
  )

  const pendingCycles = useMemo(
    () => cycles.filter((cycle) => !userReviews.some((review) => review.cycleId === cycle.id)),
    [cycles, userReviews],
  )

  const completedCycles = useMemo(
    () => cycles.filter((cycle) => userReviews.some((review) => review.cycleId === cycle.id)),
    [cycles, userReviews],
  )

  const selectedReview = selectedCycle
    ? userReviews.find((review) => review.cycleId === selectedCycle.id) || undefined
    : undefined

  const selectedReviewInitialData = selectedReview
    ? {
        ratings: selectedReview.ratings ?? {},
        comments: selectedReview.comments ?? '',
      }
    : undefined

  const handleTabChange = useCallback(
    (tabKey: TabKey) => {
      setActiveTab(tabKey)
      const params = new URLSearchParams(searchParams.toString())
      params.set('tab', tabKey)
      router.replace(`/performance?${params.toString()}`)
    },
    [router, searchParams],
  )

  const openReview = useCallback((cycle: ReviewCycle) => {
    setSelectedCycle(cycle)
    setIsReviewModalOpen(true)
  }, [])

  const closeReview = useCallback(() => {
    setIsReviewModalOpen(false)
    setSelectedCycle(null)
  }, [])

  const showSkeleton =
    cyclesLoading &&
    reviewsLoading &&
    (!cycles || cycles.length === 0) &&
    (!userReviews || userReviews.length === 0)

  return {
    activeTab,
    handleTabChange,
    stats,
    pendingCycles,
    completedCycles,
    selectedCycle,
    selectedReviewInitialData,
    reviewReadOnly: !!selectedReview,
    isReviewModalOpen,
    openReview,
    closeReview,
    handleSubmitReview,
    isCreateModalOpen,
    setIsCreateModalOpen,
    handleCreateCycle,
    createCycleLoading: createCycleMutation.isPending,
    summary,
    generateSummary,
    summarizeLoading: summarizeMutation.isPending,
    canManageCycles,
    showSkeleton,
    mounted,
  }
}
