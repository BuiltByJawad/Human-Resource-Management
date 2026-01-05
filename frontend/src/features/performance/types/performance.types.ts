export interface ReviewCycle {
  id: string
  title: string
  startDate: string
  endDate: string
  status: string
}

export type PerformanceReviewStatus = 'pending' | 'in_progress' | 'completed' | 'closed'

export interface PerformanceReview {
  id: string
  cycleId: string
  ratings?: Record<string, number>
  comments?: string
}

export interface CreatePerformanceCyclePayload {
  title: string
  startDate: string
  endDate: string
}

export interface SubmitPerformanceReviewPayload {
  employeeId: string
  reviewerId: string
  cycleId: string
  type: string
  ratings: Record<string, number>
  comments: string
}

export interface PerformanceSummaryRequest {
  reviews: Array<{
    ratings?: Record<string, number>
    comments?: string
  }>
}

export interface PerformanceSummaryResponse {
  summary?: string
}
