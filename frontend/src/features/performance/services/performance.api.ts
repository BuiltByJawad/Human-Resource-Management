import api from '@/lib/axios'
import type {
  CreatePerformanceCyclePayload,
  PerformanceReview,
  PerformanceSummaryRequest,
  PerformanceSummaryResponse,
  ReviewCycle,
  SubmitPerformanceReviewPayload,
} from '@/features/performance/types/performance.types'

const withAuthConfig = (token?: string) => (token ? { headers: { Authorization: `Bearer ${token}` } } : undefined)

export async function fetchPerformanceCycles(token?: string): Promise<ReviewCycle[]> {
  const response = await api.get('/performance/cycles', withAuthConfig(token))
  const payload = response.data?.data ?? response.data
  return Array.isArray(payload) ? (payload as ReviewCycle[]) : []
}

export async function fetchPerformanceReviews(userId: string, token?: string): Promise<PerformanceReview[]> {
  if (!userId) return []
  const response = await api.get(`/performance/reviews/${userId}`, withAuthConfig(token))
  const payload = response.data?.data ?? response.data
  return Array.isArray(payload) ? (payload as PerformanceReview[]) : []
}

export async function createPerformanceCycle(
  data: CreatePerformanceCyclePayload,
  token?: string,
): Promise<ReviewCycle> {
  const response = await api.post('/performance/cycles', data, withAuthConfig(token))
  const payload = response.data?.data ?? response.data
  return payload as ReviewCycle
}

export async function submitPerformanceReview(
  payload: SubmitPerformanceReviewPayload,
  token?: string,
): Promise<PerformanceReview> {
  const response = await api.post('/performance/reviews', payload, withAuthConfig(token))
  const payloadData = response.data?.data ?? response.data
  return payloadData as PerformanceReview
}

export async function summarizePerformanceReviews(
  payload: PerformanceSummaryRequest,
  token?: string,
): Promise<PerformanceSummaryResponse> {
  const response = await api.post('/performance/reviews/summarize', payload, withAuthConfig(token))
  const payloadData = response.data?.data ?? response.data
  return (payloadData ?? {}) as PerformanceSummaryResponse
}
