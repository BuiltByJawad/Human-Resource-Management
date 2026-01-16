import {
  fetchPerformanceCycles,
  fetchPerformanceReviews,
  createPerformanceCycle,
  submitPerformanceReview,
  summarizePerformanceReviews,
} from '@/lib/hrmData'
import type {
  ReviewCycle,
  PerformanceReview,
  CreatePerformanceCyclePayload,
  SubmitPerformanceReviewPayload,
  PerformanceSummaryRequest,
  PerformanceSummaryResponse,
} from '@/types/hrm'

export type {
  ReviewCycle,
  PerformanceReview,
  CreatePerformanceCyclePayload,
  SubmitPerformanceReviewPayload,
  PerformanceSummaryRequest,
  PerformanceSummaryResponse,
}

export const getPerformanceCycles = (token?: string) => fetchPerformanceCycles(token)

export const getPerformanceReviews = (employeeId: string, token?: string) => fetchPerformanceReviews(employeeId, token)

export const createPerformanceCycleApi = (payload: CreatePerformanceCyclePayload, token?: string) =>
  createPerformanceCycle(payload, token)

export const submitPerformanceReviewApi = (payload: SubmitPerformanceReviewPayload, token?: string) =>
  submitPerformanceReview(payload, token)

export const summarizePerformanceReviewsApi = (payload: PerformanceSummaryRequest, token?: string) =>
  summarizePerformanceReviews(payload, token)
