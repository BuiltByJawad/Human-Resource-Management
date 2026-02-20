"use client"

import dynamic from 'next/dynamic'

const ChartBarIcon = dynamic(() => import('@heroicons/react/24/outline').then((mod) => mod.ChartBarIcon), { ssr: false })
const ClipboardDocumentCheckIcon = dynamic(
  () => import('@heroicons/react/24/outline').then((mod) => mod.ClipboardDocumentCheckIcon),
  { ssr: false }
)
const CheckCircleIcon = dynamic(
  () => import('@heroicons/react/24/outline').then((mod) => mod.CheckCircleIcon),
  { ssr: false }
)

import { Button } from '@/components/ui/FormComponents'
const ReviewForm = dynamic(() => import('@/components/hrm/performance').then((mod) => mod.ReviewForm), { ssr: false })
const CreateCycleModal = dynamic(() => import('@/components/hrm/performance').then((mod) => mod.CreateCycleModal), {
  ssr: false,
})
import {
  PerformanceHeader,
  StatsGrid,
  PerformanceTabs,
  PendingCyclesSection,
  CompletedCyclesSection,
} from '@/components/features/performance'
import { usePerformancePage } from '@/hooks/usePerformancePage'
import type { PerformanceReview, ReviewCycle } from '@/services/performance/api'

interface PerformancePageClientProps {
  initialCycles?: ReviewCycle[]
  initialReviews?: PerformanceReview[]
  currentUserId?: string | null
  canManageCycles?: boolean
}

export function PerformancePageClient({
  initialCycles = [],
  initialReviews = [],
  currentUserId = null,
  canManageCycles: initialCanManageCycles = false,
}: PerformancePageClientProps) {
  const {
    activeTab,
    handleTabChange,
    stats,
    pendingCycles,
    completedCycles,
    selectedCycle,
    selectedReviewInitialData,
    reviewReadOnly,
    isReviewModalOpen,
    openReview,
    closeReview,
    handleSubmitReview,
    isCreateModalOpen,
    setIsCreateModalOpen,
    handleCreateCycle,
    createCycleLoading,
    summary,
    generateSummary,
    summarizeLoading,
    canManageCycles,
    showSkeleton,
    mounted,
  } = usePerformancePage({
    initialCycles,
    initialReviews,
    currentUserId,
    initialCanManageCycles,
  })

  if (!mounted) return null

  if (showSkeleton) {
    return (
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 rounded w-1/4" />
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <div className="h-96 bg-gray-200 rounded-2xl" />
              <div className="h-24 bg-gray-200 rounded-xl" />
              <div className="h-24 bg-gray-200 rounded-xl" />
            </div>
            <div className="h-96 bg-gray-200 rounded-2xl" />
          </div>
        </div>
      </div>
    )
  }

  const statsWithIcons = stats.map((item) => {
    if (item.name === 'Pending Reviews') {
      return { ...item, icon: <ClipboardDocumentCheckIcon className={`h-6 w-6 ${item.color}`} aria-hidden="true" /> }
    }
    if (item.name === 'Completed Reviews') {
      return { ...item, icon: <ChartBarIcon className={`h-6 w-6 ${item.color}`} aria-hidden="true" /> }
    }
    return { ...item, icon: <ChartBarIcon className={`h-6 w-6 ${item.color}`} aria-hidden="true" /> }
  })

  return (
    <>
      <div className="p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          <PerformanceHeader
            title="Performance Dashboard"
            subtitle="Manage your reviews, track progress, and view insights."
            canManageCycles={canManageCycles}
            onCreateCycle={() => setIsCreateModalOpen(true)}
          />

          <StatsGrid stats={statsWithIcons} />

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden min-h-[500px]">
            <PerformanceTabs activeTab={activeTab} onChange={handleTabChange} />

            <div className="p-4 sm:p-6">
              {activeTab === 'active' && <PendingCyclesSection cycles={pendingCycles} onSelect={openReview} />}

              {activeTab === 'past' && (
                <CompletedCyclesSection
                  cycles={completedCycles}
                  summary={summary}
                  isSummaryLoading={summarizeLoading}
                  onSelect={openReview}
                />
              )}

              {activeTab === 'team' && (
                <div className="text-center py-20">
                  <p className="text-gray-500">Team performance overview will appear here.</p>
                </div>
              )}
            </div>
          </div>

          {selectedCycle && (
            <ReviewForm
              isOpen={isReviewModalOpen}
              onClose={closeReview}
              onSubmit={handleSubmitReview}
              cycleTitle={selectedCycle.title}
              readOnly={reviewReadOnly}
              initialData={selectedReviewInitialData}
            />
          )}

          <CreateCycleModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onSubmit={handleCreateCycle}
            loading={createCycleLoading}
          />

          {canManageCycles && (
            <div className="mt-6 flex justify-end">
              <Button onClick={generateSummary} loading={summarizeLoading}>
                Generate Summary
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
