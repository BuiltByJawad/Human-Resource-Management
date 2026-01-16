"use client"

import { ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline'

import { ReviewCycleCard, type ReviewCycle } from '@/components/hrm/performance'

interface PendingCyclesSectionProps {
  cycles: ReviewCycle[]
  onSelect: (cycle: ReviewCycle) => void
}

export function PendingCyclesSection({ cycles, onSelect }: PendingCyclesSectionProps) {
  return (
    <div>
      <h2 className="text-lg font-medium text-gray-900 mb-4">Pending Reviews</h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cycles.map((cycle, index) => (
          <ReviewCycleCard
            key={
              typeof cycle?.id === 'string' && cycle.id
                ? cycle.id
                : `cycle-${String(cycle?.title ?? 'unknown')}-${String(cycle?.startDate ?? 'unknown')}-${String(
                    cycle?.endDate ?? 'unknown',
                  )}-${index}`
            }
            cycle={cycle}
            isSubmitted={false}
            onSelect={onSelect}
          />
        ))}
        {cycles.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            <ClipboardDocumentCheckIcon className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No pending reviews.</p>
            <p className="text-sm text-gray-400">You&apos;re all caught up!</p>
          </div>
        )}
      </div>
    </div>
  )}
