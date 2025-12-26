"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { PlusIcon, ChartBarIcon, ClipboardDocumentCheckIcon, ArrowLeftIcon } from "@heroicons/react/24/outline"

import { useAuthStore } from "@/store/useAuthStore"
import { useToast } from "@/components/ui/ToastProvider"
import { PERMISSIONS } from "@/constants/permissions"
import {
  ReviewCycleCard,
  ReviewForm,
  FeedbackSummary,
  CreateCycleModal,
} from "@/components/hrm/performance"
import { Button } from "@/components/ui/FormComponents"
import {
  fetchPerformanceCycles,
  fetchPerformanceReviews,
  createPerformanceCycle,
  submitPerformanceReview,
  summarizePerformanceReviews,
} from "@/lib/hrmData"
import { handleCrudError } from "@/lib/apiError"

type TabKey = "active" | "past" | "team"

interface PerformancePageClientProps {
  initialCycles?: any[]
  initialReviews?: any[]
  currentUserId?: string | null
  canManageCycles?: boolean
}

export function PerformancePageClient({
  initialCycles = [],
  initialReviews = [],
  currentUserId = null,
  canManageCycles: initialCanManageCycles = false,
}: PerformancePageClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const { user, token, hasPermission } = useAuthStore()
  const { showToast } = useToast()

  const [mounted, setMounted] = useState(false)
  const [selectedCycle, setSelectedCycle] = useState<any>(null)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [summary, setSummary] = useState("")
  const [activeTab, setActiveTab] = useState<TabKey>("active")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const resolvedUserId = user?.id ?? currentUserId ?? null
  const storeCanManageCycles = hasPermission(PERMISSIONS.MANAGE_PERFORMANCE_CYCLES)
  const canManageCycles = storeCanManageCycles || initialCanManageCycles

  const {
    data: cycles = initialCycles,
    isLoading: cyclesLoading,
  } = useQuery<any[]>({
    queryKey: ["performance", "cycles", token],
    queryFn: () => fetchPerformanceCycles(token ?? undefined),
    enabled: !!token,
    staleTime: 10 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    initialData: initialCycles,
    placeholderData: () => queryClient.getQueryData<any[]>(["performance", "cycles", token]) ?? initialCycles,
  })

  const {
    data: userReviews = initialReviews,
    isLoading: reviewsLoading,
  } = useQuery<any[]>({
    queryKey: ["performance", "reviews", resolvedUserId],
    queryFn: () => fetchPerformanceReviews(resolvedUserId ?? "", token ?? undefined),
    enabled: !!token && !!resolvedUserId,
    staleTime: 10 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    initialData: initialReviews,
    placeholderData: () => queryClient.getQueryData<any[]>(["performance", "reviews", resolvedUserId]) ?? initialReviews,
  })

  const createCycleMutation = useMutation({
    mutationFn: (data: any) => createPerformanceCycle(data, token ?? undefined),
    onSuccess: () => {
      showToast("Review cycle created successfully", "success")
      setIsCreateModalOpen(false)
      queryClient.invalidateQueries({ queryKey: ["performance", "cycles", token] })
    },
    onError: (error) => {
      handleCrudError({
        error,
        resourceLabel: "Review cycle",
        showToast,
        onUnauthorized: () => console.warn("Not authorized to create cycles"),
      })
    },
  })

  const summarizeMutation = useMutation({
    mutationFn: (payload: any) => summarizePerformanceReviews(payload, token ?? undefined),
    onSuccess: (data: any) => {
      setSummary(data?.summary ?? "")
    },
    onError: (error) => {
      handleCrudError({
        error,
        resourceLabel: "Performance summary",
        showToast,
        onUnauthorized: () => console.warn("Not authorized to summarize reviews"),
      })
    },
  })

  const submitReviewMutation = useMutation({
    mutationFn: (data: any) => submitPerformanceReview(data, token ?? undefined),
    onSuccess: () => {
      showToast("Review submitted successfully", "success")
      setIsReviewModalOpen(false)
      queryClient.invalidateQueries({ queryKey: ["performance", "reviews", resolvedUserId] })
      summarizeMutation.mutate({ reviews: [{}] })
    },
    onError: (error) => {
      handleCrudError({
        error,
        resourceLabel: "Performance review",
        showToast,
        onUnauthorized: () => console.warn("Not authorized to submit reviews"),
      })
    },
  })

  useEffect(() => {
    const tabParam = searchParams.get("tab")
    if (!tabParam) return
    const normalized = tabParam.toLowerCase()
    if (normalized === "active" || normalized === "past" || normalized === "team") {
      setActiveTab(normalized as TabKey)
    }
  }, [searchParams])

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleCreateCycle = (data: any) => createCycleMutation.mutate(data)

  const handleSubmitReview = (data: any) => {
    if (!resolvedUserId || !selectedCycle) return
    submitReviewMutation.mutate({
      employeeId: resolvedUserId,
      reviewerId: resolvedUserId,
      cycleId: selectedCycle.id,
      type: "self",
      ...data,
    })
  }

  const generateSummary = () => {
    summarizeMutation.mutate({ reviews: [{}] })
  }

  const stats = useMemo(
    () => [
      {
        name: "Pending Reviews",
        value: (cycles?.length ?? 0) - (userReviews?.length ?? 0),
        icon: ClipboardDocumentCheckIcon,
        color: "text-orange-600",
        bg: "bg-orange-100",
      },
      { name: "Completed Reviews", value: userReviews?.length ?? 0, icon: ChartBarIcon, color: "text-green-600", bg: "bg-green-100" },
      { name: "Avg. Rating", value: "4.8", icon: ChartBarIcon, color: "text-blue-600", bg: "bg-blue-100" },
    ],
    [cycles?.length, userReviews?.length],
  )

  const pendingCycles = (Array.isArray(cycles) ? cycles : []).filter(
    (cycle: any) => !(Array.isArray(userReviews) ? userReviews : []).some((r: any) => r.cycleId === cycle.id),
  )
  const completedCycles = (Array.isArray(cycles) ? cycles : []).filter((cycle: any) =>
    (Array.isArray(userReviews) ? userReviews : []).some((r: any) => r.cycleId === cycle.id),
  )

  const selectedReview = selectedCycle
    ? (Array.isArray(userReviews) ? userReviews : []).find((r: any) => r.cycleId === selectedCycle.id) || undefined
    : undefined

  const handleTabChange = (tabKey: TabKey) => {
    setActiveTab(tabKey)
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", tabKey)
    router.replace(`/performance?${params.toString()}`)
  }

  if (!mounted) {
    return null
  }

  const showSkeleton =
    cyclesLoading && reviewsLoading && (!cycles || cycles.length === 0) && (!userReviews || userReviews.length === 0)

  if (showSkeleton) {
    return (
      <div className="min-h-screen bg-gray-50/50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <div className="h-96 bg-gray-200 rounded-2xl"></div>
              <div className="h-24 bg-gray-200 rounded-xl"></div>
              <div className="h-24 bg-gray-200 rounded-xl"></div>
            </div>
            <div className="h-96 bg-gray-200 rounded-2xl"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50/50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div className="flex items-start space-x-4">
            <button
              onClick={() => router.back()}
              className="mt-1 p-2 rounded-full hover:bg-gray-200 transition-colors text-gray-500 hover:text-gray-900"
              aria-label="Go back"
            >
              <ArrowLeftIcon className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Performance Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">Manage your reviews, track progress, and view insights.</p>
            </div>
          </div>
          {canManageCycles && (
            <div className="mt-4 md:mt-0">
              <Button onClick={() => setIsCreateModalOpen(true)} className="shadow-lg shadow-blue-500/30">
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                New Review Cycle
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-10">
          {stats.map((item) => (
            <div
              key={item.name}
              className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 rounded-md p-3 ${item.bg}`}>
                    <item.icon className={`h-6 w-6 ${item.color}`} aria-hidden="true" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">{item.name}</dt>
                      <dd>
                        <div className="text-2xl font-bold text-gray-900">{item.value}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden min-h-[500px]">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
              {[
                { label: "Active Cycles", key: "active" as TabKey },
                { label: "Past Reviews", key: "past" as TabKey },
                { label: "Team Overview", key: "team" as TabKey },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.key
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === "active" && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Pending Reviews</h2>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {pendingCycles.map((cycle: any) => (
                      <ReviewCycleCard
                        key={cycle.id}
                        cycle={cycle}
                        isSubmitted={false}
                        onSelect={(c) => {
                          setSelectedCycle(c)
                          setIsReviewModalOpen(true)
                        }}
                      />
                    ))}
                    {pendingCycles.length === 0 && (
                      <div className="col-span-full flex flex-col items-center justify-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                        <ClipboardDocumentCheckIcon className="h-12 w-12 text-gray-300 mb-3" />
                        <p className="text-gray-500 font-medium">No pending reviews.</p>
                        <p className="text-sm text-gray-400">You&apos;re all caught up!</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "past" && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Completed Reviews</h2>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {completedCycles.map((cycle: any) => (
                      <ReviewCycleCard
                        key={cycle.id}
                        cycle={cycle}
                        isSubmitted={true}
                        onSelect={(c) => {
                          setSelectedCycle(c)
                          setIsReviewModalOpen(true)
                        }}
                      />
                    ))}
                    {completedCycles.length === 0 && (
                      <div className="col-span-full flex flex-col items-center justify-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                        <CheckCircleIcon className="h-12 w-12 text-gray-300 mb-3" />
                        <p className="text-gray-500 font-medium">No past reviews found.</p>
                        <p className="text-sm text-gray-400">Complete a review cycle to see it here.</p>
                      </div>
                    )}
                  </div>
                </div>

                {summary && (
                  <div className="mt-8 animate-fade-in-up">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Latest Insights</h2>
                    <FeedbackSummary summary={summary} isLoading={summarizeMutation.isPending} />
                  </div>
                )}
              </div>
            )}

            {activeTab === "team" && (
              <div className="text-center py-20">
                <p className="text-gray-500">Team performance overview will appear here.</p>
              </div>
            )}
          </div>
        </div>

        {selectedCycle && (
          <ReviewForm
            isOpen={isReviewModalOpen}
            onClose={() => {
              setIsReviewModalOpen(false)
              setSelectedCycle(null)
            }}
            onSubmit={handleSubmitReview}
            cycleTitle={selectedCycle.title}
            readOnly={!!selectedReview}
            initialData={selectedReview}
          />
        )}

        <CreateCycleModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateCycle}
          loading={createCycleMutation.isPending}
        />

        {canManageCycles && (
          <div className="mt-6 flex justify-end">
            <Button onClick={generateSummary} loading={summarizeMutation.isPending}>
              Generate Summary
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

function CheckCircleIcon(props: any) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}
